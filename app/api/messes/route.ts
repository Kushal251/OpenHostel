import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";
import { cleanMessInput, hasValidMessHostel, messInclude } from "@/lib/mess";
import { getAdminMessDirectory, getMemberMessDirectory } from "@/lib/mess-directory";

export async function GET() {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const messes = session.user.role === "MESS_MANAGER"
      ? await getMemberMessDirectory(session.user.id)
      : await getAdminMessDirectory();
    return NextResponse.json(messes);
  } catch (error) {
    console.error("Unable to load mess directory after database retries.", error);
    return NextResponse.json(
      { error: "The database connection is temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireStaff();
  if (!session || !["ADMIN", "MESS_MANAGER"].includes(session.user.role))
    return NextResponse.json(
      { error: "Only an admin or mess manager can create a mess." },
      { status: 403 },
    );
  try {
    const body = await request.json();
    const input = cleanMessInput(body);
    if (!input.name || !input.hostel || input.phoneNumbers.length === 0)
      return NextResponse.json(
        {
          error:
            "Mess name, hostel and at least one mobile number are required.",
        },
        { status: 400 },
      );
    if (!hasValidMessHostel(input))
      return NextResponse.json(
        { error: "Please select a valid hostel." },
        { status: 400 },
      );
    if (input.mealWindows.some((window) => window.startTime >= window.endTime))
      return NextResponse.json(
        { error: "Each meal window must have a valid start and end time." },
        { status: 400 },
      );
    const managerId =
      session.user.role === "ADMIN" && body.managerId
        ? String(body.managerId)
        : session.user.id;
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== "MESS_MANAGER")
      return NextResponse.json(
        { error: "Please assign an active mess manager." },
        { status: 400 },
      );
    const mess = await prisma.mess.create({
      data: {
        ...input,
        hostel: input.hostel,
        managerId,
        mealWindows: { create: input.mealWindows },
      },
      include: messInclude,
    });
    revalidateTag("mess-directory", "max");
    revalidateTag("home-messes", "max");
    revalidateTag("mess-profile", "max");
    return NextResponse.json(mess, { status: 201 });
  } catch (error) {
    const duplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";
    return NextResponse.json(
      {
        error: duplicate
          ? "This hostel already has a mess. One hostel can have only one mess."
          : "Could not create the mess.",
      },
      { status: 400 },
    );
  }
}

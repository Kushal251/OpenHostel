import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/access";
import {
  canManageMess,
  canViewMess,
  cleanMessInput,
  hasValidMessHostel,
  getMess,
  messInclude,
} from "@/lib/mess";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mess = await getMess((await params).id);
  if (!mess)
    return NextResponse.json({ error: "Mess not found" }, { status: 404 });
  if (!canViewMess(session.user.role, session.user.id, mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json(mess);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await params).id;
  const current = await getMess(id);
  if (!current)
    return NextResponse.json({ error: "Mess not found" }, { status: 404 });
  if (!canManageMess(session.user.role, session.user.id, current))
    return NextResponse.json(
      { error: "Only this mess manager or an admin can edit it." },
      { status: 403 },
    );
  try {
    const body = await request.json();
    const input = cleanMessInput(body);
    if (!input.name || !input.hostel || input.phoneNumbers.length === 0)
      return NextResponse.json(
        { error: "Mess name, hostel and one mobile number are required." },
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
        : current.managerId;
    const updated = await prisma.mess.update({
      where: { id },
      data: {
        ...input,
        hostel: input.hostel,
        managerId,
        mealWindows: { deleteMany: {}, create: input.mealWindows },
      },
      include: messInclude,
    });
    revalidateTag("mess-directory", "max");
    revalidateTag("home-messes", "max");
    revalidateTag("mess-profile", "max");
    return NextResponse.json(updated);
  } catch (error) {
    const duplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";
    return NextResponse.json(
      {
        error: duplicate
          ? "This hostel already has a mess."
          : "Could not update the mess.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { error: "Only admins can delete a mess." },
      { status: 403 },
    );
  const id = (await params).id;
  try {
    await prisma.mess.delete({ where: { id } });
    revalidateTag("mess-directory", "max");
    revalidateTag("home-messes", "max");
    revalidateTag("mess-profile", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const missing =
      typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
    return NextResponse.json(
      { error: missing ? "Mess not found." : "Could not delete the mess." },
      { status: missing ? 404 : 400 },
    );
  }
}

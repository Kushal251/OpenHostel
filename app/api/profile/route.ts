import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedUserProfile, userProfileSelect } from "@/lib/user-profile";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (new URL(request.url).searchParams.get("refresh") === "true")
    revalidateTag("user-profiles", { expire: 0 });
  const user = await getCachedUserProfile(session.user.id);
  return user
    ? NextResponse.json(user)
    : NextResponse.json({ error: "Profile not found." }, { status: 404 });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Only an admin can edit their own profile." },
        { status: 403 },
      );
    const body = await request.json();
    const data: Record<string, string | null> = {};
    for (const key of ["firstName", "lastName", "phone", "photoUrl"] as const) {
      if (body[key] !== undefined)
        data[key] = body[key] === null ? null : String(body[key]).trim();
    }
    if (body.email !== undefined)
      data.email = String(body.email).trim().toLowerCase();
    if (Object.keys(data).length === 0)
      return NextResponse.json(
        { error: "No changes were provided." },
        { status: 400 },
      );
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: userProfileSelect,
    });
    revalidateTag("user-profiles", { expire: 0 });
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
          ? "This Gmail is already in use."
          : "Profile could not be updated.",
      },
      { status: 400 },
    );
  }
}

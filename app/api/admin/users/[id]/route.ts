import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { adminUserSelect, getCachedAdminUserDetail } from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const user = await getCachedAdminUserDetail(id);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (current.role !== "STUDENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can edit authority profiles." }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    const textFields = ["firstName", "lastName", "phone", "college", "branch", "hostel", "roomNumber", "photoUrl"] as const;
    for (const key of textFields) {
      if (body[key] !== undefined) data[key] = body[key] === null ? null : String(body[key]).trim();
    }
    if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
    if (body.enrollmentNo !== undefined) data.enrollmentNo = String(body.enrollmentNo).trim().toUpperCase();
    if (body.passingYear !== undefined) {
      const year = Number(body.passingYear);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return NextResponse.json({ error: "Please enter a valid passing year." }, { status: 400 });
      }
      data.passingYear = year;
    }
    if (body.status !== undefined) data.status = String(body.status);
    if (body.password && session.user.role === "ADMIN") data.passwordHash = await bcrypt.hash(String(body.password), 10);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No profile changes were provided." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: adminUserSelect,
    });
    revalidateTag("admin-user-pages", { expire: 0 });
    revalidateTag("admin-user-summary", { expire: 0 });
    revalidateTag("admin-user-details", { expire: 0 });
    revalidateTag("user-profiles", { expire: 0 });
    return NextResponse.json(updated);
  } catch (error) {
    const isDuplicate = typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
    return NextResponse.json(
      { error: isDuplicate ? "This Gmail or enrollment number is already in use." : "Student profile could not be updated." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Only admins can remove accounts." }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.role !== "STUDENT" || user.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending student applications can be rejected." }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  revalidateTag("admin-user-pages", { expire: 0 });
  revalidateTag("admin-user-summary", { expire: 0 });
  revalidateTag("admin-user-details", { expire: 0 });
  revalidateTag("user-profiles", { expire: 0 });
  return NextResponse.json({ ok: true, id });
}

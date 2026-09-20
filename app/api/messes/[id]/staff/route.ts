import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";
import { canManageMess } from "@/lib/mess";
import {
  getCachedAvailableStaffPage,
  getCachedMessStaffPage,
  MESS_STAFF_PAGE_SIZE,
  staffUserSelect,
} from "@/lib/mess-staff-queue";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mess = await prisma.mess.findUnique({
    where: { id: (await params).id },
    select: { id: true, managerId: true },
  });
  if (!mess || !canManageMess(session.user.role, session.user.id, mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const searchParams = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  if (searchParams.get("scope") === "directory") {
    const query = (searchParams.get("q") || "").trim().toLowerCase().slice(0, 120);
    const result = await getCachedAvailableStaffPage(mess.id, mess.managerId, page, query);
    return NextResponse.json({
      ...result,
      page,
      pageSize: MESS_STAFF_PAGE_SIZE,
      hasNext: page * MESS_STAFF_PAGE_SIZE < result.total,
    });
  }
  const result = await getCachedMessStaffPage(mess.id, page);
  return NextResponse.json({
    ...result,
    page,
    pageSize: MESS_STAFF_PAGE_SIZE,
    hasNext: page * MESS_STAFF_PAGE_SIZE < result.total,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mess = await prisma.mess.findUnique({
    where: { id: (await params).id },
    select: { id: true, managerId: true },
  });
  if (!mess || !canManageMess(session.user.role, session.user.id, mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { userId } = await request.json();
  if (!userId)
    return NextResponse.json(
      { error: "Select a user first." },
      { status: 400 },
    );
  try {
    const item = await prisma.messStaff.create({
      data: { messId: mess.id, userId: String(userId) },
      include: { user: { select: staffUserSelect } },
    });
    revalidateTag("mess-directory", "max");
    revalidateTag("mess-profile", "max");
    revalidateTag("mess-staff-queue", "max");
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "This person is already on the mess staff list." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mess = await prisma.mess.findUnique({
    where: { id: (await params).id },
    select: { id: true, managerId: true },
  });
  if (!mess || !canManageMess(session.user.role, session.user.id, mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { userId } = await request.json();
  await prisma.messStaff.delete({
    where: { messId_userId: { messId: mess.id, userId: String(userId) } },
  });
  revalidateTag("mess-directory", "max");
  revalidateTag("mess-profile", "max");
  revalidateTag("mess-staff-queue", "max");
  return NextResponse.json({ ok: true });
}

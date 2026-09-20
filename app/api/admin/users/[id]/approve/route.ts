import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { adminUserSelect } from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";

function tempPassword() { return `TM${Math.floor(100000 + Math.random() * 900000)}`; }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { roomNumber } = await request.json();
  if (!roomNumber) return NextResponse.json({ error: "Room number is required before approval." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Pending student not found." }, { status: 404 });
  const password = tempPassword();
  const updated = await prisma.user.update({
    where: { id },
    data: {
      roomNumber: String(roomNumber),
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: session.user.id,
      passwordHash: await bcrypt.hash(password, 10),
      temporaryPassword: password,
      mustChangePassword: true
    },
    select: adminUserSelect,
  });
  revalidateTag("admin-user-pages", { expire: 0 });
  revalidateTag("admin-user-summary", { expire: 0 });
  revalidateTag("admin-user-details", { expire: 0 });
  revalidateTag("user-profiles", { expire: 0 });
  return NextResponse.json({ password, username: user.username, user: updated });
}

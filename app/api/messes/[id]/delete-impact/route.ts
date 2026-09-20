import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { error: "Only admins can delete a mess." },
      { status: 403 },
    );

  const messId = (await params).id;
  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    select: { id: true, name: true },
  });
  if (!mess)
    return NextResponse.json({ error: "Mess not found." }, { status: 404 });

  const passes = await prisma.messPassRequest.findMany({
    where: {
      messId,
      OR: [
        { status: "PENDING" },
        { status: "ACTIVE", expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      status: true,
      requestedDays: true,
      finalDays: true,
      startsAt: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          enrollmentNo: true,
          roomNumber: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const groups = new Map<
    string,
    {
      id: string;
      status: "ACTIVE" | "PENDING";
      days: number;
      users: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        enrollmentNo: string | null;
        roomNumber: string | null;
        startsAt: Date | null;
        expiresAt: Date | null;
        requestedAt: Date;
      }[];
    }
  >();

  for (const pass of passes) {
    const status = pass.status as "ACTIVE" | "PENDING";
    const days = pass.finalDays || pass.requestedDays;
    const id = `${status}-${days}`;
    const group = groups.get(id) || { id, status, days, users: [] };
    group.users.push({
      ...pass.user,
      startsAt: pass.startsAt,
      expiresAt: pass.expiresAt,
      requestedAt: pass.createdAt,
    });
    groups.set(id, group);
  }

  return NextResponse.json({
    messName: mess.name,
    totalAffected: passes.length,
    groups: [...groups.values()].sort(
      (a, b) => a.status.localeCompare(b.status) || a.days - b.days,
    ),
  });
}

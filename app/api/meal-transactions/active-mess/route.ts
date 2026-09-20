import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth(); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pass = await prisma.messPassRequest.findFirst({ where: { userId: session.user.id, status: "ACTIVE", startsAt: { lte: new Date() }, expiresAt: { gte: new Date() } }, select: { mess: { select: { id: true, name: true } } }, orderBy: { expiresAt: "asc" } });
  const mess = pass?.mess || await prisma.mess.findFirst({ select: { id: true, name: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ mess: mess || null, userName: session.user.name || "Student" });
}

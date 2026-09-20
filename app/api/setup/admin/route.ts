import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const existing = await prisma.user.count({ where: { role: "ADMIN" } });
  if (existing)
    return NextResponse.json(
      { error: "An admin account already exists. Please sign in." },
      { status: 403 },
    );
  const body = await request.json();
  if (!body.name || !body.email || !body.password || !body.uniqueId)
    return NextResponse.json(
      { error: "Name, Gmail, unique ID and password are required." },
      { status: 400 },
    );
  try {
    await prisma.user.create({
      data: {
        username: String(body.uniqueId).toUpperCase(),
        uniqueId: String(body.uniqueId).toUpperCase(),
        email: String(body.email).toLowerCase(),
        passwordHash: await bcrypt.hash(String(body.password), 10),
        role: "ADMIN",
        status: "ACTIVE",
        firstName: String(body.name),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Email or unique ID already exists." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 },
      );
    const { password, confirmPassword, skip } = await request.json();
    if (!skip && (!password || String(password).length < 8))
      return NextResponse.json(
        { error: "Password must contain at least 8 characters." },
        { status: 400 },
      );
    if (!skip && password !== confirmPassword)
      return NextResponse.json(
        { error: "New password and confirm password do not match." },
        { status: 400 },
      );
    const cookieStore = await cookies();

    if (skip) {
      cookieStore.set("openhostel-onboarding-skipped", session.user.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
      return NextResponse.json({ ok: true, skipped: true });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: await bcrypt.hash(String(password), 10),
        temporaryPassword: null,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    cookieStore.set("openhostel-onboarding-skipped", session.user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return NextResponse.json({ ok: true, passwordChanged: true });
  } catch (error) {
    console.error("Password change failed", error);
    return NextResponse.json(
      { error: "Password could not be changed. Please try again." },
      { status: 500 },
    );
  }
}

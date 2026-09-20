import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isHostel } from "@/lib/hostel";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = [
      "firstName",
      "lastName",
      "email",
      "college",
      "branch",
      "hostel",
      "passingYear",
      "enrollmentNo",
    ];
    if (required.some((field) => !body[field])) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 },
      );
    }
    if (body.college !== "UIT RGPV")
      return NextResponse.json(
        { error: "Only UIT RGPV is currently available." },
        { status: 400 },
      );
    if (!isHostel(body.hostel))
      return NextResponse.json(
        { error: "Please select a valid hostel." },
        { status: 400 },
      );

    const enrollmentNo = String(body.enrollmentNo).trim().toUpperCase();
    const user = await prisma.user.create({
      data: {
        username: `STU-${enrollmentNo}`,
        email: String(body.email).trim().toLowerCase(),
        passwordHash: await bcrypt.hash(`PENDING-${crypto.randomUUID()}`, 10),
        role: "STUDENT",
        status: "PENDING",
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        phone: body.phone ? String(body.phone).trim() : null,
        photoUrl: body.photoUrl ? String(body.photoUrl) : null,
        college: "UIT RGPV",
        branch: String(body.branch),
        hostel: body.hostel,
        passingYear: Number(body.passingYear),
        enrollmentNo,
      },
    });
    return NextResponse.json(
      { id: user.id, message: "Application sent for verification." },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "This email or enrollment number is already registered."
        : "Could not submit the application. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

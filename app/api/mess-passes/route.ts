import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(
      await prisma.messPassRequest.findMany({
        where: { userId: session.user.id },
        include: {
          mess: { select: { id: true, name: true, hostel: true } },
          offer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Pass history is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json(
      { error: "Please sign in to request a pass." },
      { status: 401 },
    );
  try {
    const { messId, offerId } = await request.json();
    const offer = await prisma.messPassOffer.findFirst({
      where: { id: String(offerId), messId: String(messId), active: true },
    });
    if (!offer)
      return NextResponse.json(
        { error: "This offer is no longer available." },
        { status: 400 },
      );
    const existing = await prisma.messPassRequest.findFirst({
      where: {
        messId: offer.messId,
        userId: session.user.id,
        status: "PENDING",
      },
    });
    if (existing)
      return NextResponse.json(
        { error: "You already have a pending request for this mess." },
        { status: 400 },
      );
    const pass = await prisma.messPassRequest.create({
      data: {
        messId: offer.messId,
        userId: session.user.id,
        offerId: offer.id,
        requestedDays: offer.days,
        requestedPrice: offer.price,
      },
    });
    revalidateTag("mess-pass-queue", "max");
    revalidateTag("pass-purchase-history", { expire: 0 });
    return NextResponse.json(pass, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not send the pass request. Please try again." },
      { status: 503 },
    );
  }
}

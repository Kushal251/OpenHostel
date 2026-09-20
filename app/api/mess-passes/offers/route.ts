import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canManageMess, getMess } from "@/lib/mess";

export async function POST(request: Request) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { messId, title, days, price } = await request.json();
    const mess = await getMess(String(messId));
    if (!mess || !canManageMess(session.user.role, session.user.id, mess))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const duration = Number(days),
      amount = Number(price);
    if (!title || duration < 10 || amount < 0)
      return NextResponse.json(
        { error: "Use a title, minimum 10 days, and valid amount." },
        { status: 400 },
      );
    const offer = await prisma.messPassOffer.create({
      data: {
        messId: mess.id,
        title: String(title).trim(),
        days: duration,
        price: amount,
      },
    });
    revalidateTag("mess-profile", "max");
    revalidateTag("mess-pass-offers", { expire: 0 });
    return NextResponse.json(offer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not add the offer." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, active } = await request.json();
  const offer = await prisma.messPassOffer.findUnique({
    where: { id: String(id) },
    include: { mess: true },
  });
  if (!offer || !canManageMess(session.user.role, session.user.id, offer.mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const updated = await prisma.messPassOffer.update({
    where: { id: offer.id },
    data: { active: Boolean(active) },
  });
  revalidateTag("mess-profile", "max");
  revalidateTag("mess-pass-offers", { expire: 0 });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const offer = await prisma.messPassOffer.findUnique({
    where: { id: String(id) },
    include: { mess: true },
  });
  if (!offer || !canManageMess(session.user.role, session.user.id, offer.mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  await prisma.messPassOffer.delete({ where: { id: offer.id } });
  revalidateTag("mess-profile", "max");
  revalidateTag("mess-pass-offers", { expire: 0 });
  return NextResponse.json({ ok: true });
}

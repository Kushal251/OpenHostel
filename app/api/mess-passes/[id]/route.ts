import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canManageMess, getMess } from "@/lib/mess";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const item = await prisma.messPassRequest.findUnique({
      where: { id: (await params).id },
    });
    if (!item)
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    const mess = await getMess(item.messId);
    if (!mess || !canManageMess(session.user.role, session.user.id, mess))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { status, days, amount, startsAt: startDate } = await request.json();
    if (status === "REJECTED") {
      const updated = await prisma.messPassRequest.update({
        where: { id: item.id },
        data: {
          status: "REJECTED",
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });
      revalidateTag("home-active-pass", "max");
      revalidateTag("mess-profile-pass", "max");
      revalidateTag("mess-pass-queue", "max");
      revalidateTag("pass-purchase-history", { expire: 0 });
      return NextResponse.json(updated);
    }
    const finalDays = Number(days),
      finalAmount = Number(amount);
    const startsAt = new Date(`${String(startDate)}T00:00:00`);
    if (
      item.status !== "PENDING" ||
      finalDays < 1 ||
      finalAmount < 0 ||
      Number.isNaN(startsAt.getTime())
    )
      return NextResponse.json(
        { error: "Enter a valid start date, days and payment amount." },
        { status: 400 },
      );
    const activePass = await prisma.messPassRequest.findFirst({
      where: {
        messId: item.messId,
        userId: item.userId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        id: { not: item.id },
      },
      orderBy: { expiresAt: "desc" },
    });
    if (activePass?.expiresAt) {
      const startsAtUpgrade = new Date(activePass.expiresAt);
      startsAtUpgrade.setDate(startsAtUpgrade.getDate() + 1);
      const upgradedExpiry = new Date(activePass.expiresAt);
      upgradedExpiry.setDate(upgradedExpiry.getDate() + finalDays);
      const [current, receipt] = await prisma.$transaction([
        prisma.messPassRequest.update({
          where: { id: activePass.id },
          data: { expiresAt: upgradedExpiry },
        }),
        prisma.messPassRequest.update({
          where: { id: item.id },
          data: {
            status: "UPGRADED",
            finalDays,
            finalAmount,
            startsAt: startsAtUpgrade,
            expiresAt: upgradedExpiry,
            approvedById: session.user.id,
            approvedAt: new Date(),
          },
        }),
      ]);
      revalidateTag("home-active-pass", "max");
      revalidateTag("mess-profile-pass", "max");
      revalidateTag("mess-pass-queue", "max");
      revalidateTag("pass-purchase-history", { expire: 0 });
      return NextResponse.json({ pass: current, upgradeReceipt: receipt });
    }
    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + finalDays - 1);
    const updated = await prisma.messPassRequest.update({
      where: { id: item.id },
      data: {
        status: "ACTIVE",
        finalDays,
        finalAmount,
        startsAt,
        expiresAt,
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });
    revalidateTag("home-active-pass", "max");
    revalidateTag("mess-profile-pass", "max");
    revalidateTag("mess-pass-queue", "max");
    revalidateTag("pass-purchase-history", { expire: 0 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Could not update this request." },
      { status: 400 },
    );
  }
}

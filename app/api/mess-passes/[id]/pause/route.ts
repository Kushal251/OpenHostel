import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { error: "Only admins can pause a mess pass." },
      { status: 403 },
    );

  const days = Number((await request.json()).days);
  if (!Number.isInteger(days) || days < 1 || days > 365)
    return NextResponse.json(
      { error: "Enter a pause period between 1 and 365 days." },
      { status: 400 },
    );

  const id = (await params).id;
  const pass = await prisma.messPassRequest.findUnique({ where: { id } });
  const now = new Date();
  if (
    !pass ||
    pass.status !== "ACTIVE" ||
    !pass.expiresAt ||
    pass.expiresAt < now
  )
    return NextResponse.json(
      { error: "Only a currently active pass can be paused." },
      { status: 400 },
    );
  if (pass.pauseEndsAt && pass.pauseEndsAt > now)
    return NextResponse.json(
      { error: "This pass is already paused." },
      { status: 400 },
    );

  const updated = await prisma.messPassRequest.update({
    where: { id },
    data: {
      pauseStartedAt: now,
      pauseEndsAt: addDays(now, days),
      pauseOriginalExpiresAt: pass.expiresAt,
      pausePlannedDays: days,
      expiresAt: addDays(pass.expiresAt, days),
    },
  });
  await prisma.dailyMessPassValidation.deleteMany({ where: { passId: id } });
  revalidateTag("home-active-pass", "max");
  revalidateTag("mess-profile-pass", "max");
  revalidateTag("mess-pass-queue", "max");
  return NextResponse.json(updated);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { error: "Only admins can resume a mess pass." },
      { status: 403 },
    );

  const action = String((await request.json()).action || "");
  if (action !== "COUNT_ELAPSED" && action !== "DISCARD")
    return NextResponse.json({ error: "Choose how to resume the pass." }, { status: 400 });

  const id = (await params).id;
  const pass = await prisma.messPassRequest.findUnique({ where: { id } });
  const now = new Date();
  if (
    !pass ||
    pass.status !== "ACTIVE" ||
    !pass.pauseStartedAt ||
    !pass.pauseEndsAt ||
    !pass.pauseOriginalExpiresAt ||
    pass.pauseEndsAt <= now
  )
    return NextResponse.json(
      { error: "This pass does not have an active pause to resume." },
      { status: 400 },
    );

  const plannedDays = pass.pausePlannedDays || 0;
  const elapsedDays = Math.min(
    plannedDays,
    Math.max(0, Math.ceil((now.getTime() - pass.pauseStartedAt.getTime()) / DAY_IN_MS)),
  );
  const extensionDays = action === "COUNT_ELAPSED" ? elapsedDays : 0;
  const updated = await prisma.messPassRequest.update({
    where: { id },
    data: {
      expiresAt: addDays(pass.pauseOriginalExpiresAt, extensionDays),
      pauseStartedAt: null,
      pauseEndsAt: null,
      pauseOriginalExpiresAt: null,
      pausePlannedDays: null,
    },
  });
  revalidateTag("home-active-pass", "max");
  revalidateTag("mess-profile-pass", "max");
  revalidateTag("mess-pass-queue", "max");
  return NextResponse.json({ pass: updated, extensionDays });
}

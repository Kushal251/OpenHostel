import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentMealWindow, isMessQr, todayInIndia } from "@/lib/meal-service";
import { getCachedDailyMealWindows, getCachedDailyPassValidation } from "@/lib/daily-meal-cache";

export async function POST(request: Request) {
  const session = await auth(); if (!session?.user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { messId, qr, confirm, mealWindowId, refreshWindows } = await request.json();
  if (refreshWindows) {
    if (!messId) return NextResponse.json({ error: "Mess is required." }, { status: 400 });
    const serviceDate = todayInIndia();
    revalidateTag("daily-meal-windows", { expire: 0 });
    const windows = await getCachedDailyMealWindows(String(messId), serviceDate);
    return windows
      ? NextResponse.json({ refreshed: true, windows })
      : NextResponse.json({ error: "Mess not found." }, { status: 404 });
  }
  if (!messId || !isMessQr(qr, String(messId))) return NextResponse.json({ error: "This is not a valid QR for this mess." }, { status: 400 });
  const serviceDate = todayInIndia();
  const windows = await getCachedDailyMealWindows(String(messId), serviceDate);
  if (!windows) return NextResponse.json({ error: "Mess not found." }, { status: 404 });
  const dailyValidation = await getCachedDailyPassValidation(String(messId), session.user.id, serviceDate);

  if (!dailyValidation) {
    const pass = await prisma.messPassRequest.findFirst({ where: { messId: String(messId), userId: session.user.id, status: "ACTIVE", startsAt: { lte: new Date() }, expiresAt: { gte: new Date() } }, orderBy: { expiresAt: "desc" } });
    if (!pass) return NextResponse.json({ state: "NO_PASS", messId: String(messId) }, { status: 403 });
    if (pass.pauseEndsAt && pass.pauseEndsAt > new Date()) {
      const remainingDays = Math.max(1, Math.ceil((pass.pauseEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
      return NextResponse.json({ state: "PAUSED", pauseEndsAt: pass.pauseEndsAt, remainingDays }, { status: 403 });
    }
    await prisma.dailyMessPassValidation.upsert({
      where: { messId_userId_serviceDate: { messId: String(messId), userId: session.user.id, serviceDate } },
      create: { messId: String(messId), userId: session.user.id, passId: pass.id, serviceDate },
      update: { passId: pass.id, validatedAt: new Date() },
    });
    revalidateTag("daily-mess-pass-validation", { expire: 0 });
  }
  const service = currentMealWindow(windows);
  if (!service.active) return NextResponse.json({ state: "CLOSED", next: service.next && { label: service.next.label, startTime: service.next.startTime }, minutesUntilNext: service.minutesUntilNext });
  const selected = mealWindowId ? service.activeWindows.find((window) => window.id === String(mealWindowId)) : null;
  if (mealWindowId && !selected) return NextResponse.json({ error: "That meal window is no longer open." }, { status: 400 });
  if (service.activeWindows.length > 1 && !selected) return NextResponse.json({ state: "SELECT_WINDOW", windows: service.activeWindows });
  const activeWindow = selected || service.active;
  if (!confirm) return NextResponse.json({ state: "CONFIRM", window: activeWindow });
  try {
    const transaction = await prisma.mealTransaction.create({ data: { messId: String(messId), userId: session.user.id, mealWindowId: activeWindow.id, serviceDate: service.serviceDate }, include: { mess: { select: { name: true } }, mealWindow: { select: { label: true } } } });
    revalidateTag("mess-transaction-dashboard", "max");
    revalidateTag("meal-payment-history", { expire: 0 });
    return NextResponse.json({ state: "DONE", transaction, userName: session.user.name || "Student" });
  } catch {
    return NextResponse.json({ error: `Your ${activeWindow.label} meal is already recorded for today.` }, { status: 409 });
  }
}

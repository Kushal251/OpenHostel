import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedDailyMealWindows } from "@/lib/daily-meal-cache";
import { canEditTodayWindows } from "@/lib/mess";
import { effectiveMealWindows, timeToMinutes, todayInIndia } from "@/lib/meal-service";

async function managedMess(id: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "MESS_MANAGER"].includes(session.user.role)) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const mess = await prisma.mess.findUnique({ where: { id }, include: { mealWindows: { orderBy: { sortOrder: "asc" } }, staff: { where: { userId: session.user.id }, select: { userId: true } } } });
  if (!mess) return { error: NextResponse.json({ error: "Mess not found." }, { status: 404 }) };
  if (!canEditTodayWindows(session.user.role, session.user.id, mess)) return { error: NextResponse.json({ error: "You can only change timings for messes assigned to you." }, { status: 403 }) };
  return { mess };
}

async function responseFor(id: string) {
  const date = todayInIndia();
  const mess = await prisma.mess.findUnique({ where: { id }, include: { mealWindows: { orderBy: { sortOrder: "asc" } }, dailyMealWindows: { where: { serviceDate: date } } } });
  if (!mess) return null;
  return { serviceDate: date, windows: effectiveMealWindows(mess.mealWindows, mess.dailyMealWindows) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const access = await managedMess(id); if (access.error) return access.error;
  return NextResponse.json(await responseFor(id));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const access = await managedMess(id); if (access.error) return access.error;
  try {
    const body = await request.json();
    const submitted: { id: string; startTime: string; endTime: string }[] = Array.isArray(body.windows) ? body.windows.map((item: unknown) => {
      const value = item as Record<string, unknown>;
      return { id: String(value.id || ""), startTime: String(value.startTime || ""), endTime: String(value.endTime || "") };
    }) : [];
    const originalIds = new Set(access.mess.mealWindows.map((window) => window.id));
    if (submitted.length !== originalIds.size || submitted.some((window) => !originalIds.has(window.id) || !/^\d{2}:\d{2}$/.test(window.startTime) || !/^\d{2}:\d{2}$/.test(window.endTime) || timeToMinutes(window.startTime) >= timeToMinutes(window.endTime))) return NextResponse.json({ error: "Every meal needs a valid start and end time." }, { status: 400 });
    if (!body.allowOverlaps) {
      const ordered = [...submitted].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      if (ordered.some((window, index) => index > 0 && timeToMinutes(window.startTime) < timeToMinutes(ordered[index - 1].endTime))) return NextResponse.json({ error: "Meal windows overlap. Turn on ‘Allow overlaps today’ to save this schedule." }, { status: 400 });
    }
    const serviceDate = todayInIndia();
    await Promise.all(submitted.map((window) => prisma.dailyMealWindow.upsert({ where: { mealWindowId_serviceDate: { mealWindowId: window.id, serviceDate } }, create: { messId: id, mealWindowId: window.id, serviceDate, startTime: window.startTime, endTime: window.endTime }, update: { startTime: window.startTime, endTime: window.endTime } })));
    revalidateTag("daily-meal-windows", { expire: 0 });
    return NextResponse.json(await responseFor(id));
  } catch (error) {
    console.error("Unable to save daily meal windows", error);
    const detail = error instanceof Error ? error.message : "Unknown database error.";
    return NextResponse.json({ error: process.env.NODE_ENV === "development" ? `Today's timings could not be saved: ${detail}` : "Today's timings could not be saved. Please try again." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const access = await managedMess(id); if (access.error) return access.error;
  await prisma.dailyMealWindow.deleteMany({ where: { messId: id, serviceDate: todayInIndia() } });
  revalidateTag("daily-meal-windows", { expire: 0 });
  return NextResponse.json(await responseFor(id));
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const access = await managedMess(id);
  if (access.error) return access.error;
  const serviceDate = todayInIndia();
  revalidateTag("daily-meal-windows", { expire: 0 });
  const windows = await getCachedDailyMealWindows(id, serviceDate);
  return NextResponse.json({ serviceDate, windows, refreshed: true });
}

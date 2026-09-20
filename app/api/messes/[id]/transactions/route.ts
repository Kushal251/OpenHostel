import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMessOperations } from "@/lib/mess";
import {
  getCachedMessTransactionDashboardPage,
  getFreshMessTransactionDashboardPage,
  MEAL_TRANSACTION_PAGE_SIZE,
} from "@/lib/mess-transaction-dashboard";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messId = (await params).id;
  const mess = await prisma.mess.findUnique({ where: { id: messId }, select: { id: true, managerId: true, staff: { where: { userId: session.user.id }, select: { userId: true } } } });
  if (!mess || !canAccessMessOperations(session.user.role, session.user.id, mess)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const query = new URL(request.url).searchParams;
  const range = query.get("range") || "day";
  const value = query.get("value") || "";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let start = new Date(`${today}T00:00:00+05:30`);
  let end: Date | undefined;
  if (range === "week") start.setDate(start.getDate() - 6);
  if (range === "month") start.setDate(start.getDate() - 29);
  if (range === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) { start = new Date(`${value}T00:00:00+05:30`); end = new Date(start); end.setDate(end.getDate() + 1); }
  if (range === "calendar-month" && /^\d{4}-\d{2}$/.test(value)) { start = new Date(`${value}-01T00:00:00+05:30`); end = new Date(start); end.setMonth(end.getMonth() + 1); }

  const page = Math.max(1, Number.parseInt(query.get("page") || "1", 10) || 1);
  const refresh = query.get("refresh") === "true";
  if (refresh) revalidateTag("mess-transaction-dashboard", "max");
  const getPage = refresh ? getFreshMessTransactionDashboardPage : getCachedMessTransactionDashboardPage;
  const result = await getPage(messId, start.toISOString(), end?.toISOString() || "", page);
  return NextResponse.json({
    ...result,
    items: result.items.map((item) => ({ ...item, servedAt: new Date(item.servedAt).toISOString() })),
    page,
    pageSize: MEAL_TRANSACTION_PAGE_SIZE,
    hasNext: page * MEAL_TRANSACTION_PAGE_SIZE < result.total,
  });
}

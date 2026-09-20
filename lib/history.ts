import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const HISTORY_PAGE_SIZE = 5;

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function historyScope(userId: string, managerView: boolean) {
  return managerView ? { mess: { managerId: userId } } : { userId };
}

export async function getPassPurchaseHistory(userId: string, managerView: boolean, date: string, page: number) {
  const { start, end } = dayRange(date);
  const where = { ...historyScope(userId, managerView), createdAt: { gte: start, lt: end } };
  const [items, total] = await Promise.all([
    prisma.messPassRequest.findMany({
      where,
      select: {
        id: true, status: true, finalDays: true, requestedDays: true,
        finalAmount: true, requestedPrice: true, expiresAt: true, createdAt: true,
        mess: { select: { name: true } },
        user: { select: { firstName: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    prisma.messPassRequest.count({ where }),
  ]);
  return { items, total };
}

export async function getMealPaymentHistory(userId: string, managerView: boolean, date: string, page: number) {
  const where = { ...historyScope(userId, managerView), serviceDate: date };
  const [items, total] = await Promise.all([
    prisma.mealTransaction.findMany({
      where,
      select: {
        id: true, servedAt: true,
        mess: { select: { name: true } },
        mealWindow: { select: { label: true } },
        user: { select: { firstName: true, username: true } },
      },
      orderBy: { servedAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    prisma.mealTransaction.count({ where }),
  ]);
  return { items, total };
}

export const getCachedPassPurchaseHistory = unstable_cache(
  getPassPurchaseHistory,
  ["pass-purchase-history"],
  { revalidate: 432_000, tags: ["pass-purchase-history"] },
);

export const getCachedMealPaymentHistory = unstable_cache(
  getMealPaymentHistory,
  ["meal-payment-history"],
  { revalidate: 432_000, tags: ["meal-payment-history"] },
);

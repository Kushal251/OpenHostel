import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const MEAL_TRANSACTION_PAGE_SIZE = 5;

async function getDashboardPage(
  messId: string,
  startIso: string,
  endIso: string,
  page: number,
) {
  const where = {
    messId,
    servedAt: {
      gte: new Date(startIso),
      ...(endIso ? { lt: new Date(endIso) } : {}),
    },
  };
  const [items, total, grouped, windows] = await Promise.all([
    prisma.mealTransaction.findMany({
      where,
      select: {
        id: true,
        servedAt: true,
        user: { select: { firstName: true, lastName: true, username: true } },
        mealWindow: { select: { label: true } },
      },
      orderBy: { servedAt: "desc" },
      skip: (page - 1) * MEAL_TRANSACTION_PAGE_SIZE,
      take: MEAL_TRANSACTION_PAGE_SIZE,
    }),
    prisma.mealTransaction.count({ where }),
    prisma.mealTransaction.groupBy({
      by: ["mealWindowId"],
      where,
      _count: { _all: true },
    }),
    prisma.mealWindow.findMany({
      where: { messId },
      select: { id: true, label: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const counts = new Map(grouped.map((item) => [item.mealWindowId, item._count._all]));
  return {
    items,
    total,
    totals: windows.map((window) => ({
      id: window.id,
      label: window.label,
      count: counts.get(window.id) || 0,
    })),
  };
}

export const getCachedMessTransactionDashboardPage = unstable_cache(
  getDashboardPage,
  ["mess-transaction-dashboard-page"],
  { revalidate: 86_400, tags: ["mess-transaction-dashboard"] },
);

export { getDashboardPage as getFreshMessTransactionDashboardPage };

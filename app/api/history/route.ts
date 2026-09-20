import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import {
  HISTORY_PAGE_SIZE,
  getCachedMealPaymentHistory,
  getCachedPassPurchaseHistory,
  getMealPaymentHistory,
  getPassPurchaseHistory,
} from "@/lib/history";
import { todayInIndia } from "@/lib/meal-service";

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayInIndia();
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type") === "meals" ? "meals" : "passes";
  const date = validDate(params.get("date"));
  const managerView = ["MESS_MANAGER", "ADMIN"].includes(session.user.role);
  const refresh = params.get("refresh") === "true";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const tag = type === "meals" ? "meal-payment-history" : "pass-purchase-history";
  if (refresh) revalidateTag(tag, { expire: 0 });
  const getHistory = type === "meals"
    ? refresh ? getMealPaymentHistory : getCachedMealPaymentHistory
    : refresh ? getPassPurchaseHistory : getCachedPassPurchaseHistory;
  const result = await getHistory(session.user.id, managerView, date, page);
  return NextResponse.json({
    type, date, ...result, managerView, page,
    pageSize: HISTORY_PAGE_SIZE,
    hasNext: page * HISTORY_PAGE_SIZE < result.total,
  });
}

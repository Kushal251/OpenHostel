import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/access";
import { canManageMess, getMess } from "@/lib/mess";
import {
  getCachedMessPassRequestCounts,
  getCachedMessPassRequestPage,
  type PassRequestStatusFilter,
} from "@/lib/mess-pass-queue";

export async function GET(request: Request) {
  const session = await requireStaff();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messId = new URL(request.url).searchParams.get("messId") || "";
  const mess = await getMess(messId);
  if (!mess || !canManageMess(session.user.role, session.user.id, mess))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  if (params.get("summary") === "true") {
    const counts = await getCachedMessPassRequestCounts(messId);
    return NextResponse.json({
      active: counts.ACTIVE || 0,
      pending: counts.PENDING || 0,
    });
  }
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const query = (params.get("q") || "").trim().toLowerCase().slice(0, 120);
  const rawStatus = params.get("status");
  const status: PassRequestStatusFilter = rawStatus === "PENDING" || rawStatus === "ACTIVE" ? rawStatus : "ALL";
  const result = await getCachedMessPassRequestPage(messId, page, query, status);
  return NextResponse.json({
    ...result,
    page,
    pageSize: 5,
    hasPrevious: page > 1,
    hasNext: page * 5 < result.total,
  });
}

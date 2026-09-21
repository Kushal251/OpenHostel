import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { ADMIN_USER_PAGE_SIZE, adminUserSelect, getAdminApplicationCounts, getAdminUserPage, getCachedAdminApplicationCounts, getCachedAdminUserPage } from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(query.get("page") || "1", 10) || 1);
  const search = (query.get("q") || "").trim();
  const status = query.get("status") || "ALL";
  const role = (query.get("role") || "").trim();
  const refresh = query.get("refresh") === "true";
  if (refresh) {
    revalidateTag("admin-user-pages", { expire: 0 });
    revalidateTag("admin-user-summary", { expire: 0 });
  }
  const [result, summary] = await Promise.all([
    (refresh ? getAdminUserPage : getCachedAdminUserPage)(page, search, status, role),
    (refresh ? getAdminApplicationCounts : getCachedAdminApplicationCounts)(),
  ]);
  return NextResponse.json({
    ...result,
    ...summary,
    page,
    pageSize: ADMIN_USER_PAGE_SIZE,
    hasNext: page * ADMIN_USER_PAGE_SIZE < result.total,
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json(
    { error: "Only admins can create authority accounts." },
    { status: 403 }
  );
  try {
    const body = await request.json();
    const role = String(body.role || "");
    if (!role || role === "STUDENT" || !body.firstName || !body.email || !body.password || !body.uniqueId) {
      return NextResponse.json(
        { error: "Name, email, role, unique ID and password are required." },
        { status: 400 }
      );
    }
    const username = String(body.uniqueId).trim().toUpperCase();
    const user = await prisma.user.create({
       data: {
         username, 
         uniqueId: username, 
         email: String(body.email).trim().toLowerCase(),
         firstName: String(body.firstName).trim(),
         lastName: body.lastName ? String(body.lastName).trim() : null,
         phone: body.phone ? String(body.phone).trim() : null,
         passwordHash: await bcrypt.hash(String(body.password), 10),
         role,
         status: "ACTIVE"
       },
       select: adminUserSelect,
    });
    revalidateTag("admin-user-pages", { expire: 0 });
    revalidateTag("admin-user-summary", { expire: 0 });
    revalidateTag("admin-user-details", { expire: 0 });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint") ? "Email or unique ID already exists." : "Could not create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

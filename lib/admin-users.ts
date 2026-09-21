import { unstable_cache } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const ADMIN_USER_PAGE_SIZE = 10;

export const adminUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  phone: true,
  uniqueId: true,
  photoUrl: true,
  college: true,
  branch: true,
  hostel: true,
  passingYear: true,
  enrollmentNo: true,
  roomNumber: true,
  mustChangePassword: true,
  temporaryPassword: true,
  createdAt: true,
  approvedAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function whereFor(
  query: string,
  status: string,
  role = "",
): Prisma.UserWhereInput {
  const search = query.trim();
  return {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { uniqueId: { contains: search, mode: "insensitive" } },
            { enrollmentNo: { contains: search, mode: "insensitive" } },
            { roomNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getAdminUserPage(
  page: number,
  query: string,
  status: string,
  role = "",
) {
  const where = whereFor(query, status, role);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_USER_PAGE_SIZE,
      take: ADMIN_USER_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export const getCachedAdminUserPage = unstable_cache(
  getAdminUserPage,
  ["admin-user-pages"],
  { revalidate: 172_800, tags: ["admin-user-pages"] },
);

export async function getAdminApplicationCounts() {
  const [statuses, roles] = await Promise.all([
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);
  return {
    counts: Object.fromEntries(statuses.map((entry) => [entry.status, entry._count._all])),
    authorityCount: roles
      .filter((entry) => entry.role !== "STUDENT")
      .reduce((total, entry) => total + entry._count._all, 0),
  };
}

export const getCachedAdminApplicationCounts = unstable_cache(
  getAdminApplicationCounts,
  ["admin-application-counts"],
  { revalidate: 86_400, tags: ["admin-user-summary"] },
);

export const getCachedAdminUserDetail = unstable_cache(
  (id: string) => prisma.user.findUnique({ where: { id }, select: adminUserSelect }),
  ["admin-user-detail"],
  { revalidate: 300, tags: ["admin-user-details"] },
);

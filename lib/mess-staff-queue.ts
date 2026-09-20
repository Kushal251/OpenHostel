import { unstable_cache } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const MESS_STAFF_PAGE_SIZE = 5;

export const staffUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  enrollmentNo: true,
  roomNumber: true,
  username: true,
  role: true,
  photoUrl: true,
};

export const getCachedMessStaffPage = unstable_cache(
  async (messId: string, page: number) => {
    const [items, total] = await Promise.all([
      prisma.messStaff.findMany({
        where: { messId },
        select: { user: { select: staffUserSelect } },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * MESS_STAFF_PAGE_SIZE,
        take: MESS_STAFF_PAGE_SIZE,
      }),
      prisma.messStaff.count({ where: { messId } }),
    ]);
    return { items: items.map((item) => item.user), total };
  },
  ["mess-staff-page"],
  { revalidate: 300, tags: ["mess-staff-queue"] },
);

export const getCachedAvailableStaffPage = unstable_cache(
  async (messId: string, managerId: string, page: number, query: string) => {
    const where: Prisma.UserWhereInput = {
      status: { in: ["ACTIVE", "APPROVED"] },
      id: { not: managerId },
      messStaff: { none: { messId } },
    };
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { enrollmentNo: { contains: query, mode: "insensitive" } },
        { roomNumber: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: staffUserSelect,
        orderBy: [{ firstName: "asc" }, { username: "asc" }],
        skip: (page - 1) * MESS_STAFF_PAGE_SIZE,
        take: MESS_STAFF_PAGE_SIZE,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },
  ["available-mess-staff-page"],
  { revalidate: 300, tags: ["mess-staff-queue"] },
);

import { unstable_cache } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const MESS_PASS_REQUEST_PAGE_SIZE = 5;

export type PassRequestStatusFilter = "ALL" | "PENDING" | "ACTIVE";

function requestWhere(
  messId: string,
  query: string,
  status: PassRequestStatusFilter,
): Prisma.MessPassRequestWhereInput {
  const where: Prisma.MessPassRequestWhereInput = { messId };
  if (status !== "ALL") where.status = status;
  if (query) {
    where.user = {
      is: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { enrollmentNo: { contains: query, mode: "insensitive" } },
          { roomNumber: { contains: query, mode: "insensitive" } },
        ],
      },
    };
  }
  return where;
}

export const getCachedMessPassRequestCounts = unstable_cache(
  async (messId: string) => {
    const groups = await prisma.messPassRequest.groupBy({
      by: ["status"],
      where: { messId },
      _count: { _all: true },
    });
    return groups.reduce(
      (counts, group) => ({ ...counts, [group.status]: group._count._all }),
      {} as Record<string, number>,
    );
  },
  ["mess-pass-request-counts"],
  { revalidate: 86_400, tags: ["mess-pass-queue"] },
);

export const getCachedMessPassRequestPage = unstable_cache(
  async (
    messId: string,
    page: number,
    query: string,
    status: PassRequestStatusFilter,
  ) => {
    const where = requestWhere(messId, query, status);
    const [items, total] = await Promise.all([
      prisma.messPassRequest.findMany({
        where,
        select: {
          id: true,
          requestedDays: true,
          requestedPrice: true,
          status: true,
          finalDays: true,
          finalAmount: true,
          startsAt: true,
          expiresAt: true,
          pauseStartedAt: true,
          pauseEndsAt: true,
          pauseOriginalExpiresAt: true,
          pausePlannedDays: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              enrollmentNo: true,
              roomNumber: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * MESS_PASS_REQUEST_PAGE_SIZE,
        take: MESS_PASS_REQUEST_PAGE_SIZE,
      }),
      prisma.messPassRequest.count({ where }),
    ]);
    return { items, total };
  },
  ["mess-pass-request-page"],
  { revalidate: 300, tags: ["mess-pass-queue"] },
);

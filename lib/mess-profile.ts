import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const MESS_DETAILS_CACHE_SECONDS = 172_800;
const MESS_PASS_CACHE_SECONDS = 120;

// This data is shared by every visitor allowed to view a mess. Keep anything
// user-specific (especially the active pass) in a separate cache below.
export const getCachedMessProfile = unstable_cache(
  (id: string) =>
    prisma.mess.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        hostel: true,
        about: true,
        managerId: true,
        menuImageUrl: true,
        phoneNumbers: true,
        email: true,
        mealWindows: { orderBy: { sortOrder: "asc" } },
        manager: {
          select: { firstName: true, lastName: true, email: true, photoUrl: true },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                photoUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ["mess-profile"],
  { revalidate: MESS_DETAILS_CACHE_SECONDS, tags: ["mess-profile"] },
);

export const getCachedMessProfilePass = unstable_cache(
  (messId: string, userId: string) =>
    prisma.messPassRequest.findFirst({
      where: {
        messId,
        userId,
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
      },
      select: {
        finalDays: true,
        finalAmount: true,
        startsAt: true,
        expiresAt: true,
        pauseEndsAt: true,
      },
      orderBy: { expiresAt: "desc" },
    }),
  ["mess-profile-pass"],
  { revalidate: MESS_PASS_CACHE_SECONDS, tags: ["mess-profile-pass"] },
);

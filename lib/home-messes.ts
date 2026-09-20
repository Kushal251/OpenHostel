import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { todayInIndia } from "@/lib/meal-service";
import type { Hostel } from "@/lib/hostel";

const homeMessSelect = {
  id: true,
  name: true,
  hostel: true,
  menuImageUrl: true,
  mealWindows: { orderBy: { sortOrder: "asc" as const } },
  dailyMealWindows: { where: { serviceDate: todayInIndia() } },
};

export const getAdminHomeMesses = unstable_cache(
  () =>
    prisma.mess.findMany({
      take: 2,
      select: { id: true, name: true, hostel: true, menuImageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
  ["home-messes", "admin"],
  { revalidate: 120, tags: ["home-messes"] },
);

export const getManagerHomeMesses = unstable_cache(
  (userId: string) =>
    prisma.mess.findMany({
      where: {
        OR: [
          { managerId: userId },
          { staff: { some: { userId } } },
        ],
      },
      select: homeMessSelect,
      orderBy: { createdAt: "desc" },
    }),
  ["home-messes", "manager"],
  { revalidate: 120, tags: ["home-messes"] },
);

export const getStudentHomeMesses = unstable_cache(
  (hostel: string) =>
    prisma.mess.findMany({
      where: { hostel: hostel as Hostel },
      select: homeMessSelect,
    }),
  ["home-messes", "student"],
  { revalidate: 120, tags: ["home-messes"] },
);

export const getActiveHomePass = unstable_cache(
  (userId: string) =>
    prisma.messPassRequest.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      select: {
        finalDays: true,
        expiresAt: true,
        pauseEndsAt: true,
        mess: { select: { id: true, name: true, hostel: true } },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ["home-active-pass"],
  { revalidate: 60, tags: ["home-active-pass"] },
);

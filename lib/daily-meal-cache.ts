import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { effectiveMealWindows } from "@/lib/meal-service";

// The service date is an argument, so every mess receives one immutable
// effective schedule per day. Managers explicitly refresh this cache on a
// timing conflict.
export const getCachedDailyMealWindows = unstable_cache(
  async (messId: string, serviceDate: string) => {
    const mess = await prisma.mess.findUnique({
      where: { id: messId },
      select: {
        mealWindows: { orderBy: { sortOrder: "asc" } },
        dailyMealWindows: { where: { serviceDate } },
      },
    });
    if (!mess) return null;
    return effectiveMealWindows(mess.mealWindows, mess.dailyMealWindows);
  },
  ["daily-meal-windows"],
  { revalidate: 86_400, tags: ["daily-meal-windows"] },
);

// This is a cache of a successful first pass validation for the service day.
// The database record remains the durable source of truth across restarts.
export const getCachedDailyPassValidation = unstable_cache(
  (messId: string, userId: string, serviceDate: string) =>
    prisma.dailyMessPassValidation.findUnique({
      where: { messId_userId_serviceDate: { messId, userId, serviceDate } },
      select: { id: true, passId: true },
    }),
  ["daily-mess-pass-validation"],
  { revalidate: 86_400, tags: ["daily-mess-pass-validation"] },
);

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const directorySelect = {
  id: true,
  name: true,
  hostel: true,
  menuImageUrl: true,
  phoneNumbers: true,
  email: true,
  about: true,
  managerId: true,
  manager: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  mealWindows: {
    select: { id: true, label: true, startTime: true, endTime: true },
    orderBy: { sortOrder: "asc" as const },
  },
  _count: { select: { staff: true } },
};

export const getAdminMessDirectory = unstable_cache(
  () => prisma.mess.findMany({ select: directorySelect, orderBy: { createdAt: "desc" } }),
  ["mess-directory", "admin"],
  { revalidate: 120, tags: ["mess-directory"] },
);

export const getMemberMessDirectory = unstable_cache(
  (userId: string) => prisma.mess.findMany({
    where: {
      OR: [
        { managerId: userId },
        { staff: { some: { userId } } },
      ],
    },
    select: directorySelect,
    orderBy: { createdAt: "desc" },
  }),
  ["mess-directory", "member"],
  { revalidate: 120, tags: ["mess-directory"] },
);

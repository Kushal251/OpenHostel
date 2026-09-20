import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const userProfileSelect = {
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
  createdAt: true,
} as const;

export const getCachedUserProfile = unstable_cache(
  (userId: string) =>
    prisma.user.findUnique({ where: { id: userId }, select: userProfileSelect }),
  ["user-profile"],
  { revalidate: false, tags: ["user-profiles"] },
);

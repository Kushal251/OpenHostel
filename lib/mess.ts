import { prisma } from "@/lib/prisma";
import { isHostel, type Hostel } from "@/lib/hostel";

export const messInclude = {
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      photoUrl: true,
    },
  },
  mealWindows: { orderBy: { sortOrder: "asc" as const } },
  staff: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          enrollmentNo: true,
          photoUrl: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  passOffers: { orderBy: { sortOrder: "asc" as const } },
};

export function canManageMess(
  role: string,
  userId: string,
  mess: { managerId: string },
) {
  return (
    role === "ADMIN" || (role === "MESS_MANAGER" && mess.managerId === userId)
  );
}

type MessMembership = {
  managerId: string;
  staff?: { userId: string }[];
};

export function canViewMess(
  role: string,
  userId: string,
  mess: MessMembership,
) {
  if (role !== "MESS_MANAGER") return true;
  return (
    mess.managerId === userId ||
    Boolean(mess.staff?.some((member) => member.userId === userId))
  );
}

export function canEditTodayWindows(
  role: string,
  userId: string,
  mess: MessMembership,
) {
  return (
    role === "ADMIN" ||
    mess.managerId === userId ||
    Boolean(mess.staff?.some((member) => member.userId === userId))
  );
}

// Mess staff have operational access only: they can update today's serving
// windows and review transactions for the mess they are assigned to.
export const canAccessMessOperations = canEditTodayWindows;

export function cleanMessInput(body: Record<string, unknown>) {
  const phones = Array.isArray(body.phoneNumbers)
    ? body.phoneNumbers
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const windows = Array.isArray(body.mealWindows)
    ? body.mealWindows
        .map((item, index) => {
          const value = item as Record<string, unknown>;
          return {
            label: String(value.label || "").trim(),
            startTime: String(value.startTime || ""),
            endTime: String(value.endTime || ""),
            sortOrder: index,
          };
        })
        .filter((item) => item.label && item.startTime && item.endTime)
    : [];
  return {
    name: String(body.name || "").trim(),
    hostel: String(body.hostel || "").trim(),
    menuImageUrl: body.menuImageUrl ? String(body.menuImageUrl).trim() : null,
    phoneNumbers: phones,
    email: body.email ? String(body.email).trim().toLowerCase() : null,
    about: body.about ? String(body.about).trim() : null,
    mealWindows: windows,
  };
}

export function hasValidMessHostel(
  input: { hostel: string },
): input is { hostel: Hostel } {
  return isHostel(input.hostel);
}

export async function getMess(id: string) {
  return prisma.mess.findUnique({ where: { id }, include: messInclude });
}

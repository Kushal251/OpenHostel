import { auth } from "@/auth";

export const STAFF_ROLES = ["ADMIN", "WARDEN", "CARETAKER", "GATEKEEPER", "MESS_MANAGER"];

export async function requireStaff() {
  const session = await auth();
  if (!session?.user || !STAFF_ROLES.includes(session.user.role)) return null;
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

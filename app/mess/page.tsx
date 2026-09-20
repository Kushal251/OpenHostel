import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import MessWorkspace from "./workspace";

export default async function MessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["ADMIN", "MESS_MANAGER"].includes(session.user.role)) redirect("/home");
  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <MessWorkspace role={session.user.role} />
    </main>
  );
}

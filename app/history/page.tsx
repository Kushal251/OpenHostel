import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import HistoryWorkspace from "./HistoryWorkspace";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-8"><HistoryWorkspace /></div>
    </main>
  );
}

import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import { canManageMess } from "@/lib/mess";
import { getCachedMessPassOffers } from "@/lib/mess-pass-offers";
import { prisma } from "@/lib/prisma";
import ManageMessPasses from "./workspace";
import TransactionDashboard from "@/components/mess/TransactionDashboard";

export default async function ManageMessPage({
  params,
}: PageProps<"/mess/[id]/manage">) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const mess = await prisma.mess.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      hostel: true,
      managerId: true,
    },
  });
  if (!mess) notFound();
  if (!canManageMess(session.user.role, session.user.id, mess))
    redirect(`/mess/${id}`);
  const passOffers = await getCachedMessPassOffers(mess.id, true);
  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <ManageMessPasses
        isAdmin={session.user.role === "ADMIN"}
        mess={{
          id: mess.id,
          name: mess.name,
          hostel: mess.hostel,
          passOffers,
        }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-8">
        <TransactionDashboard messId={mess.id} />
      </div>
    </main>
  );
}

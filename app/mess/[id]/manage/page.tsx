import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import { canAccessMessOperations, canManageMess } from "@/lib/mess";
import { getCachedMessPassOffers } from "@/lib/mess-pass-offers";
import { prisma } from "@/lib/prisma";
import ManageMessPasses from "./workspace";
import TransactionDashboard from "@/components/mess/TransactionDashboard";
import TodayWindowManager from "@/components/mess/TodayWindowManager";
import { effectiveMealWindows, todayInIndia } from "@/lib/meal-service";

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
      mealWindows: { orderBy: { sortOrder: "asc" } },
      dailyMealWindows: { where: { serviceDate: todayInIndia() } },
      staff: { where: { userId: session.user.id }, select: { userId: true } },
    },
  });
  if (!mess) notFound();
  const canManage = canManageMess(session.user.role, session.user.id, mess);
  if (!canAccessMessOperations(session.user.role, session.user.id, mess))
    redirect(`/mess/${id}`);
  const passOffers = canManage
    ? await getCachedMessPassOffers(mess.id, true)
    : [];
  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      {canManage ? (
        <ManageMessPasses
          isAdmin={session.user.role === "ADMIN"}
          mess={{
            id: mess.id,
            name: mess.name,
            hostel: mess.hostel,
            passOffers,
          }}
        />
      ) : (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
          <Link href={`/mess/${mess.id}`} className="text-sm font-bold text-[#234b50]">← Back to mess profile</Link>
          <header className="mt-3 rounded-[2rem] bg-[#234b50] p-6 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#f4c86a]">Mess staff access · {mess.hostel}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{mess.name} operations</h1>
            <p className="mt-2 text-sm text-emerald-50">You can manage today&apos;s serving times and review meal transactions.</p>
          </header>
          <TodayWindowManager messes={[{ id: mess.id, name: mess.name, hostel: mess.hostel, windows: effectiveMealWindows(mess.mealWindows, mess.dailyMealWindows), hasOverride: mess.dailyMealWindows.length > 0 }]} />
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-8">
        <TransactionDashboard messId={mess.id} />
      </div>
    </main>
  );
}

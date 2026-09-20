import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import MessQr from "@/components/mess/MessQr";
import MessDeferredSections from "@/components/mess/MessDeferredSections";
import { canAccessMessOperations, canViewMess } from "@/lib/mess";
import { getCachedMessProfile } from "@/lib/mess-profile";

export default async function MessProfilePage({
  params,
}: PageProps<"/mess/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const mess = await getCachedMessProfile(id);
  if (!mess) notFound();
  if (!canViewMess(session.user.role, session.user.id, mess)) redirect("/home");
  const canManage = canAccessMessOperations(
    session.user.role,
    session.user.id,
    mess,
  );
  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-9">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" className="text-sm font-bold text-[#234b50]">
            ← Back to home
          </Link>
          <MessQr messId={mess.id} messName={mess.name} />
        </div>
        <section className="mt-3 overflow-hidden rounded-[2rem] bg-[#234b50] p-6 text-white sm:p-10 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#f4c86a]">
            Mess profile · {mess.hostel}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
            {mess.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50 sm:text-lg">
            {mess.about ||
              "A dedicated hostel dining service for fresh, reliable meals every day."}
          </p>
          {canManage && (
            <Link
              href={`/mess/${mess.id}/manage`}
              className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-[#234b50]"
              style={{color: "#234b50"}}
            >
              {session.user.id === mess.managerId || session.user.role === "ADMIN"
                ? "Manage this mess →"
                : "Open staff dashboard →"}
            </Link>
          )}
        </section>
        <nav
          aria-label="Mess profile sections"
          className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
          {[
            ["passes", "🎫 Passes"],
            ["timings", "🕒 Timings"],
            ["menu", "🍽️ Menu"],
            ["contact", "☎ Contact"],
            ["team", "👥 Team"],
          ].map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={`min-h-11 shrink-0 rounded-full px-4 py-3 text-sm font-bold shadow-sm ${index === 0 ? "bg-[#d63a36] text-white" : "bg-white text-[#234b50] ring-1 ring-slate-200"}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <MessDeferredSections messId={mess.id} messName={mess.name} />
      </div>
    </main>
  );
}

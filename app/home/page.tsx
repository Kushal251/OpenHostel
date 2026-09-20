import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import TodayWindowManager from "@/components/mess/TodayWindowManager";
import { effectiveMealWindows } from "@/lib/meal-service";
import {
  getAdminHomeMesses,
  getActiveHomePass,
  getManagerHomeMesses,
  getStudentHomeMesses,
} from "@/lib/home-messes";

type MessPreview = {
  id: string;
  name: string;
  hostel: string;
  menuImageUrl: string | null;
  mealWindows?: {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
  }[];
  dailyMealWindows?: {
    mealWindowId: string;
    startTime: string;
    endTime: string;
  }[];
};

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const onboardingSkipped =
    (await cookies()).get("openhostel-onboarding-skipped")?.value ===
    session.user.id;
  if (session.user.mustChangePassword && !onboardingSkipped)
    redirect("/onboarding");

  const isAdmin = session.user.role === "ADMIN";
  const isMessManager = session.user.role === "MESS_MANAGER";
  let messes: MessPreview[] = [];
  let operationMesses: MessPreview[] = [];
  let activePass: {
    finalDays: number | null;
    expiresAt: Date | string | null;
    pauseEndsAt: Date | string | null;
    mess: { id: string; name: string; hostel: string };
  } | null = null;

  if (isAdmin) {
    messes = await getAdminHomeMesses();
  } else {
    operationMesses = await getManagerHomeMesses(session.user.id);
    if (isMessManager) {
      messes = operationMesses;
    } else if (session.user.hostel) {
      messes = await getStudentHomeMesses(session.user.hostel);
    }
  }

  if (!isAdmin) {
    activePass = await getActiveHomePass(session.user.id);
  }

  const timingMesses = operationMesses.flatMap((mess) => {
        if (!mess.mealWindows || !mess.dailyMealWindows) return [];
        return [
          {
            id: mess.id,
            name: mess.name,
            hostel: mess.hostel,
            windows: effectiveMealWindows(
              mess.mealWindows,
              mess.dailyMealWindows,
            ),
            hasOverride: mess.dailyMealWindows.length > 0,
          },
        ];
      });
  const isMessOperationsUser = isMessManager || operationMesses.length > 0;
  const activePassExpiry = activePass?.expiresAt
    ? new Date(activePass.expiresAt)
    : null;
  const activePassPauseEnd = activePass?.pauseEndsAt
    ? new Date(activePass.pauseEndsAt)
    : null;
  const isPassPaused = Boolean(
    activePassPauseEnd && activePassPauseEnd > new Date(),
  );

  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <div className="p-6 sm:p-10">
        <section className="mx-auto mt-10 max-w-5xl rounded-[2rem] bg-[#234b50] p-8 text-white sm:p-14">
          <p className="text-sm uppercase tracking-[.2em] text-[#f4c86a]">
            OpenHostel dashboard
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-6xl">
            Welcome, {session.user.name || "there"}.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="inline-flex rounded-xl bg-[#d63a36] px-5 py-3 font-semibold"
                >
                  Manage people →
                </Link>
                <Link
                  href="/mess"
                  className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-[#234b50]"
                  style={{ color: "#234b50" }}
                >
                  View all messes →
                </Link>
              </>
            ) : (
              isMessManager && (
                <Link
                  href="/mess"
                  className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-[#234b50]"
                >
                  Open mess workspace →
                </Link>
              )
            )}
          </div>
        </section>

        {isMessOperationsUser && <TodayWindowManager messes={timingMesses} />}

        {activePass && (
          <Link
            href="/history"
            className={`mx-auto mt-6 block max-w-5xl rounded-2xl p-5 text-white shadow-sm ${isPassPaused ? "bg-amber-600" : "bg-emerald-600"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-white/80">
                  Your active mess pass
                </p>
                {isPassPaused && (
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
                    ⏸ PAUSED UNTIL{" "}
                    {activePassPauseEnd?.toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm font-bold">View pass →</span>
            </div>
            <div className="mt-3">
              <p className="text-xl font-bold">{activePass.mess.name}</p>
              <p className="mt-1 text-sm text-white/85">
                {isPassPaused
                  ? `Scanning is unavailable until ${activePassPauseEnd?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
                  : `${activePass.mess.hostel} · Valid until ${activePassExpiry?.toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
              </p>
            </div>
          </Link>
        )}

        <section className="mx-auto mt-7 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-[#d63a36]">
                Hostel dining
              </p>
              <h2 className="text-2xl font-bold">
                {isAdmin ? "Recent messes" : "Mess cards"}
              </h2>
            </div>
            {(isAdmin || isMessManager) && (
              <Link href="/mess" className="text-sm font-bold text-[#d63a36]">
                {isAdmin ? "View all →" : "Manage →"}
              </Link>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {messes.length ? (
              messes.map((mess) => (
                <Link
                  key={mess.id}
                  href={`/mess/${mess.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-24 bg-[#f8e2dc]">
                    {mess.menuImageUrl && (
                      <img
                        src={mess.menuImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#d63a36]">
                      {mess.hostel}
                    </p>
                    <p className="mt-1 font-bold text-slate-900">{mess.name}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {mess.mealWindows
                        ? `${mess.mealWindows.length} serving windows · `
                        : ""}
                      View profile →
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                {isMessManager
                  ? "You are not assigned to a mess yet."
                  : "No mess has been created yet."}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

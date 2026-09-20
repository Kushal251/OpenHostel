import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCachedUserProfile } from "@/lib/user-profile";
import AppNavbar from "@/components/AppNavbar";
import ProfileEditor from "./ProfileEditor";
import ProfileRefresh from "./ProfileRefresh";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getCachedUserProfile(session.user.id);
  if (!profile) redirect("/login");
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username;
  const details =
    profile.role === "STUDENT"
      ? [
          ["Enrollment", profile.enrollmentNo],
          ["College", profile.college],
          ["Branch", profile.branch],
          ["Hostel", profile.hostel],
          ["Passing year", profile.passingYear],
          ["Room", profile.roomNumber],
        ]
      : [
          ["Unique ID", profile.uniqueId || profile.username],
          ["Authority role", profile.role.replaceAll("_", " ")],
          ["Account status", profile.status],
        ];

  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      <AppNavbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
          <div className="h-24 bg-[#234b50] sm:h-32" />
          <div className="px-5 pb-6 sm:px-10 sm:pb-8">
            <div className="-mt-11 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-3 sm:gap-5">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={`${name} profile`}
                    className="h-22 w-22 rounded-2xl border-4 border-white object-cover shadow-md sm:h-28 sm:w-28 sm:rounded-3xl"
                  />
                ) : (
                  <div className="grid h-22 w-22 place-items-center rounded-2xl border-4 border-white bg-[#f4c86a] text-2xl font-bold text-[#234b50] shadow-md sm:h-28 sm:w-28 sm:rounded-3xl sm:text-3xl">
                    {name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
                <div className="pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d63a36] sm:text-xs sm:tracking-[.18em]">
                    {profile.role.replaceAll("_", " ")}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                    {name}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProfileRefresh />
                {profile.role === "ADMIN" && <ProfileEditor profile={profile} />}
              </div>
            </div>
            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:mt-8 sm:grid-cols-2 sm:gap-4 sm:pt-7 lg:grid-cols-3">
              <Detail label="Gmail" value={profile.email} />
              <Detail label="Phone" value={profile.phone} />
              <Detail label="Status" value={profile.status} />
              {details.map(([label, value]) => (
                <Detail
                  key={String(label)}
                  label={String(label)}
                  value={value}
                />
              ))}
            </div>
          </div>
        </section>
        {profile.role !== "ADMIN" && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Your profile is view-only. Contact an administrator if any
            information needs correction.
          </p>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 font-semibold text-slate-800">
        {value ? String(value) : "Not provided"}
      </p>
    </div>
  );
}

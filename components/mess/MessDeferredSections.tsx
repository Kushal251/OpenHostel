"use client";
import { useEffect, useState } from "react";
import PassOffers from "./PassOffers";
type Data = {
  menuImageUrl: string | null;
  phoneNumbers: string[];
  email: string | null;
  mealWindows: {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
  }[];
  passOffers: {
    id: string;
    title: string;
    days: number;
    price: number;
    active: boolean;
  }[];
  pass: {
    finalDays: number | null;
    finalAmount: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    pauseEndsAt: string | null;
  } | null;
  manager: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    photoUrl: string | null;
  };
  staff: {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string;
      role: string;
      photoUrl: string | null;
    };
  }[];
};
const toMinutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};
const friendlyTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(`2020-01-01T${value}:00`));
export default function MessDeferredSections({
  messId,
  messName,
}: {
  messId: string;
  messName: string;
}) {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/messes/${messId}/details`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Data>;
      })
      .then((value) => active && setData(value))
      .catch(() => {
        if (active)
          window.location.assign(
            `/connection-error?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`,
          );
      });
    return () => {
      active = false;
    };
  }, [messId]);
  if (!data)
    return (
      <>
        <SectionSkeleton title="Mess passes" />
        <SectionSkeleton title="Today’s meal windows" />
        <SectionSkeleton title="Menu" />
        <SectionSkeleton title="Contact & team" />
      </>
    );
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const current =
    Number(now.find((item) => item.type === "hour")?.value || 0) * 60 +
    Number(now.find((item) => item.type === "minute")?.value || 0);
  const managerName =
    [data.manager.firstName, data.manager.lastName].filter(Boolean).join(" ") ||
    data.manager.email;
  return (
    <>
      <div className="mt-6">
        <PassOffers messId={messId} offers={data.passOffers} pass={data.pass} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <div className="space-y-6">
          <section
            id="timings"
            className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
          >
            <Header eyebrow="Today’s service" title="Meal windows" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.mealWindows.map((window, index) => {
                const open =
                  current >= toMinutes(window.startTime) &&
                  current < toMinutes(window.endTime);
                return (
                  <article
                    key={window.id}
                    className={`rounded-2xl border p-4 ${open ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 font-bold">{window.label}</h3>
                      </div>
                      {open && (
                        <span className="h-fit rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
                          OPEN NOW
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-lg font-bold text-[#234b50]">
                      {friendlyTime(window.startTime)}{" "}
                      <span className="font-normal text-slate-400">to</span>{" "}
                      {friendlyTime(window.endTime)}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
          <section
            id="menu"
            className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <div className="p-5 sm:p-7">
              <Header eyebrow="Food board" title="Menu" />
            </div>
            {data.menuImageUrl ? (
              <img
                src={data.menuImageUrl}
                alt={`${messName} menu`}
                loading="lazy"
                className="max-h-[750px] w-full bg-slate-100 object-contain"
              />
            ) : (
              <p className="p-6 text-center text-sm text-slate-500">
                No menu image uploaded yet.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <section
            id="contact"
            className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <Header eyebrow="Contact" title="Need help?" />
            <div className="mt-5 space-y-3">
              {data.phoneNumbers.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="block rounded-xl bg-slate-50 p-3 text-sm font-bold text-[#234b50]"
                >
                  ☎ {phone}
                </a>
              ))}
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="block break-all rounded-xl bg-slate-50 p-3 text-sm font-bold text-[#234b50]"
                >
                  @ {data.email}
                </a>
              )}
            </div>
          </section>
          <section
            id="team"
            className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <Header eyebrow="People" title="Mess team" />
            <Person
              name={managerName}
              role="Mess manager"
              photo={data.manager.photoUrl}
            />
            {data.staff.map(({ user }) => (
              <Person
                key={user.id}
                name={
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.username
                }
                role={user.role.replaceAll("_", " ")}
                photo={user.photoUrl}
              />
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
    </>
  );
}
function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mt-6 animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-7 w-48 rounded bg-slate-200" />
      <p className="mt-6 h-24 rounded-2xl bg-slate-100 text-transparent">
        Loading {title}
      </p>
    </section>
  );
}
function Person({
  name,
  role,
  photo,
}: {
  name: string;
  role: string;
  photo: string | null;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#234b50] text-sm font-bold text-white">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          name[0]
        )}
      </span>
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
}

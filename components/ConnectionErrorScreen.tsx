"use client";

import { useEffect, useState } from "react";

export default function ConnectionErrorScreen({ retry }: { retry?: () => void }) {
  const [returnTo, setReturnTo] = useState("/home");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("returnTo");
    if (value?.startsWith("/") && !value.startsWith("//")) setReturnTo(value);
  }, []);

  const tryAgain = () => {
    if (retry) return retry();
    window.location.assign(returnTo);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] border border-amber-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-3xl" aria-hidden="true">📡</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[#d63a36]">Connection needed</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Check your internet</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We could not connect to the database. Please check your internet connection and try again.
        </p>
        <button onClick={tryAgain} className="mt-7 min-h-12 w-full rounded-xl bg-[#234b50] px-5 font-bold text-white transition hover:bg-[#18383d]">
          Retry
        </button>
      </section>
    </main>
  );
}

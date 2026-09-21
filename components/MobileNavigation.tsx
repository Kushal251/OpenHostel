"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LogoutButton from "./LogoutButton";

type NavigationLink = { href: string; label: string; icon: string };

export default function MobileNavigation({
  links,
  name,
  role,
  initials,
}: {
  links: NavigationLink[];
  name: string;
  role: string;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-11 w-11 place-items-center rounded-xl text-xl font-bold text-[#234b50] hover:bg-slate-100"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        ☰
      </button>
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Close navigation menu"
          />
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex h-dvh w-[min(19rem,86vw)] flex-col bg-[#f7f7f4] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <Link href="/home" onClick={() => setOpen(false)} className="text-lg font-bold text-[#234b50]">
                OpenHostel
              </Link>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-xl text-slate-600 hover:bg-slate-100" aria-label="Close navigation menu">×</button>
            </div>
            <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
              <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl hover:bg-slate-50">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#234b50] text-sm font-bold text-white">{initials}</span>
                <span className="min-w-0"><span className="block truncate font-bold text-slate-900">{name}</span><span className="block truncate text-xs font-semibold text-slate-500">{role.replaceAll("_", " ")}</span></span>
              </Link>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500">Navigation</p>
              <div className="space-y-1">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#234b50] hover:bg-white hover:shadow-sm">
                    <span aria-hidden="true">{link.icon}</span>{link.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="shrink-0 border-t border-slate-200 bg-white p-4">
              <div className="rounded-xl bg-slate-50 px-2 py-1"><LogoutButton /></div>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </div>
  );
}

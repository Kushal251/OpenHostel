"use client";
import { signOut } from "next-auth/react";
export default function LogoutButton() {
  return (
    <button
      aria-label="Log out"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="grid h-10 w-10 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-100 hover:text-[#d63a36] sm:h-auto sm:w-auto sm:px-2 sm:text-sm sm:font-semibold"
    >
      ↪<span className="sr-only sm:not-sr-only sm:ml-1">Log out</span>
    </button>
  );
}

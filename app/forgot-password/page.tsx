"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[42%_58%]">
      {/* Left Side */}
      <section className="relative overflow-hidden hidden lg:block bg-[#234B50] px-8 py-10 text-white lg:px-14">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold italic text-[#D63A36]">
            O
          </div>
          <span className="text-xl font-semibold">OpenHostel</span>
        </Link>

        <div className="mt-20 max-w-md lg:mt-40">
          <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-yellow-300" />
            You&apos;re in good hands
          </p>

          <h1 className="text-5xl font-bold leading-tight lg:text-6xl">
            We&apos;ll help you
            <br />
            <span className="text-[#F4C86A]">get back in.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-emerald-100">
            A secure reset link goes straight to your Gmail inbox.
          </p>
        </div>

        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-[#2F666D]" />
        <div className="absolute bottom-0 right-0 h-52 w-44 rounded-t-full border-[18px] border-b-0 border-[#E2A760]" />
      </section>

      {/* Right Side */}
      <section className="relative flex items-center justify-center bg-[#F6F3EE] px-3 md:px-6 py-16 lg:px-16">
        <Link
          href="/login"
          className="absolute left-6 top-6 text-sm text-slate-600 hover:text-[#D63A36]"
        >
          ← Back to login
        </Link>

        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#D63A36]">
            <span className="h-2 w-2 rounded-full bg-[#D63A36]" />
            Password Recovery
          </p>

          <h2 className="mb-6 text-4xl font-bold leading-tight text-slate-900">
            Reset your
            <br />
            <span className="text-[#D63A36]">password.</span>
          </h2>

          {!sent ? (
            <>
              <p className="mb-6 text-sm leading-6 text-slate-600">
                Enter the Gmail address connected to your OpenHostel account and
                we&apos;ll send you a secure password reset link.
              </p>

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Gmail Address
                  </label>

                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    pattern=".+@gmail\\.com"
                    title="Please enter a Gmail address"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-[#D63A36] focus:ring-2 focus:ring-[#D63A36]/20"
                  />
                </div>

                <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D63A36] font-semibold text-white transition hover:bg-[#B92F2C]">
                  Send Reset Link →
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-xl font-bold text-white">
                ✓
              </div>

              <h3 className="text-2xl font-bold text-slate-900">
                Check your Gmail
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-semibold text-slate-800">{email}</span>.
                It may take a minute to arrive.
              </p>

              <Link
                href="/login"
                className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#D63A36] font-semibold text-white transition hover:bg-[#B92F2C]"
              >
                Back to Login →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

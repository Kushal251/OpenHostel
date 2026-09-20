"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
    setBusy(false);
    if (result?.error)
      return setError(
        "Invalid credentials or your application has not been approved yet.",
      );
    router.push("/home");
    router.refresh();
  }
  return (
    <main className="grid min-h-screen bg-[#f6f3ee] lg:grid-cols-[43%_57%]">
      <section className="hidden bg-[#234b50] p-14 text-white lg:block">
        <Link href="/" className="text-xl font-bold">
          OpenHostel
        </Link>
        <div className="mt-36">
          <p className="text-sm uppercase tracking-[.25em] text-[#f4c86a]">
            CSA Hostel
          </p>
          <h1 className="mt-5 text-6xl font-bold leading-tight">
            Everything hostel.
            <br />
            One secure place.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-emerald-50">
            Sign in with your Gmail or the unique ID issued by your
            administrator.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <Link href="/" className="text-sm text-slate-500">
            ← Back to website
          </Link>
          <p className="mt-9 text-xs font-bold uppercase tracking-[.2em] text-[#d63a36]">
            Secure access
          </p>
          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Welcome back.
          </h2>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Gmail or unique ID
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="field mt-2"
                placeholder="you@gmail.com / ADM-001"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-2"
                placeholder="Enter password"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#d63a36]"
              >
                Forgot password?
              </Link>
            </div>
            <button disabled={busy} className="btn-primary w-full">
              {busy ? "Logging in..." : "Log in →"}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-600">
            New student?{" "}
            <Link href="/register" className="font-bold text-[#d63a36]">
              Send an application
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

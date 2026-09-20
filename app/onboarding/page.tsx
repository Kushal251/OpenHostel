"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event?: FormEvent, skip = false) {
    event?.preventDefault();
    setError("");

    if (!skip && password !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword, skip }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error || "Password could not be changed. Please try again.",
        );
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f3ee] p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d63a36]">
          First login
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Secure your account
        </h1>
        <p className="mt-3 text-slate-600">
          Set a private password now, or skip it for this browser session.
        </p>
        <form onSubmit={(event) => save(event)} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            New password
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              className="field mt-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Confirm password
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter the same password again"
              className="field mt-2"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Changing password..." : "Change password"}
          </button>
        </form>
        <button
          disabled={busy}
          onClick={() => save(undefined, true)}
          className="mt-4 w-full text-sm font-semibold text-slate-600 disabled:opacity-50"
        >
          Skip for this session
        </button>
      </section>
    </main>
  );
}

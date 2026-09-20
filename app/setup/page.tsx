"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
export default function SetupPage() {
  const [form, setForm] = useState({
      name: "",
      email: "",
      uniqueId: "ADM-001",
      password: "",
    }),
    [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/setup/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setMessage(r.ok ? "Admin created. You can log in now." : d.error);
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f3ee] p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-sm text-slate-500">
          ← OpenHostel
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#d63a36]">
          One-time setup
        </p>
        <h1 className="mt-3 text-3xl font-bold">Create the first admin</h1>
        <p className="mt-3 text-sm text-slate-600">
          This endpoint locks automatically after the first admin account
          exists.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {(
            [
              ["name", "Name"],
              ["email", "Gmail"],
              ["uniqueId", "Unique ID"],
              ["password", "Password"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <input
                required
                type={
                  key === "password"
                    ? "password"
                    : key === "email"
                      ? "email"
                      : "text"
                }
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="field mt-1"
              />
            </label>
          ))}
          {message && <p className="text-sm text-[#d63a36]">{message}</p>}
          <button className="btn-primary w-full">Create admin</button>
        </form>
      </section>
    </main>
  );
}

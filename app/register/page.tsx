"use client";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import { HOSTELS } from "@/lib/hostel";
const branches = ["CSE", "IT", "EC", "EX", "MECH", "AUTO", "CIVIL", "PCT"];
const initial = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  college: "UIT RGPV",
  branch: "",
  hostel: "CSA",
  passingYear: "",
  enrollmentNo: "",
  photoUrl: "",
};
export default function RegisterPage() {
  const [form, setForm] = useState(initial),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [photoName, setPhotoName] = useState("");
  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function uploadPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const config = await fetch("/api/cloudinary/signature").then((r) =>
      r.json(),
    );
    if (!config.configured) {
      update("photoUrl", URL.createObjectURL(file));
      return;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", config.uploadPreset);
    const result = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body: data },
    ).then((r) => r.json());
    if (result.secure_url) update("photoUrl", result.secure_url);
    else setError("Photo upload failed. Please try again.");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setDone(true);
  }
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#234b50]">
            OpenHostel
          </Link>
          <Link href="/login" className="text-sm font-semibold text-[#d63a36]">
            Already have access? Log in
          </Link>
        </header>
        <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d63a36]">
            Student admission request
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Find your room at CSA.
          </h1>
          <p className="mt-3 text-slate-600">
            Submit your details. An admin, warden, or caretaker will verify and
            approve your application.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(v) => update("firstName", v)}
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(v) => update("lastName", v)}
            />
            <Input
              label="Gmail address"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Input
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              required={false}
            />
            <Select
              label="College"
              value={form.college}
              onChange={(v) => update("college", v)}
              options={["UIT RGPV"]}
            />
            <Select
              label="Branch"
              value={form.branch}
              onChange={(v) => update("branch", v)}
              options={branches}
              placeholder="Select branch"
            />
            <Select
              label="Hostel"
              value={form.hostel}
              onChange={(v) => update("hostel", v)}
              options={HOSTELS}
            />
            <Input
              label="Passing year"
              type="number"
              value={form.passingYear}
              onChange={(v) => update("passingYear", v)}
              placeholder="2028"
            />
            <Input
              label="Enrollment number"
              value={form.enrollmentNo}
              onChange={(v) => update("enrollmentNo", v)}
              placeholder="0827CS221001"
            />
            <label className="block text-sm font-semibold text-slate-700">
              Profile photo
              <input
                accept="image/*"
                type="file"
                onChange={uploadPhoto}
                className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-2 text-sm font-normal"
              />
              {photoName && (
                <span className="mt-1 block text-xs text-emerald-700">
                  {photoName} attached
                </span>
              )}
            </label>
            <div className="sm:col-span-2">
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <button disabled={loading} className="btn-primary w-full">
                {loading ? "Submitting..." : "Send for approval →"}
              </button>
            </div>
          </form>
        </section>
      </div>
      <Modal open={done} title="Request sent" onClose={() => setDone(false)}>
        <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-950">
          <p className="font-semibold">
            Aapki request authority ko bhej di gayi hai.
          </p>
          <p className="mt-2 text-sm leading-6">
            Warden, caretaker, ya admin se approval aur temporary password lein.
            Approval ke baad isi password se login kar sakte hain.
          </p>
        </div>
        <Link href="/login" className="btn-primary mt-5 flex justify-center">
          Go to login
        </Link>
      </Modal>
    </main>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field mt-2"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-2"
      >
        <option value="" disabled>
          {placeholder || "Select"}
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

type AdminProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
};

export default function ProfileEditor({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const original = {
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    email: profile.email,
    phone: profile.phone || "",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(original);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(profile.photoUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Please select an image file.");
    if (file.size > 5 * 1024 * 1024)
      return setError("Photo must be smaller than 5 MB.");
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadPhoto() {
    if (!photoFile) return profile.photoUrl || "";
    const config = await fetch("/api/cloudinary/signature").then((response) =>
      response.json(),
    );
    if (!config.configured)
      throw new Error(
        "Cloudinary is not configured, so the new photo cannot be saved.",
      );
    const data = new FormData();
    data.append("file", photoFile);
    data.append("upload_preset", config.uploadPreset);
    data.append("folder", "openhostel/profiles");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body: data },
    );
    const result = await response.json();
    if (!response.ok || !result.secure_url)
      throw new Error(result.error?.message || "Photo upload failed.");
    return String(result.secure_url);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, string | null> = {};
      for (const key of Object.keys(form) as (keyof typeof form)[])
        if (form[key] !== original[key])
          payload[key] = form[key].trim() || null;
      if (photoFile) payload.photoUrl = await uploadPhoto();
      if (Object.keys(payload).length === 0) return setOpen(false);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Profile could not be updated.");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Profile could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        Edit my profile
      </button>
      <Modal open={open} title="Edit my profile" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            {preview ? (
              <img
                src={preview}
                alt="Profile photo preview"
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-[#234b50] text-2xl font-bold text-white">
                {form.firstName[0] || "A"}
              </div>
            )}
            <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-slate-200">
              Change photo
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={choosePhoto}
              />
            </label>
          </div>
          <ProfileField
            label="First name"
            value={form.firstName}
            onChange={(value) => setForm({ ...form, firstName: value })}
          />
          <ProfileField
            label="Last name"
            value={form.lastName}
            onChange={(value) => setForm({ ...form, lastName: value })}
          />
          <ProfileField
            label="Gmail"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
          />
          <ProfileField
            label="Phone"
            required={false}
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600"
            >
              Cancel
            </button>
            <button disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-1.5"
      />
    </label>
  );
}

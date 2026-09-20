"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";

const branches = ["CSE", "IT", "EC", "EX", "MECH", "AUTO", "CIVIL", "PCT"];

export type EditableStudent = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  college?: string;
  branch?: string;
  hostel?: string;
  passingYear?: number;
  enrollmentNo?: string;
  roomNumber?: string;
};

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  hostel: string;
  passingYear: string;
  enrollmentNo: string;
  roomNumber: string;
};

function createDraft(student: EditableStudent): Draft {
  return {
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    email: student.email,
    phone: student.phone || "",
    college: student.college || "UIT RGPV",
    branch: student.branch || "",
    hostel: student.hostel || "CSA",
    passingYear: student.passingYear ? String(student.passingYear) : "",
    enrollmentNo: student.enrollmentNo || "",
    roomNumber: student.roomNumber || "",
  };
}

export default function StudentEditor({ student, onClose, onSaved }: { student: EditableStudent | null; onClose: () => void; onSaved: (student: EditableStudent) => void }) {
  if (!student) return null;
  return <StudentEditorForm key={student.id} student={student} onClose={onClose} onSaved={onSaved} />;
}

function StudentEditorForm({ student, onClose, onSaved }: { student: EditableStudent; onClose: () => void; onSaved: (student: EditableStudent) => void }) {
  const original = useMemo(() => createDraft(student), [student]);
  const [draft, setDraft] = useState<Draft>(original);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(student.photoUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select an image file.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo must be smaller than 5 MB.");
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadPhoto() {
    if (!photoFile) return student.photoUrl || "";
    const configResponse = await fetch("/api/cloudinary/signature");
    const config = await configResponse.json();
    if (!config.configured) throw new Error("Cloudinary is not configured. Add the cloud name and unsigned upload preset before saving a new photo.");
    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("upload_preset", config.uploadPreset);
    formData.append("folder", "openhostel/students");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Photo upload failed.");
    return String(result.secure_url);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, string | number | null> = {};
      for (const key of Object.keys(draft) as (keyof Draft)[]) {
        if (draft[key] === original[key]) continue;
        if (key === "passingYear") payload.passingYear = draft.passingYear ? Number(draft.passingYear) : null;
        else payload[key] = draft[key].trim() || null;
      }
      if (photoFile) payload.photoUrl = await uploadPhoto();
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
      const response = await fetch(`/api/admin/users/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Student profile could not be updated.");
      onSaved(result as EditableStudent);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Student profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return <Modal open title="Edit student profile" onClose={onClose}>
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
        {photoPreview ? <img src={photoPreview} alt="Selected student profile preview" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-[#f8e2dc] text-2xl font-bold text-[#d63a36]">{draft.firstName[0] || "S"}</div>}
        <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#234b50] shadow-sm ring-1 ring-slate-200">
          Change photo
          <input type="file" accept="image/*" onChange={choosePhoto} className="sr-only" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label="First name" value={draft.firstName} onChange={(value) => update("firstName", value)} />
        <EditorField label="Last name" value={draft.lastName} onChange={(value) => update("lastName", value)} />
        <EditorField label="Gmail" type="email" value={draft.email} onChange={(value) => update("email", value)} />
        <EditorField label="Phone" required={false} value={draft.phone} onChange={(value) => update("phone", value)} />
        <EditorSelect label="College" value={draft.college} options={["UIT RGPV"]} onChange={(value) => update("college", value)} />
        <EditorSelect label="Branch" value={draft.branch} options={branches} onChange={(value) => update("branch", value)} />
        <EditorSelect label="Hostel" value={draft.hostel} options={["CSA"]} onChange={(value) => update("hostel", value)} />
        <EditorField label="Passing year" type="number" value={draft.passingYear} onChange={(value) => update("passingYear", value)} />
        <EditorField label="Enrollment number" value={draft.enrollmentNo} onChange={(value) => update("enrollmentNo", value)} />
        <EditorField label="Room number" required={false} value={draft.roomNumber} onChange={(value) => update("roomNumber", value)} placeholder="Not assigned" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button>
        <button disabled={saving} className="btn-primary">{saving ? "Saving changes..." : "Save changes"}</button>
      </div>
    </form>
  </Modal>;
}

function EditorField({ label, value, onChange, type = "text", required = true, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {

  return <label className="text-sm font-semibold text-slate-700">{label}
  <input required={required} type={type} 
  value={value} 
  onChange={(event) => onChange(event.target.value)} 
  placeholder={placeholder} className="field mt-1.5" />
  </label>;
}

function EditorSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm font-semibold text-slate-700">{label}
  <select required 
  value={value} 
  onChange={(event) => onChange(event.target.value)} 
  className="field mt-1.5">
    <option value="" disabled>Select {label.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}
    </select>
    </label>;
}

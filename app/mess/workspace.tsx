"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { useRouter } from "next/navigation";
import { HOSTELS } from "@/lib/hostel";
type Window = {
  id?: string;
  label: string;
  startTime: string;
  endTime: string;
};
type Person = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  username: string;
  enrollmentNo?: string;
  photoUrl?: string;
  role: string;
};
type Mess = {
  id: string;
  name: string;
  hostel: string;
  menuImageUrl?: string | null;
  phoneNumbers: string[];
  email?: string | null;
  about?: string | null;
  managerId: string;
  manager: Person;
  mealWindows: Window[];
  _count: { staff: number };
};
type PassUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  enrollmentNo: string | null;
  roomNumber: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  requestedAt: string;
};
type DeleteImpact = {
  messName: string;
  totalAffected: number;
  groups: {
    id: string;
    status: "ACTIVE" | "PENDING";
    days: number;
    users: PassUser[];
  }[];
};
const meals = ["Breakfast", "Lunch", "Evening snacks", "Dinner"];
const blank = () => ({
  name: "",
  hostel: "",
  menuImageUrl: "",
  phoneNumbers: [""],
  email: "",
  about: "",
  managerId: "",
  mealWindows: meals.map((label) => ({ label, startTime: "", endTime: "" })),
});

export default function MessWorkspace({ role }: { role: string }) {
  const [messes, setMesses] = useState<Mess[]>([]);
  const [loadingMesses, setLoadingMesses] = useState(true);
  const [messLoadError, setMessLoadError] = useState("");
  const [managers, setManagers] = useState<Person[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mess | null>(null);
  const [form, setForm] = useState(blank());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingMess, setDeletingMess] = useState<Mess | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<DeleteImpact | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const router = useRouter();
  const load = async () => {
    setLoadingMesses(true);
    setMessLoadError("");
  

    
    try {
      let response: Response | undefined;
      for (const delay of [0, 400, 1_000]) {
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        response = await fetch("/api/messes");
        if (response.ok || response.status !== 503) break;
      }
      if (!response?.ok) throw new Error();
      setMesses(await response.json());
    } catch {
      setMessLoadError("Mess directory could not be loaded. Please try again.");
    } finally {
      setLoadingMesses(false);
    }
  };
  useEffect(() => {
    void load();
  }, [role]);
  const heading = role === "ADMIN" ? "Mess management" : "My mess workspace";
  const everyHostelAlreadyHasAMess = HOSTELS.every((hostel) =>
    messes.some((mess) => mess.hostel === hostel),
  );
  const loadManagers = async () => {
    if (role !== "ADMIN" || managers.length || loadingManagers) return;
    setLoadingManagers(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok)
        setManagers(
          (await response.json()).filter(
            (user: Person) => user.role === "MESS_MANAGER",
          ),
        );
    } finally {
      setLoadingManagers(false);
    }
  };
  function begin(mess?: Mess) {
    setError("");
    setEditing(mess || null);
    setForm(
      mess
        ? {
            name: mess.name,
            hostel: mess.hostel,
            menuImageUrl: mess.menuImageUrl || "",
            phoneNumbers: mess.phoneNumbers.length ? mess.phoneNumbers : [""],
            email: mess.email || "",
            about: mess.about || "",
            managerId: mess.managerId,
            mealWindows: mess.mealWindows.map(
              ({ label, startTime, endTime }) => ({
                label,
                startTime,
                endTime,
              }),
            ),
          }
        : blank(),
    );
    setOpen(true);
    void loadManagers();
  }
  async function beginDelete(mess: Mess) {
    setDeletingMess(mess);
    setDeleteImpact(null);
    setDeleteError("");
    setExpandedGroup(null);
    try {
      const response = await fetch(`/api/messes/${mess.id}/delete-impact`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load pass details.");
      setDeleteImpact(data);
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Could not load pass details.",
      );
    }
  }
  async function deleteMess() {
    if (!deletingMess) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/messes/${deletingMess.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete the mess.");
      setDeletingMess(null);
      setDeleteImpact(null);
      void load();
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Could not delete the mess.",
      );
    } finally {
      setDeleting(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(
      editing ? `/api/messes/${editing.id}` : "/api/messes",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error || "Could not save the mess.");
    setOpen(false);
    void load();
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-9">
      <section className="rounded-[2rem] bg-[#234b50] px-6 py-8 text-white sm:px-10 sm:py-11">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#f4c86a]">
          Operations / food service
        </p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-5xl">{heading}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
              Create one verified mess for each hostel, keep the menu current,
              and give your mess staff future analysis access.
            </p>
          </div>
          <button
            onClick={() => begin()}
            disabled={role === "ADMIN" && everyHostelAlreadyHasAMess}
            title={
              role === "ADMIN" && everyHostelAlreadyHasAMess
                ? "Delete the existing CSA mess before creating another one."
                : undefined
            }
            className="min-h-12 shrink-0 rounded-xl bg-[#d63a36] px-5 font-bold text-white hover:bg-[#b92f2c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            
              + Create mess
          </button>
        </div>
      </section>
      <section className="mt-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">
              {loadingMesses ? "Loading directory" : `${messes.length} active`}
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Mess directory
            </h2>
          </div>
        </div>
        {loadingMesses ? (
          <DirectorySkeleton />
        ) : messLoadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
            {messLoadError}
            <button onClick={() => void load()} className="ml-2 underline">Retry</button>
          </div>
        ) : messes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No mess is created yet. Use <b>Create mess</b> to start.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {messes.map((mess) => (
              <MessCard
                key={mess.id}
                onClick={() => router.push(`/mess/${mess.id}`)}
                mess={mess}
                onEdit={() => begin(mess)}
                redirect={() => router.push(`/mess/${mess.id}/manage`)}
                onDelete={() => void beginDelete(mess)}
                canDelete={role === "ADMIN"}
              />
            ))}
          </div>
        )}
      </section>
      <MessForm
        open={open}
        form={form}
        setForm={setForm}
        role={role}
        managers={managers}
        loadingManagers={loadingManagers}
        error={error}
        saving={saving}
        title={editing ? "Edit mess details" : "Create a mess"}
        onClose={() => setOpen(false)}
        onSave={save}
      />
      <DeleteMessModal
        mess={deletingMess}
        impact={deleteImpact}
        error={deleteError}
        deleting={deleting}
        expandedGroup={expandedGroup}
        onClose={() => !deleting && setDeletingMess(null)}
        onToggleGroup={(groupId) =>
          setExpandedGroup((current) => (current === groupId ? null : groupId))
        }
        onDelete={() => void deleteMess()}
      />
    </div>
  );
}

function MessCard({
  mess,
  onClick,
  onEdit,
  redirect,
  onDelete,
  canDelete,
}: {
  mess: Mess;
  onClick: () => void;
  onEdit: () => void;
  redirect: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div onClick={onClick} className="grid min-h-48 place-items-center bg-gradient-to-br from-[#f8e2dc] to-[#f4c86a]/55">
       
          {mess.menuImageUrl ? (
            <img
              src={mess.menuImageUrl}
              alt={`${mess.name} menu`}
              className="h-48 w-full object-cover"
            />
        ) : (
          <span className="text-5xl">🍽️</span>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">
              {mess.hostel}
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              {mess.name}
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Active
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {mess.about || "No description added yet."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {mess.mealWindows.slice(0, 4).map((window) => (
            <div
              key={window.id || window.label}
              className="rounded-xl bg-slate-50 px-3 py-2"
            >
              <p className="text-xs font-bold text-slate-700">{window.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {window.startTime || "—"} – {window.endTime || "—"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
          <span className="truncate pr-3 text-slate-600">
            Manager · {mess.manager.firstName || mess.manager.email}
          </span>
          <span className="shrink-0 font-bold text-[#234b50]">
            {mess._count.staff} staff
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onEdit}
            className="min-h-11 rounded-xl bg-[#e8f1f0] px-3 text-sm font-bold text-[#234b50]"
          >
            Edit details
          </button>
          <button
            onClick={() => redirect()}
            className="min-h-11 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white"
          >
            Manage mess
          </button>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="mt-3 min-h-10 text-sm font-bold text-red-700 hover:text-red-900"
          >
            Delete mess
          </button>
        )}
      </div>
    </article>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-label="Loading mess directory" aria-busy="true">
      {[0, 1].map((item) => (
        <article key={item} className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="h-48 bg-slate-200" />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-7 w-48 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="grid grid-cols-2 gap-2"><div className="h-12 rounded-xl bg-slate-100" /><div className="h-12 rounded-xl bg-slate-100" /></div>
            <div className="grid grid-cols-2 gap-3"><div className="h-11 rounded-xl bg-slate-200" /><div className="h-11 rounded-xl bg-slate-200" /></div>
          </div>
        </article>
      ))}
    </div>
  );
}

function MessForm({
  open,
  form,
  setForm,
  role,
  managers,
  loadingManagers,
  error,
  saving,
  title,
  onClose,
  onSave,
}: {
  open: boolean;
  form: ReturnType<typeof blank>;
  setForm: (value: ReturnType<typeof blank>) => void;
  role: string;
  managers: Person[];
  loadingManagers: boolean;
  error: string;
  saving: boolean;
  title: string;
  onClose: () => void;
  onSave: (event: FormEvent) => void;
}) {
  const updateWindow = (index: number, key: keyof Window, value: string) =>
    setForm({
      ...form,
      mealWindows: form.mealWindows.map((window, i) =>
        i === index ? { ...window, [key]: value } : window,
      ),
    });
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm({ ...form, menuImageUrl: preview });
    const config = await fetch("/api/cloudinary/signature").then((r) =>
      r.json(),
    );
    if (!config.configured) return;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", config.uploadPreset);
    const result = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body: data },
    ).then((r) => r.json());
    if (result.secure_url)
      setForm({ ...form, menuImageUrl: result.secure_url });
  }
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={onSave} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Mess name"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="e.g. Annapurna Mess"
          />
          <Field
            label="Hostel where it runs"
            value={form.hostel}
            onChange={(value) => setForm({ ...form, hostel: value })}
            options={HOSTELS}
            placeholder="Select hostel"
          />
          {role === "ADMIN" && (
            <label className="text-sm font-bold">
              Mess manager
              <select
                required
                value={form.managerId}
                onChange={(e) =>
                  setForm({ ...form, managerId: e.target.value })
                }
                className="field mt-1"
                >
                <option value="">{loadingManagers ? "Loading managers…" : "Select manager"}</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName || manager.email} · {manager.email}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Field
            optional
            label="Gmail ID"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="mess@example.com"
          />
        </div>
        <label className="block text-sm font-bold">
          About this mess
          <textarea
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-[#d63a36]"
            placeholder="Food style, hygiene or special notes…"
          />
        </label>
        <div>
          <p className="text-sm font-bold">Mobile numbers</p>
          <div className="mt-2 space-y-2">
            {form.phoneNumbers.map((phone, index) => (
              <div className="flex gap-2" key={index}>
                <input
                  required
                  className="field"
                  value={phone}
                  inputMode="tel"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phoneNumbers: form.phoneNumbers.map((item, i) =>
                        i === index ? e.target.value : item,
                      ),
                    })
                  }
                  placeholder="+91 98765 43210"
                />
                {form.phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        phoneNumbers: form.phoneNumbers.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                    className="min-h-12 rounded-xl bg-red-50 px-3 font-bold text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, phoneNumbers: [...form.phoneNumbers, ""] })
            }
            className="mt-2 text-sm font-bold text-[#d63a36]"
          >
            + Add another number
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Menu photo</p>
            {form.menuImageUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, menuImageUrl: "" })}
                className="text-sm font-bold text-red-600"
              >
                Delete photo
              </button>
            )}
          </div>
          <label className="mt-2 flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-500">
            {form.menuImageUrl ? (
              <img
                src={form.menuImageUrl}
                alt="Menu preview"
                className="h-40 w-full object-cover"
              />
            ) : (
              <span>Tap to upload and preview your menu image</span>
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={upload}
            />
          </label>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Serving windows</p>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  mealWindows: [
                    ...form.mealWindows,
                    { label: "", startTime: "", endTime: "" },
                  ],
                })
              }
              className="text-sm font-bold text-[#d63a36]"
            >
              + Add window
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {form.mealWindows.map((window, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex gap-2">
                  <input
                    required
                    value={window.label}
                    onChange={(e) =>
                      updateWindow(index, "label", e.target.value)
                    }
                    placeholder="Meal name"
                    className="field"
                  />
                  {form.mealWindows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          mealWindows: form.mealWindows.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                      className="rounded-xl px-2 text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    required
                    type="time"
                    aria-label="Start time"
                    value={window.startTime}
                    onChange={(e) =>
                      updateWindow(index, "startTime", e.target.value)
                    }
                    className="field"
                  />
                  <input
                    required
                    type="time"
                    aria-label="End time"
                    value={window.endTime}
                    onChange={(e) =>
                      updateWindow(index, "endTime", e.target.value)
                    }
                    className="field"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button disabled={saving} className="btn-primary w-full">
          {saving ? "Saving…" : "Save mess"}
        </button>
      </form>
    </Modal>
  );
}


function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  optional = false,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  options?: readonly string[];
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      {optional && (
        <span className="ml-1 font-normal text-slate-400">(optional)</span>
      )}
      {options ? (
        <select
          required={!optional}
          className="field mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>{placeholder || "Select"}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input
          required={!optional}
          type={type}
          className="field mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function DeleteMessModal({
  mess,
  impact,
  error,
  deleting,
  expandedGroup,
  onClose,
  onToggleGroup,
  onDelete,
}: {
  mess: Mess | null;
  impact: DeleteImpact | null;
  error: string;
  deleting: boolean;
  expandedGroup: string | null;
  onClose: () => void;
  onToggleGroup: (groupId: string) => void;
  onDelete: () => void;
}) {
  return (
    <Modal open={Boolean(mess)} title="Delete mess" onClose={onClose}>
      <p className="text-sm leading-6 text-slate-600">
        Deleting <b>{mess?.name}</b> permanently removes this mess, its offers,
        serving windows, staff assignments, and pass records. You can then add a
        new mess for the same hostel.
      </p>
      {!impact && !error && <p className="mt-5 text-sm text-slate-500">Checking active and pending passes…</p>}
      {impact && (
        <div className="mt-5">
          <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            {impact.totalAffected
              ? `${impact.totalAffected} student${impact.totalAffected === 1 ? " has" : "s have"} an active or pending pass.`
              : "There are no active or pending passes for this mess."}
          </p>
          {impact.groups.length > 0 && (
            <div className="mt-3 space-y-2">
              {impact.groups.map((group) => (
                <div key={group.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onToggleGroup(group.id)}
                    className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left text-sm"
                  >
                    <span><b>{group.days}-day</b> {group.status.toLowerCase()} pass</span>
                    <span className="font-bold text-[#d63a36]">{group.users.length} students · {expandedGroup === group.id ? "Hide" : "View"}</span>
                  </button>
                  {expandedGroup === group.id && (
                    <ul className="divide-y divide-slate-100 border-t border-slate-200 bg-slate-50">
                      {group.users.map((user) => (
                        <li key={user.id} className="px-4 py-3 text-sm">
                          <p className="font-semibold text-slate-900">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{user.email}{user.enrollmentNo ? ` · ${user.enrollmentNo}` : ""}{user.roomNumber ? ` · Room ${user.roomNumber}` : ""}</p>
                          <p className="mt-1 text-xs text-slate-500">{group.status === "ACTIVE" && user.expiresAt ? `Valid until ${new Date(user.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "Awaiting approval"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={deleting} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700">Cancel</button>
        <button type="button" onClick={onDelete} disabled={!impact || deleting} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {deleting ? "Deleting…" : "Delete permanently"}
        </button>
      </div>
    </Modal>
  );
}

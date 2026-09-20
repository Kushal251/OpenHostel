"use client";

import { FormEvent, type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import StudentEditor, { type EditableStudent } from "./student-editor";

type User = EditableStudent & {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  uniqueId?: string | null;
  temporaryPassword?: string | null;
  mustChangePassword?: boolean;
  createdAt: string;
  approvedAt?: string | null;
  updatedAt?: string;
};

type PageData = {
  items: User[];
  total: number;
  counts: Record<string, number>;
  authorityCount: number;
  page: number;
  hasNext: boolean;
};

type DetailEntry = { user: User; cachedAt: number };

const roles = ["WARDEN", "CARETAKER", "GATEKEEPER", "MESS_MANAGER", "ADMIN"];
const filters = ["ALL", "PENDING", "APPROVED", "ACTIVE"];
const emptyStaff = { firstName: "", lastName: "", email: "", phone: "", uniqueId: "", role: "WARDEN", password: "" };

function pageKey(status: string, query: string, page: number) {
  return `${status}|${query}|${page}`;
}

export default function AdminWorkspace() {
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [cachedUsers, setCachedUsers] = useState<Record<string, User>>({});
  const [details, setDetails] = useState<Record<string, DetailEntry>>({});
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summary, setSummary] = useState<{ counts: Record<string, number>; authorityCount: number }>({ counts: {}, authorityCount: 0 });
  const [staffOpen, setStaffOpen] = useState(false);
  const [staff, setStaff] = useState(emptyStaff);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [approve, setApprove] = useState<User | null>(null);
  const [room, setRoom] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [credential, setCredential] = useState<{ password: string; username: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [filter, query]);

  const loadPage = useCallback(async (targetPage: number, refresh = false) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(targetPage), status: filter });
      if (query) params.set("q", query);
      if (refresh) params.set("refresh", "true");
      const response = await fetch(`/api/admin/users?${params}`);
      const data = (await response.json()) as PageData & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load the directory.");
      setPages((current) => ({ ...current, [pageKey(filter, query, targetPage)]: data }));
      setCachedUsers((current) => ({ ...current, ...Object.fromEntries(data.items.map((user) => [user.id, user])) }));
      setSummary({ counts: data.counts, authorityCount: data.authorityCount });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the directory.");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  const currentKey = pageKey(filter, query, page);
  const current = pages[currentKey];

  useEffect(() => {
    if (!pages[currentKey]) void loadPage(page);
  }, [currentKey, loadPage, page, pages]);

  function updateCachedUser(incoming: User) {
    setCachedUsers((currentUsers) => ({ ...currentUsers, [incoming.id]: { ...currentUsers[incoming.id], ...incoming } }));
    setDetails((currentDetails) => ({ ...currentDetails, [incoming.id]: { user: { ...currentDetails[incoming.id]?.user, ...incoming }, cachedAt: Date.now() } }));
    setPages((currentPages) => Object.fromEntries(Object.entries(currentPages).map(([key, value]) => [key, { ...value, items: value.items.map((user) => user.id === incoming.id ? { ...user, ...incoming } : user) }])));
    setSelected((currentSelected) => currentSelected?.id === incoming.id ? { ...currentSelected, ...incoming } : currentSelected);
  }

  async function refreshDirectory() {
    setRefreshing(true);
    setPage(1);
    setPages((currentPages) => Object.fromEntries(Object.entries(currentPages).filter(([key]) => !key.startsWith(`${filter}|${query}|`))));
    await loadPage(1, true);
    setRefreshing(false);
  }

  async function openProfile(user: User) {
    setSelected(user);
    const cached = details[user.id];
    if (cached && Date.now() - cached.cachedAt < 300_000) {
      setSelected(cached.user);
      return;
    }
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      const data = (await response.json()) as User & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load profile details.");
      updateCachedUser(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load profile details.");
    } finally {
      setDetailLoading(false);
    }
  }

  function insertNewUser(user: User) {
    updateCachedUser(user);
    setPages((currentPages) => {
      const key = pageKey("ALL", "", 1);
      const firstPage = currentPages[key];
      if (!firstPage) return currentPages;
      return { ...currentPages, [key]: { ...firstPage, items: [user, ...firstPage.items.filter((item) => item.id !== user.id)].slice(0, 10), total: firstPage.total + 1 } };
    });
    setSummary((currentSummary) => ({ counts: { ...currentSummary.counts, [user.status]: (currentSummary.counts[user.status] || 0) + 1 }, authorityCount: currentSummary.authorityCount + (user.role === "STUDENT" ? 0 : 1) }));
  }

  async function createStaff(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(staff) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create the account.");
    insertNewUser(data as User);
    setStaffOpen(false);
    setStaff(emptyStaff);
  }

  async function approveStudent() {
    if (!approve) return;
    setError("");
    const response = await fetch(`/api/admin/users/${approve.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomNumber: room }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not approve the student.");
    updateCachedUser(data.user as User);
    setSummary((currentSummary) => ({ ...currentSummary, counts: { ...currentSummary.counts, PENDING: Math.max(0, (currentSummary.counts.PENDING || 0) - 1), APPROVED: (currentSummary.counts.APPROVED || 0) + 1 } }));
    setApprove(null);
    setConfirm(false);
    setCredential(data);
    setRoom("");
  }

  async function rejectStudent(user: User) {
    if (!window.confirm(`Reject ${personName(user)}? Their pending account will be permanently deleted.`)) return;
    setError("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not reject the application.");
    setPages((currentPages) => Object.fromEntries(Object.entries(currentPages).map(([key, value]) => [key, { ...value, items: value.items.filter((item) => item.id !== user.id), total: Math.max(0, value.total - 1) }])));
    setCachedUsers(({ [user.id]: _removed, ...remaining }) => remaining);
    setDetails(({ [user.id]: _removed, ...remaining }) => remaining);
    setSummary((currentSummary) => ({ ...currentSummary, counts: { ...currentSummary.counts, PENDING: Math.max(0, (currentSummary.counts.PENDING || 0) - 1) } }));
    setSelected(null);
  }

  const knownUsers = useMemo(() => Object.values(cachedUsers).length, [cachedUsers]);

  return <main className="min-h-screen bg-[#f7f7f4]">
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d63a36]">People & approvals</p><h1 className="mt-1 text-3xl font-bold text-slate-900 sm:mt-2">Hostel directory</h1></div><div className="flex gap-2"><button onClick={() => void refreshDirectory()} disabled={refreshing} className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#234b50] ring-1 ring-slate-200 disabled:opacity-60">{refreshing ? <span className="inline-flex items-center gap-2"><Spinner /> Refreshing</span> : "↻ Refresh"}</button><button onClick={() => setStaffOpen(true)} className="btn-primary">+ Create authority</button></div></div>
      <div className="mt-5 grid gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4"><Stat label="Pending applications" value={summary.counts.PENDING || 0} tone="amber" /><Stat label="Approved students" value={summary.counts.APPROVED || 0} tone="green" /><Stat label="Authority accounts" value={summary.authorityCount} tone="blue" /></div>
      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-start sm:justify-between"><div className="w-full sm:max-w-md"><input className="field" placeholder="Search name, email, enrollment, room or ID" value={search} onChange={(event) => setSearch(event.target.value)} /><p className="mt-1 text-xs text-slate-500">{knownUsers} loaded users are kept locally for this session.</p></div><label className="w-full text-sm font-semibold text-slate-700 sm:w-52">Filter people<select value={filter} onChange={(event) => setFilter(event.target.value)} className="field mt-1"><option value="ALL">All people</option>{filters.filter((item) => item !== "ALL").map((item) => <option key={item} value={item}>{item[0] + item.slice(1).toLowerCase()}</option>)}</select></label></div>
      <section className="mt-5 space-y-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">{loading ? <div className="flex items-center justify-center gap-3 p-10 text-slate-500"><Spinner /> Loading 10 recent people…</div> : error && !current ? <p className="p-7 text-red-600">{error}</p> : current?.items.length ? current.items.map((user) => <PersonCard key={user.id} user={user} onView={() => void openProfile(user)} onApprove={() => setApprove(user)} />) : <p className="p-7 text-slate-500">No people match this filter.</p>}</section>
      {current && !loading && <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Showing {(page - 1) * 10 + (current.items.length ? 1 : 0)}–{(page - 1) * 10 + current.items.length} of {current.total}</span><div className="flex gap-2"><button className="min-h-10 rounded-xl bg-white px-4 font-bold ring-1 ring-slate-200 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Previous</button><button className="min-h-10 rounded-xl bg-white px-4 font-bold ring-1 ring-slate-200 disabled:opacity-40" disabled={!current.hasNext} onClick={() => setPage((value) => value + 1)}>Next →</button></div></div>}
      {error && current && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
    <Modal open={staffOpen} title="Create authority account" onClose={() => setStaffOpen(false)}><form onSubmit={createStaff} className="grid gap-3 sm:grid-cols-2"><Field label="First name" value={staff.firstName} onChange={(value) => setStaff({ ...staff, firstName: value })} /><Field label="Last name" value={staff.lastName} onChange={(value) => setStaff({ ...staff, lastName: value })} /><Field label="Official Gmail" type="email" value={staff.email} onChange={(value) => setStaff({ ...staff, email: value })} /><Field label="Phone number" value={staff.phone} onChange={(value) => setStaff({ ...staff, phone: value })} /><Field label="Unique ID" value={staff.uniqueId} onChange={(value) => setStaff({ ...staff, uniqueId: value })} placeholder="WRD-001" /><label className="text-sm font-semibold">Role<select value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value })} className="field mt-1"><option value="" disabled>Select role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><div className="sm:col-span-2"><Field label="Temporary account password" type="password" value={staff.password} onChange={(value) => setStaff({ ...staff, password: value })} /></div><button className="btn-primary sm:col-span-2">Create & give credentials</button></form></Modal>
    <Modal open={!!approve} title="Assign a room" onClose={() => setApprove(null)}><p className="mb-4 text-sm text-slate-600">Approval is only possible after assigning a room to {approve && personName(approve)}.</p><input autoFocus className="field" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="e.g. A-204" /><button disabled={!room} onClick={() => setConfirm(true)} className="btn-primary mt-5 w-full">Continue to verification</button></Modal>
    <Modal open={confirm} title="Verify before approval" onClose={() => setConfirm(false)}><div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm leading-6"><p><b>Name:</b> {approve && personName(approve)}</p><p><b>Gmail:</b> {approve?.email}</p><p><b>Enrollment:</b> {approve?.enrollmentNo || "—"}</p><p><b>Room:</b> {room}</p></div><button onClick={() => void approveStudent()} className="btn-primary mt-5 w-full">Confirm & generate password</button></Modal>
    <Modal open={!!credential} title="Student credentials" onClose={() => setCredential(null)}><p className="text-slate-600">Share these credentials securely with the student.</p><div className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-sm text-white"><p>ID: {credential?.username}</p><p className="mt-2 text-lg font-bold">Password: {credential?.password}</p></div></Modal>
    <Modal open={!!selected} title="Profile details" onClose={() => setSelected(null)}>{selected && <div className="space-y-5"><div className="flex items-center gap-4"><Avatar user={selected} /><div><h2 className="text-lg font-bold">{personName(selected)}</h2><p className="text-sm text-slate-500">{selected.role.replaceAll("_", " ")} · <Status status={selected.status} /></p></div>{detailLoading && <Spinner />}</div><div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><Detail label="Email" value={selected.email} /><Detail label="Username" value={selected.username} /><Detail label="Enrollment no." value={selected.enrollmentNo || "—"} /><Detail label="Unique ID" value={selected.uniqueId || "—"} /><Detail label="Phone" value={selected.phone || "—"} /><Detail label="Room" value={selected.roomNumber || "Not assigned"} /><Detail label="College" value={selected.college || "—"} /><Detail label="Branch" value={selected.branch || "—"} /><Detail label="Hostel" value={selected.hostel || "—"} /><Detail label="Passing year" value={selected.passingYear ? String(selected.passingYear) : "—"} /><Detail label="Created" value={formatDate(selected.createdAt)} /><Detail label="Approved" value={formatDate(selected.approvedAt)} /></div>{selected.role === "STUDENT" && selected.temporaryPassword && <div className="rounded-xl bg-amber-50 p-3 text-sm"><b>Current temporary password:</b> {selected.temporaryPassword}</div>}<div className="flex flex-col gap-2 sm:flex-row">{selected.role === "STUDENT" && <button onClick={() => { setEditing(selected); setSelected(null); }} className="min-h-11 rounded-xl bg-[#234b50] px-4 py-2 font-bold text-white">Edit profile</button>}{selected.role === "STUDENT" && selected.status === "PENDING" && <button onClick={() => void rejectStudent(selected)} className="min-h-11 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-700">Reject & delete application</button>}</div></div>}</Modal>
    <StudentEditor student={editing} onClose={() => setEditing(null)} onSaved={(user) => { updateCachedUser(user as User); setEditing(null); }} />
  </main>;
}

function personName(user: User) { return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username; }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function Spinner() { return <span aria-label="Loading" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />; }
function PersonCard({ user, onView, onApprove }: { user: User; onView: () => void; onApprove: () => void }) {
  const openFromCard = () => onView();
  const stopAnd = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    action();
  };
  return <article role="button" tabIndex={0} onClick={openFromCard} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFromCard(); } }} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#234b50]/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#234b50] lg:flex lg:items-center lg:gap-5">
    <div className="flex items-start justify-between gap-3 lg:min-w-0 lg:flex-1"><div className="flex min-w-0 items-center gap-3"><Avatar user={user} /><div className="min-w-0"><p className="truncate font-bold text-slate-900">{personName(user)}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div><button onClick={stopAnd(onView)} className="min-h-9 shrink-0 rounded-lg px-2 text-sm font-bold text-[#234b50] hover:bg-slate-100 lg:hidden">View</button></div>
    <div className="hidden w-32 shrink-0 lg:block"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</p><p className="mt-1 text-sm font-medium text-slate-700">{user.role.replaceAll("_", " ")}</p></div>
    <div className="hidden w-28 shrink-0 lg:block"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p><div className="mt-1"><Status status={user.status} /></div></div>
    <div className="hidden w-32 shrink-0 xl:block"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Room / ID</p><p className="mt-1 truncate text-sm font-medium text-slate-700">{user.roomNumber ? `Room ${user.roomNumber}` : user.uniqueId || user.enrollmentNo || "—"}</p></div>
    <div className="hidden shrink-0 gap-2 lg:flex">{user.role === "STUDENT" && user.status === "PENDING" && <button onClick={stopAnd(onApprove)} className="min-h-11 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Approve</button>}<button onClick={stopAnd(onView)} className="min-h-11 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">View</button></div>
    <div className="mt-4 lg:hidden"><div className="grid grid-cols-2 gap-3 text-sm"><Info label="Role" value={user.role.replaceAll("_", " ")} /><Info label="Room / ID" value={user.roomNumber ? `Room ${user.roomNumber}` : user.uniqueId || user.enrollmentNo || "—"} /></div><div className="mt-4 flex justify-end"><Status status={user.status} /></div>{user.role === "STUDENT" && user.status === "PENDING" && <button onClick={stopAnd(onApprove)} className="mt-3 min-h-11 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Approve</button>}</div>
  </article>;
}
function Avatar({ user }: { user: User }) { return user.photoUrl ? <img src={user.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f8e2dc] font-bold text-[#d63a36]">{(user.firstName || user.username)[0]}</div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-0.5 break-words text-sm font-medium text-slate-700">{value}</p></div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="lg:contents"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 lg:hidden">{label}</p><div className="font-medium text-slate-700 lg:text-sm">{value}</div></div>; }
function Status({ status }: { status: string }) { return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${status === "PENDING" ? "bg-amber-100 text-amber-800" : status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{status}</span>; }
function Stat({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-3xl font-bold ${tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : "text-[#234b50]"}`}>{value}</p></div>; }
function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="text-sm font-semibold">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field mt-1" /></label>; }

"use client";

import { useEffect, useState } from "react";

type Window = { id: string; label: string; startTime: string; endTime: string; sortOrder: number };
type Mess = { id: string; name: string; hostel: string; windows: Window[]; hasOverride: boolean };

const asMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const asTime = (value: number) =>
  `${String(Math.floor(Math.max(0, Math.min(1439, value)) / 60)).padStart(2, "0")}:${String(Math.max(0, Math.min(1439, value)) % 60).padStart(2, "0")}`;

export default function TodayWindowManager({ messes }: { messes: Mess[] }) {
  const [items, setItems] = useState(messes);
  const [selectedMessId, setSelectedMessId] = useState(messes[0]?.id ?? "");
  const [allowOverlaps, setAllowOverlaps] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshUntil, setRefreshUntil] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const selectedMess = items.find((mess) => mess.id === selectedMessId) ?? items[0];

  useEffect(() => {
    const values: Record<string, number> = {};
    for (const mess of messes) {
      const saved = Number(window.localStorage.getItem(`openhostel:window-cache-refresh:${mess.id}`));
      if (saved > Date.now()) values[mess.id] = saved;
    }
    setRefreshUntil(values);
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [messes]);

  function change(index: number, field: "startTime" | "endTime", value: string) {
    if (!selectedMess) return;
    setItems((current) => current.map((mess) => {
      if (mess.id !== selectedMess.id) return mess;
      const windows = mess.windows.map((window) => ({ ...window }));
      windows[index][field] = value;
      if (field === "endTime" && !allowOverlaps[mess.id]) {
        for (let position = index + 1; position < windows.length; position += 1) {
          const duration = asMinutes(windows[position].endTime) - asMinutes(windows[position].startTime);
          windows[position].startTime = windows[position - 1].endTime;
          windows[position].endTime = asTime(asMinutes(windows[position].startTime) + Math.max(1, duration));
        }
      }
      return { ...mess, windows };
    }));
  }

  async function save(mess: Mess) {
    setSaving(mess.id); setNotice("");
    const response = await fetch(`/api/messes/${mess.id}/today-windows`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ windows: mess.windows, allowOverlaps: Boolean(allowOverlaps[mess.id]) }) });
    const data = await response.json(); setSaving("");
    if (!response.ok) return setNotice(data.error || "Could not save today's timings.");
    setItems((current) => current.map((item) => item.id === mess.id ? { ...item, windows: data.windows, hasOverride: true } : item));
    setNotice(`${mess.name}: today's timings saved.`);
  }

  async function reset(messId: string) {
    setSaving(messId); setNotice("");
    const response = await fetch(`/api/messes/${messId}/today-windows`, { method: "DELETE" });
    const data = await response.json(); setSaving("");
    if (!response.ok) return setNotice(data.error || "Could not reset today's timings.");
    setItems((current) => current.map((item) => item.id === messId ? { ...item, windows: data.windows, hasOverride: false } : item));
    setNotice("Default timings restored for today.");
  }

  async function refreshScannerCache(messId: string) {
    if (refreshUntil[messId] > Date.now()) return;
    setSaving(messId); setNotice("");
    const response = await fetch(`/api/messes/${messId}/today-windows`, { method: "POST" });
    const data = await response.json(); setSaving("");
    if (!response.ok) return setNotice(data.error || "Could not refresh the scanner cache.");
    const until = Date.now() + 5 * 60_000;
    window.localStorage.setItem(`openhostel:window-cache-refresh:${messId}`, String(until));
    setRefreshUntil((current) => ({ ...current, [messId]: until }));
    setNotice("Scanner timing cache refreshed. The next manual refresh is available in 5 minutes.");
  }

  if (!selectedMess) return null;

  const refreshRemaining = Math.max(0, (refreshUntil[selectedMess.id] || 0) - now);
  const refreshLabel = refreshRemaining ? `Refresh cache (${Math.ceil(refreshRemaining / 60)}m)` : "Refresh scanner cache";
  return <section className="mx-auto mt-6 max-w-5xl rounded-3xl border border-[#f4c86a]/60 bg-[#fffaf0] p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">Today only · IST</p><h2 className="mt-1 text-2xl font-bold text-[#234b50]">Today&apos;s serving windows</h2><p className="mt-1 text-sm leading-6 text-slate-600">Changes apply only to the selected mess for today.</p></div>{items.length > 1 && <label className="text-sm font-bold text-[#234b50]">Switch mess<select value={selectedMess.id} onChange={(event) => setSelectedMessId(event.target.value)} className="field mt-1 min-w-55 py-2">{items.map((mess) => <option key={mess.id} value={mess.id}>{mess.name} · {mess.hostel}</option>)}</select></label>}</div>
    {notice && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${notice.includes("saved") || notice.includes("restored") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{notice}</p>}
    <article className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{selectedMess.name}</h3><p className="text-sm text-slate-500">{selectedMess.hostel}{selectedMess.hasOverride ? " · custom timings active" : " · default timings"}</p></div><label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#234b50]"><input type="checkbox" checked={Boolean(allowOverlaps[selectedMess.id])} onChange={(event) => setAllowOverlaps((current) => ({ ...current, [selectedMess.id]: event.target.checked }))} /> Allow overlaps today</label></div><div className="mt-4 space-y-2">{selectedMess.windows.map((window, index) => <div key={window.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl bg-slate-50 p-3"><span className="min-w-0 truncate text-sm font-bold">{window.label}</span><input aria-label={`${window.label} start time`} type="time" value={window.startTime} onChange={(event) => change(index, "startTime", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" /><input aria-label={`${window.label} end time`} type="time" value={window.endTime} onChange={(event) => change(index, "endTime", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" /></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><button disabled={saving === selectedMess.id} onClick={() => void save(selectedMess)} className="btn-primary px-4 disabled:opacity-60">{saving === selectedMess.id ? "Saving…" : "Save today’s times"}</button>{selectedMess.hasOverride && <button disabled={saving === selectedMess.id} onClick={() => void reset(selectedMess.id)} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60">Reset to default</button>}<button disabled={saving === selectedMess.id || refreshRemaining > 0} onClick={() => void refreshScannerCache(selectedMess.id)} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-[#234b50] disabled:opacity-50">{saving === selectedMess.id ? "Refreshing…" : refreshLabel}</button></div></article>
  </section>;
}

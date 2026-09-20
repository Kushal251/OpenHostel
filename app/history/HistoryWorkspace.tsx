"use client";

import { useEffect, useMemo, useState } from "react";

type PassItem = {
  id: string;
  status: string;
  finalDays: number | null;
  requestedDays: number;
  finalAmount: number | null;
  requestedPrice: number;
  expiresAt: string | null;
  createdAt: string;
  mess: { name: string };
  user: { firstName: string | null; username: string };
};
type MealItem = {
  id: string;
  servedAt: string;
  mess: { name: string };
  mealWindow: { label: string };
  user: { firstName: string | null; username: string };
};
type HistoryData = { items: PassItem[] | MealItem[]; managerView: boolean; total: number; page: number; hasNext: boolean };
type Section = "passes" | "meals";

function indiaDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "00";
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00+05:30`);
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default function HistoryWorkspace() {
  const [section, setSection] = useState<Section>("passes");
  const [date, setDate] = useState(() => indiaDate());
  const [page, setPage] = useState(1);
  const [cache, setCache] = useState<Record<string, HistoryData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const key = `${section}:${date}:${page}`;
  const current = cache[key];

  useEffect(() => setPage(1), [section, date]);

  async function load(targetPage = page, force = false) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: section, date, page: String(targetPage) });
      if (force) params.set("refresh", "true");
      const response = await fetch(`/api/history?${params}`);
      const data = (await response.json()) as HistoryData & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load history.");
      setCache((currentCache) => ({ ...currentCache, [`${section}:${date}:${targetPage}`]: data }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (!cache[key]) void load(); }, [key]); // Cache is intentionally held for this page session.

  async function refresh() {
    setRefreshing(true);
    await load(page, true);
    setRefreshing(false);
  }

  const label = section === "passes" ? "Pass purchases" : "Daily meal payments";
  const items = current?.items || [];
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00+05:30`)), [date]);

  return <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">Payments & meals</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">History</h1><p className="mt-1 text-sm text-slate-600">Latest five records are kept cached for five days.</p></div><button onClick={() => void refresh()} disabled={refreshing} className="min-h-11 rounded-xl bg-slate-100 px-4 text-sm font-bold text-[#234b50] disabled:opacity-60">{refreshing ? "↻ Refreshing" : "↻ Refresh"}</button></div>
    <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button onClick={() => setSection("passes")} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${section === "passes" ? "bg-white text-[#234b50] shadow-sm" : "text-slate-500"}`}>Pass purchases</button><button onClick={() => setSection("meals")} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${section === "meals" ? "bg-white text-[#234b50] shadow-sm" : "text-slate-500"}`}>Daily meals</button></div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="flex gap-2"><button onClick={() => setDate(indiaDate())} className={`rounded-lg px-3 py-2 text-sm font-bold ${date === indiaDate() ? "bg-[#234b50] text-white" : "bg-slate-100 text-slate-600"}`}>Today</button><button onClick={() => setDate(indiaDate(-1))} className={`rounded-lg px-3 py-2 text-sm font-bold ${date === indiaDate(-1) ? "bg-[#234b50] text-white" : "bg-slate-100 text-slate-600"}`}>Yesterday</button></div><label className="text-sm font-semibold text-slate-700">Custom date<input type="date" value={date} max={indiaDate()} onChange={(event) => setDate(event.target.value)} className="field mt-1" /></label></div>
    <div className="mt-5"><p className="text-sm font-bold text-slate-700">{label} · {dateLabel}</p>{loading ? <div className="flex items-center gap-3 py-10 text-sm text-slate-500"><Spinner /> Loading recent records…</div> : error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : items.length ? <div className="mt-3 space-y-2">{section === "passes" ? (items as PassItem[]).map((item) => <PassCard key={item.id} item={item} managerView={current?.managerView || false} />) : (items as MealItem[]).map((item) => <MealCard key={item.id} item={item} managerView={current?.managerView || false} />)}</div> : <p className="mt-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No {label.toLowerCase()} on this date.</p>}{current && !loading && current.total > 0 && <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Showing {(page - 1) * 5 + 1}–{(page - 1) * 5 + items.length} of {current.total}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="min-h-10 rounded-xl bg-slate-100 px-3 font-bold text-[#234b50] disabled:opacity-40">← Previous</button><button disabled={!current.hasNext} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-xl bg-slate-100 px-3 font-bold text-[#234b50] disabled:opacity-40">Next →</button></div></div>}</div>
  </section>;
}

function PassCard({ item, managerView }: { item: PassItem; managerView: boolean }) {
  const expired = item.status === "ACTIVE" && item.expiresAt && new Date(item.expiresAt) < new Date();
  return <article className="rounded-2xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-bold text-slate-900">{item.mess.name}</p><p className="mt-1 text-sm text-slate-500">{managerView && `${item.user.firstName || item.user.username} · `}{item.finalDays || item.requestedDays} days · ₹{item.finalAmount ?? item.requestedPrice}</p></div><Status status={expired ? "EXPIRED" : item.status} /></div><p className="mt-3 text-xs font-semibold text-slate-500">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></article>;
}

function MealCard({ item, managerView }: { item: MealItem; managerView: boolean }) { return <article className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"><div><p className="font-bold text-slate-900">{item.mealWindow.label}</p><p className="mt-1 text-sm text-slate-500">{item.mess.name}{managerView && ` · ${item.user.firstName || item.user.username}`}</p></div><time className="text-right text-xs font-semibold text-slate-500">{new Date(item.servedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</time></article>; }
function Status({ status }: { status: string }) { return <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${status === "PENDING" ? "bg-amber-100 text-amber-800" : status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{status}</span>; }
function Spinner() { return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />; }

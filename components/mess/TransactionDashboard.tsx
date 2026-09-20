"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Transaction = {
  id: string;
  servedAt: string;
  user: { firstName: string | null; lastName: string | null; username: string };
  mealWindow: { label: string };
};
type Data = {
  total: number;
  totals: { id: string; label: string; count: number }[];
  items: Transaction[];
  page: number;
  hasNext: boolean;
};

function transactionName(item: Transaction) {
  return [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.username;
}

export default function TransactionDashboard({ messId }: { messId: string }) {
  const [range, setRange] = useState("day");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<Record<number, Data>>({});
  const [cachedItems, setCachedItems] = useState<Record<string, Transaction>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const data = pages[page] || null;

  const loadPage = useCallback(async (targetPage: number, refresh = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, page: String(targetPage) });
      if (refresh) params.set("refresh", "true");
      const response = await fetch(`/api/messes/${messId}/transactions?${params}`);
      if (!response.ok) throw new Error();
      const next = await response.json() as Data;
      const previousFirst = pages[targetPage]?.items[0];
      if (refresh && previousFirst?.id !== next.items[0]?.id && next.items[0]) {
        setNotice(`${transactionName(next.items[0])} checked in for ${next.items[0].mealWindow.label}`);
      }
      setPages((current) => ({ ...current, [targetPage]: next }));
      setCachedItems((current) => ({
        ...current,
        ...Object.fromEntries(next.items.map((item) => [item.id, item])),
      }));
      setError("");
    } catch {
      setError("Could not load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [messId, pages, range]);

  useEffect(() => {
    if (!pages[page]) void loadPage(page);
  }, [loadPage, page, pages]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.items || [];
    return Object.values(cachedItems)
      .filter((item) => [transactionName(item), item.user.username, item.mealWindow.label].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.servedAt).getTime() - new Date(a.servedAt).getTime())
      .slice(0, 5);
  }, [cachedItems, data?.items, search]);

  const cachedSearchMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return 0;
    return Object.values(cachedItems).filter((item) =>
      [transactionName(item), item.user.username, item.mealWindow.label].some((value) => value.toLowerCase().includes(query)),
    ).length;
  }, [cachedItems, search]);

  async function refresh() {
    setRefreshing(true);
    await loadPage(page, true);
    setRefreshing(false);
  }

  function changeRange(nextRange: string) {
    setRange(nextRange);
    setPage(1);
    setPages({});
    setCachedItems({});
    setSearch("");
    setNotice("");
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#d63a36]">Live meal dashboard</p>
          <h2 className="mt-1 text-xl font-bold">Transactions</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="min-h-10 rounded-xl border border-[#234b50] px-3 text-xs font-bold text-[#234b50] disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {["day", "week", "month"].map((value) => (
              <button
                onClick={() => changeRange(value)}
                key={value}
                className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${range === value ? "bg-white text-[#234b50] shadow-sm" : "text-slate-500"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      {notice && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">● {notice}</div>}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[#234b50] p-4 text-white">
          <p className="text-xs text-emerald-100">Total check-ins</p>
          <p className="mt-1 text-3xl font-bold">{data?.total ?? "—"}</p>
        </div>
        {data?.totals.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <input
          className="field"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search loaded transactions"
          aria-label="Search loaded transactions"
        />
      </div>
      {search && <p className="mt-2 text-xs text-slate-500">Searching {Object.keys(cachedItems).length} cached transaction{Object.keys(cachedItems).length === 1 ? "" : "s"} · {cachedSearchMatches} match{cachedSearchMatches === 1 ? "" : "es"}</p>}
      <div className="mt-4 max-h-[27rem] space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#d63a36]" aria-hidden="true" />
            Loading transactions…
          </div>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
        ) : visibleItems.length ? (
          visibleItems.map((item) => (
            <article key={item.id} className="flex animate-[slide-in_.35s_ease-out] items-center justify-between rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f1f0] font-bold text-[#234b50]">{transactionName(item)[0]}</span>
                <div>
                  <p className="text-sm font-bold">{transactionName(item)}</p>
                  <p className="text-xs text-slate-500">{item.mealWindow.label}</p>
                </div>
              </div>
              <time className="text-xs font-semibold text-slate-500">{new Date(item.servedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</time>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No {search ? "cached matching" : "meal"} check-ins in this period yet.</p>
        )}
      </div>
      {!search && !loading && !error && data && data.total > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Recent 5 · Page {page} of {Math.max(1, Math.ceil(data.total / 5))}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:opacity-45">← Previous</button>
            <button disabled={!data.hasNext} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-xl bg-[#234b50] px-4 text-sm font-bold text-white disabled:opacity-45">Next →</button>
          </div>
        </div>
      )}
    </section>
  );
}

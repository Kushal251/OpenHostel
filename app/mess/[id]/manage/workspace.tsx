"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";

type Offer = {
  id: string;
  title: string;
  days: number;
  price: number;
  active: boolean;
};
type Person = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  enrollmentNo?: string | null;
  roomNumber?: string | null;
  photoUrl?: string | null;
  role?: string;
};
type Request = {
  id: string;
  requestedDays: number;
  requestedPrice: number;
  status: string;
  finalDays?: number;
  finalAmount?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  pauseStartedAt?: string | null;
  pauseEndsAt?: string | null;
  pauseOriginalExpiresAt?: string | null;
  pausePlannedDays?: number | null;
  user: Person;
};
type Mess = {
  id: string;
  name: string;
  hostel: string;
  passOffers: Offer[];
};
type RequestFilter = "ALL" | "PENDING" | "ACTIVE";
const today = new Date().toLocaleDateString("en-CA");

export default function ManageMessPasses({ mess, isAdmin }: { mess: Mess; isAdmin: boolean }) {
  const [offers, setOffers] = useState(mess.passOffers);
  const [staff, setStaff] = useState<Person[]>([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [hasNextStaffPage, setHasNextStaffPage] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState("");
  const [staffAddOpen, setStaffAddOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [debouncedStaffSearch, setDebouncedStaffSearch] = useState("");
  const [staffCandidates, setStaffCandidates] = useState<Person[]>([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [hasNextCandidatePage, setHasNextCandidatePage] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [addingStaffId, setAddingStaffId] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestLoadError, setRequestLoadError] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [debouncedRequestSearch, setDebouncedRequestSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("ALL");
  const [requestPage, setRequestPage] = useState(1);
  const [hasNextRequestPage, setHasNextRequestPage] = useState(false);
  const [requestTotal, setRequestTotal] = useState(0);
  const [requestCounts, setRequestCounts] = useState({ active: 0, pending: 0 });
  const [adding, setAdding] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", days: "30", price: "" });
  const [confirm, setConfirm] = useState({
    days: "",
    amount: "",
    startsAt: today,
  });
  const [pauseDays, setPauseDays] = useState("1");
  const [pauseSaving, setPauseSaving] = useState(false);
  const loadRequestCounts = useCallback(async () => {
    const response = await fetch(`/api/mess-passes/manager?messId=${mess.id}&summary=true`);
    if (response.ok) setRequestCounts(await response.json());
  }, [mess.id]);
  const loadRequests = useCallback(async (
    page: number,
    search: string,
    filter: RequestFilter,
  ) => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams({
        messId: mess.id,
        page: String(page),
        status: filter,
      });
      if (search) params.set("q", search);
      const response = await fetch(`/api/mess-passes/manager?${params}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setRequests(data.items);
      setRequestTotal(data.total);
      setHasNextRequestPage(Boolean(data.hasNext));
      setRequestLoadError("");
    } catch {
      setRequestLoadError("Could not load pass requests. Please try again.");
    } finally {
      setLoadingRequests(false);
    }
  }, [mess.id]);
  const refreshRequestQueue = useCallback(() =>
    Promise.all([
      loadRequestCounts(),
      loadRequests(requestPage, debouncedRequestSearch, requestFilter),
    ]),
  [debouncedRequestSearch, loadRequestCounts, loadRequests, requestFilter, requestPage]);
  useEffect(() => {
    void loadRequestCounts();
  }, [loadRequestCounts]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedRequestSearch(requestSearch.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [requestSearch]);
  useEffect(() => {
    void loadRequests(requestPage, debouncedRequestSearch, requestFilter);
  }, [debouncedRequestSearch, loadRequests, requestFilter, requestPage]);
  const loadStaff = useCallback(async (page: number) => {
    setLoadingStaff(true);
    try {
      const response = await fetch(`/api/messes/${mess.id}/staff?page=${page}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setStaff(data.items);
      setStaffTotal(data.total);
      setHasNextStaffPage(Boolean(data.hasNext));
      setStaffError("");
    } catch {
      setStaffError("Could not load mess staff. Please try again.");
    } finally {
      setLoadingStaff(false);
    }
  }, [mess.id]);
  const loadStaffCandidates = useCallback(async (page: number, search: string) => {
    setLoadingCandidates(true);
    try {
      const params = new URLSearchParams({ scope: "directory", page: String(page) });
      if (search) params.set("q", search);
      const response = await fetch(`/api/messes/${mess.id}/staff?${params}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setStaffCandidates(data.items);
      setCandidateTotal(data.total);
      setHasNextCandidatePage(Boolean(data.hasNext));
      setCandidateError("");
    } catch {
      setCandidateError("Could not load available staff. Please try again.");
    } finally {
      setLoadingCandidates(false);
    }
  }, [mess.id]);
  useEffect(() => {
    void loadStaff(staffPage);
  }, [loadStaff, staffPage]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedStaffSearch(staffSearch.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [staffSearch]);
  useEffect(() => {
    if (staffAddOpen) void loadStaffCandidates(candidatePage, debouncedStaffSearch);
  }, [candidatePage, debouncedStaffSearch, loadStaffCandidates, staffAddOpen]);
  const savingPercent = (offer: Offer) => {
    const highestDaily = Math.max(
      ...offers
        .filter((item) => item.active)
        .map((item) => item.price / item.days),
      0,
    );
    return highestDaily
      ? Math.max(
          0,
          Math.round((1 - offer.price / offer.days / highestDaily) * 100),
        )
      : 0;
  };
  async function addOffer(event: FormEvent) {
    event.preventDefault();
    const r = await fetch("/api/mess-passes/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messId: mess.id,
        title: form.title,
        days: Number(form.days),
        price: Number(form.price),
      }),
    });
    const data = await r.json();
    if (!r.ok) return setError(data.error);
    setOffers([...offers, data]);
    setAdding(false);
    setForm({ title: "", days: "30", price: "" });
  }
  async function removeOffer(id: string) {
    if (
      !window.confirm(
        "Remove this offer? Existing requests will remain in history.",
      )
    )
      return;
    const r = await fetch("/api/mess-passes/offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (r.ok) setOffers(offers.filter((item) => item.id !== id));
  }
  async function addStaff(userId: string) {
    setAddingStaffId(userId);
    try {
      const response = await fetch(`/api/messes/${mess.id}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add this staff member.");
      setStaffCandidates((items) => items.filter((item) => item.id !== userId));
      setCandidateTotal((total) => Math.max(0, total - 1));
      setStaffTotal((total) => total + 1);
      if (staffPage === 1) setStaff((items) => [...items, data.user].slice(0, 5));
    } catch (caught) {
      setStaffError(caught instanceof Error ? caught.message : "Could not add this staff member.");
    } finally {
      setAddingStaffId("");
    }
  }
  async function removeStaff(userId: string) {
    const r = await fetch(`/api/messes/${mess.id}/staff`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (r.ok) {
      setStaff((items) => items.filter((item) => item.id !== userId));
      setStaffTotal((total) => Math.max(0, total - 1));
      setCandidateTotal((total) => staffAddOpen ? total + 1 : total);
    }
  }
  async function approve() {
    if (!request) return;
    const r = await fetch(`/api/mess-passes/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ACTIVE",
        days: Number(confirm.days),
        amount: Number(confirm.amount),
        startsAt: confirm.startsAt,
      }),
    });
    const data = await r.json();
    if (!r.ok) return setError(data.error);
    setRequest(null);
    void refreshRequestQueue();
  }
  async function reject() {
    if (!request) return;
    await fetch(`/api/mess-passes/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    setRequest(null);
    void refreshRequestQueue();
  }
  async function pausePass() {
    if (!request) return;
    setPauseSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/mess-passes/${request.id}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(pauseDays) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not pause the pass.");
      setRequest(null);
      void refreshRequestQueue();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not pause the pass.");
    } finally {
      setPauseSaving(false);
    }
  }
  async function resumePass(action: "COUNT_ELAPSED" | "DISCARD") {
    if (!request) return;
    setPauseSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/mess-passes/${request.id}/pause`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not resume the pass.");
      setRequest(null);
      void refreshRequestQueue();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resume the pass.");
    } finally {
      setPauseSaving(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <Link
        href={`/mess/${mess.id}`}
        className="text-sm font-bold text-[#234b50]"
      >
        ← Back to mess profile
      </Link>
      <header className="mt-3 rounded-[2rem] bg-[#234b50] p-6 text-white sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#f4c86a]">
          Manage · {mess.hostel}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {mess.name} control room
        </h1>
        <p className="mt-2 text-sm text-emerald-50">
          Manage pass offers, staff, and cash payment requests.
        </p>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Pass offers</h2>
            <button
              onClick={() => {
                setError("");
                setAdding(true);
              }}
              className="text-sm font-bold text-[#d63a36]"
            >
              + Add offer
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{offer.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {offer.days} days · ₹{offer.price}
                    </p>
                    {savingPercent(offer) > 0 && (
                      <p className="mt-2 text-xs font-bold text-emerald-700">
                        Save {savingPercent(offer)}% per day
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeOffer(offer.id)}
                    className="h-fit text-sm font-bold text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {offers.length === 0 && (
              <p className="text-sm text-slate-500">
                Add 10, 15, or 30-day plans.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Mess staff</h2>
              <p className="mt-1 text-sm text-slate-500">{staffTotal} assigned member{staffTotal === 1 ? "" : "s"}</p>
            </div>
            <button
              onClick={() => {
                setStaffError("");
                setCandidateError("");
                setStaffAddOpen(true);
                setCandidatePage(1);
                setStaffSearch("");
                setDebouncedStaffSearch("");
              }}
              className="min-h-10 rounded-xl bg-[#d63a36] px-3 text-sm font-bold text-white"
            >
              + Add staff
            </button>
          </div>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1" aria-live="polite">
            {loadingStaff ? (
              <QueueSpinner label="Loading staff…" />
            ) : staffError ? (
              <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{staffError}</p>
            ) : staff.length ? (
              staff.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <span>
                    <b className="block text-sm">{user.firstName || user.username}</b>
                    <small>{user.email}</small>
                  </span>
                  <button
                    onClick={() => removeStaff(user.id)}
                    className="text-sm font-bold text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No staff assigned.</p>
            )}
          </div>
          {!loadingStaff && !staffError && staffTotal > 0 && (
            <Pagination
              page={staffPage}
              total={staffTotal}
              hasNext={hasNextStaffPage}
              onPrevious={() => setStaffPage((page) => Math.max(1, page - 1))}
              onNext={() => setStaffPage((page) => page + 1)}
            />
          )}
        </section>
      </div>
      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#d63a36]">
              Cash confirmation queue
            </p>
            <h2 className="mt-1 text-xl font-bold">Pass requests</h2>
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
              {requestCounts.active} active
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
              {requestCounts.pending} pending
            </span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="field"
            value={requestSearch}
            onChange={(event) => {
              setRequestSearch(event.target.value);
              setRequestPage(1);
            }}
            placeholder="Search name, enrollment no., email or room no."
            aria-label="Search pass requests"
          />
          <select
            className="field sm:w-48"
            value={requestFilter}
            onChange={(event) => {
              setRequestFilter(event.target.value as RequestFilter);
              setRequestPage(1);
            }}
            aria-label="Filter pass requests by status"
          >
            <option value="ALL">All requests</option>
            <option value="PENDING">Pending ({requestCounts.pending})</option>
            <option value="ACTIVE">Active ({requestCounts.active})</option>
          </select>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2" aria-live="polite">
          {loadingRequests ? (
            <div className="col-span-full flex min-h-36 items-center justify-center gap-3 rounded-2xl bg-slate-50 text-sm font-semibold text-slate-600">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#d63a36]" aria-hidden="true" />
              Loading pass requests…
            </div>
          ) : requestLoadError ? (
            <p className="col-span-full rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {requestLoadError}
            </p>
          ) : requests.length ? (
            requests.map((item) => (
              <button
                onClick={() => {
                  setRequest(item);
                  setConfirm({
                    days: String(item.requestedDays),
                    amount: String(item.requestedPrice),
                    startsAt: today,
                  });
                  setPauseDays("1");
                  setError("");
                }}
                key={item.id}
                className="rounded-2xl border p-4 text-left hover:bg-slate-50"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {item.user.firstName || item.user.username}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.user.email}
                    </p>
                    {(item.user.enrollmentNo || item.user.roomNumber) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.user.enrollmentNo || "No enrollment no."}
                        {item.user.roomNumber ? ` · Room ${item.user.roomNumber}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="h-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Requested: {item.requestedDays} days · ₹{item.requestedPrice}
                </p>
                {item.status === "ACTIVE" && item.pauseEndsAt && new Date(item.pauseEndsAt) > new Date() && (
                  <p className="mt-2 text-xs font-bold text-amber-800">
                    Paused until {new Date(item.pauseEndsAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                )}
              </button>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No {requestFilter === "ALL" ? "matching" : requestFilter.toLowerCase()} pass requests found.
            </p>
          )}
        </div>
        {!loadingRequests && !requestLoadError && requestTotal > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Page {requestPage} · {requestTotal} matching request{requestTotal === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                disabled={requestPage === 1}
                onClick={() => setRequestPage((page) => Math.max(1, page - 1))}
                className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                ← Previous
              </button>
              <button
                disabled={!hasNextRequestPage}
                onClick={() => setRequestPage((page) => page + 1)}
                className="min-h-10 rounded-xl bg-[#234b50] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
      <Modal
        open={staffAddOpen}
        title="Add staff member"
        onClose={() => setStaffAddOpen(false)}
      >
        <p className="text-sm text-slate-600">
          Search active hostel users, then add them to this mess team.
        </p>
        <input
          autoFocus
          className="field mt-4"
          value={staffSearch}
          onChange={(event) => {
            setStaffSearch(event.target.value);
            setCandidatePage(1);
          }}
          placeholder="Search name, email, enrollment or room"
          aria-label="Search available staff"
        />
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1" aria-live="polite">
          {loadingCandidates ? (
            <QueueSpinner label="Loading available staff…" />
          ) : candidateError ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{candidateError}</p>
          ) : staffCandidates.length ? (
            staffCandidates.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="min-w-0">
                  <b className="block truncate text-sm">{user.firstName || user.username}</b>
                  <small className="block truncate">{user.email}</small>
                  {(user.enrollmentNo || user.roomNumber) && (
                    <small className="block text-slate-500">
                      {user.enrollmentNo || "No enrollment no."}
                      {user.roomNumber ? ` · Room ${user.roomNumber}` : ""}
                    </small>
                  )}
                </span>
                <button
                  disabled={Boolean(addingStaffId)}
                  onClick={() => void addStaff(user.id)}
                  className="min-h-10 shrink-0 rounded-lg bg-[#234b50] px-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {addingStaffId === user.id ? "Adding…" : "Add"}
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No available users found.</p>
          )}
        </div>
        {!loadingCandidates && !candidateError && candidateTotal > 0 && (
          <Pagination
            page={candidatePage}
            total={candidateTotal}
            hasNext={hasNextCandidatePage}
            onPrevious={() => setCandidatePage((page) => Math.max(1, page - 1))}
            onNext={() => setCandidatePage((page) => page + 1)}
          />
        )}
      </Modal>
      <Modal
        open={adding}
        title="Add pass offer"
        onClose={() => setAdding(false)}
      >
        <form onSubmit={addOffer} className="space-y-3">
          <input
            required
            className="field"
            placeholder="e.g. Monthly saver"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label className="block text-sm font-bold">
            Validity (minimum 10 days)
            <input
              required
              min="10"
              type="number"
              className="field mt-1"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
            />
          </label>
          <label className="block text-sm font-bold">
            Cash amount (₹)
            <input
              required
              min="0"
              type="number"
              className="field mt-1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Create offer</button>
        </form>
      </Modal>
      <Modal
        open={!!request}
        title="Confirm mess pass"
        onClose={() => setRequest(null)}
      >
        {request && (
          <div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold">
                {request.user.firstName || request.user.username}
              </p>
              <p className="text-sm text-slate-600">
                Requested {request.requestedDays} days · ₹
                {request.requestedPrice}
              </p>
            </div>
            {request.status === "PENDING" ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-bold">
                    Start date
                    <input
                      required
                      type="date"
                      className="field mt-1"
                      value={confirm.startsAt}
                      onChange={(e) =>
                        setConfirm({ ...confirm, startsAt: e.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Days
                    <input
                      min="1"
                      type="number"
                      className="field mt-1"
                      value={confirm.days}
                      onChange={(e) =>
                        setConfirm({ ...confirm, days: e.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Amount ₹
                    <input
                      min="0"
                      type="number"
                      className="field mt-1"
                      value={confirm.amount}
                      onChange={(e) =>
                        setConfirm({ ...confirm, amount: e.target.value })
                      }
                    />
                  </label>
                </div>
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  Pass dates: {confirm.startsAt || "Select start"} to{" "}
                  {endDate(confirm.startsAt, Number(confirm.days))}
                </p>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                <button onClick={approve} className="btn-primary mt-5 w-full">
                  Cash received · activate pass
                </button>
                <button
                  onClick={reject}
                  className="mt-3 w-full text-sm font-bold text-red-600"
                >
                  Reject request
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                This request is {request.status.toLowerCase()}.
              </p>
            )}
            {request.status === "ACTIVE" && isAdmin && (
              <PauseControls
                request={request}
                pauseDays={pauseDays}
                setPauseDays={setPauseDays}
                saving={pauseSaving}
                onPause={() => void pausePass()}
                onResume={(action) => void resumePass(action)}
              />
            )}
            {error && request.status !== "PENDING" && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function QueueSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center gap-3 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#d63a36]" aria-hidden="true" />
      {label}
    </div>
  );
}

function Pagination({
  page,
  total,
  hasNext,
  onPrevious,
  onNext,
}: {
  page: number;
  total: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-500">Page {page} · {total} result{total === 1 ? "" : "s"}</p>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={onPrevious} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 disabled:opacity-45">← Previous</button>
        <button disabled={!hasNext} onClick={onNext} className="min-h-9 rounded-lg bg-[#234b50] px-3 text-xs font-bold text-white disabled:opacity-45">Next →</button>
      </div>
    </div>
  );
}

function endDate(value: string, days: number) {
  if (!value || !days) return "—";
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days - 1);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PauseControls({
  request,
  pauseDays,
  setPauseDays,
  saving,
  onPause,
  onResume,
}: {
  request: Request;
  pauseDays: string;
  setPauseDays: (value: string) => void;
  saving: boolean;
  onPause: () => void;
  onResume: (action: "COUNT_ELAPSED" | "DISCARD") => void;
}) {
  const isPaused = Boolean(
    request.pauseEndsAt && new Date(request.pauseEndsAt) > new Date(),
  );
  if (isPaused) {
    return (
      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="font-bold text-amber-950">
          Pass paused until {new Date(request.pauseEndsAt!).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          The expiry already includes the planned {request.pausePlannedDays} pause day{request.pausePlannedDays === 1 ? "" : "s"}. If the student has returned early, choose how much pause time to keep.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button disabled={saving} onClick={() => onResume("COUNT_ELAPSED")} className="min-h-11 rounded-xl bg-amber-700 px-3 text-sm font-bold text-white disabled:opacity-50">
            Resume + count elapsed days
          </button>
          <button disabled={saving} onClick={() => onResume("DISCARD")} className="min-h-11 rounded-xl border border-amber-700 px-3 text-sm font-bold text-amber-900 disabled:opacity-50">
            Resume + discard pause
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-bold text-slate-900">Pause this active pass</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Scanning will be blocked immediately. The pass resumes automatically after the selected period and its expiry is extended by the same number of days.
      </p>
      <div className="mt-3 flex gap-3">
        <label className="flex-1 text-sm font-bold">
          Pause days
          <input required min="1" max="365" type="number" className="field mt-1" value={pauseDays} onChange={(event) => setPauseDays(event.target.value)} />
        </label>
        <button disabled={saving} onClick={onPause} className="mt-6 min-h-11 rounded-xl bg-[#d63a36] px-4 text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Pausing…" : "Pause pass"}
        </button>
      </div>
    </section>
  );
}

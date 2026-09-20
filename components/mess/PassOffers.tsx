"use client";
import { useState } from "react";
import { Modal } from "@/components/Modal";

type Offer = {
  id: string;
  title: string;
  days: number;
  price: number;
  active: boolean;
};
type ActivePass = {
  finalDays: number | null;
  finalAmount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  pauseEndsAt: string | null;
};
export default function PassOffers({
  messId,
  offers,
  pass,
}: {
  messId: string;
  offers: Offer[];
  pass?: ActivePass | null;
}) {
  const [selected, setSelected] = useState<Offer | null>(null);
  const [chooseUpgrade, setChooseUpgrade] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const active = offers.filter((offer) => offer.active);
  const upgrade = Boolean(pass);
  const isPaused = Boolean(pass?.pauseEndsAt && new Date(pass.pauseEndsAt) > new Date());
  async function request() {
    if (!selected) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/mess-passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messId, offerId: selected.id }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error);
    setSelected(null);
    setChooseUpgrade(false);
    setSent(true);
  }
  return (
    <section
      id="passes"
      className="scroll-mt-24 rounded-3xl bg-[#fffaf0] p-5 ring-1 ring-[#f4c86a]/60 sm:p-7"
    >
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">
        Mess passes
      </p>
      {pass && !chooseUpgrade ? (
        <div className="mt-3 rounded-3xl bg-[#234b50] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPaused ? "bg-amber-300 text-amber-950" : "bg-emerald-400 text-emerald-950"}`}>
                {isPaused ? "⏸ PASS PAUSED" : "● ACTIVE PASS"}
              </span>
              <h2 className="mt-4 text-2xl font-bold">
                {isPaused ? "Your mess pass is paused" : "Your mess pass is active"}
              </h2>
              <p className="mt-2 text-sm text-emerald-50">
                Valid from {date(pass.startsAt)} to {date(pass.expiresAt)}
              </p>
              <p className="mt-1 text-sm text-emerald-50">
                {pass.finalDays} days · ₹{pass.finalAmount}
              </p>
              {isPaused && (
                <p className="mt-3 rounded-xl bg-amber-100/15 px-3 py-2 text-sm font-semibold text-amber-100">
                  Scanning is unavailable until {dateTime(pass.pauseEndsAt)}.
                </p>
              )}
            </div>
            <button
              onClick={() => setChooseUpgrade(true)}
              className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-[#234b50]"
            >
              Upgrade pass →
            </button>
          </div>
          <p className="mt-5 border-t border-white/15 pt-4 text-sm leading-6 text-emerald-50">
            Upgrade is available before expiry. Once payment is confirmed, the
            new days will be added after your current validity—no days are lost.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {upgrade ? "Upgrade your mess pass" : "Choose your meal plan"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {upgrade
                  ? "Choose an offer; its days will be added to your current pass after confirmation."
                  : "Request a pass, pay the manager in person, then get your active pass."}
              </p>
            </div>
            {upgrade && (
              <button
                onClick={() => setChooseUpgrade(false)}
                className="text-sm font-bold text-[#d63a36]"
              >
                ← View current pass
              </button>
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {active.length ? (
              active.map((offer, index) => (
                <button
                  key={offer.id}
                  onClick={() => setSelected(offer)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${index === 1 ? "border-[#d63a36] bg-white shadow-md" : "border-amber-200 bg-white"}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#d63a36]">
                    {index === 1
                      ? "Best value"
                      : upgrade
                        ? "Pass upgrade"
                        : "Mess pass"}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {offer.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    +{offer.days} days validity
                  </p>
                  <p className="mt-4 text-2xl font-bold text-[#234b50]">
                    ₹{offer.price}
                  </p>
                  <span className="mt-4 inline-block text-sm font-bold text-[#d63a36]">
                    Select plan →
                  </span>
                </button>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-amber-300 bg-white p-5 text-sm text-slate-600">
                Pass offers will be added by the mess manager soon.
              </p>
            )}
          </div>
        </>
      )}
      <Modal
        open={!!selected}
        title={upgrade ? "Confirm pass upgrade" : "Confirm your pass request"}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-900">{selected.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                +{selected.days} days · ₹{selected.price}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {upgrade
                ? "Your manager will confirm cash payment. Once accepted, these days will be added after your current pass expiry."
                : "Your request will go to the mess manager/caretaker. Pay them in person only after they approve your pass."}
            </p>
            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            )}
            <button
              disabled={saving}
              onClick={request}
              className="btn-primary mt-5 w-full"
            >
              {saving
                ? "Sending…"
                : upgrade
                  ? "Confirm upgrade request"
                  : "Confirm request"}
            </button>
          </div>
        )}
      </Modal>
      <Modal
        open={sent}
        title={upgrade ? "Upgrade request sent" : "Pass request sent"}
        onClose={() => setSent(false)}
      >
        <div className="text-center">
          <span className="text-5xl">✓</span>
          <p className="mt-4 text-lg font-bold text-slate-900">
            Your {upgrade ? "upgrade" : "mess pass"} request was sent.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Please contact the caretaker or mess manager. Make payment only when
            they confirm the request.
          </p>
          <button
            onClick={() => setSent(false)}
            className="btn-primary mt-5 w-full"
          >
            Got it
          </button>
        </div>
      </Modal>
    </section>
  );
}
function date(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}
function dateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
}

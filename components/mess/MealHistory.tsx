"use client";
import { useEffect, useState } from "react";
type Item = {
  id: string;
  servedAt: string;
  mess: { name: string };
  mealWindow: { label: string };
};
export default function MealHistory() {
  const [range, setRange] = useState("day"),
    [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch(`/api/meal-transactions/history?range=${range}`).then(
      async (r) => r.ok && setItems(await r.json()),
    );
  }, [range]);
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d63a36]">
            Meal check-ins
          </p>
          <h2 className="mt-1 text-2xl font-bold">Your meal history</h2>
        </div>
        <div className="flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
          {["day", "yesterday", "week", "month"].map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${range === value ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className="flex animate-[slide-in_.35s_ease-out] items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {item.mealWindow.label}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.mess.name}</p>
              </div>
              <time className="text-right text-xs font-semibold text-slate-500">
                {new Date(item.servedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
                <br />
                {new Date(item.servedAt).toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            No meal transactions for this period.
          </p>
        )}
      </div>
    </section>
  );
}

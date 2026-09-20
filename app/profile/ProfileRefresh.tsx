"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRefresh() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/profile?refresh=true", { cache: "no-store" });
      if (response.ok) router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      disabled={refreshing}
      className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#234b50] shadow-sm ring-1 ring-slate-200 disabled:opacity-60"
    >
      {refreshing ? "↻ Refreshing" : "↻ Refresh"}
    </button>
  );
}

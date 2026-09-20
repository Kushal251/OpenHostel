"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MealScanner from "./MealScanner";
export default function HomeScanner() {
  const path = usePathname();
  const [mess, setMess] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    if (path !== "/home") return;
    fetch("/api/meal-transactions/active-mess").then(
      async (r) => r.ok && setMess((await r.json()).mess),
    );
  }, [path]);
  return path === "/home" && mess ? (
    <MealScanner messId={mess.id} messName={mess.name} />
  ) : null;
}

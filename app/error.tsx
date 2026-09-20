"use client";

import ConnectionErrorScreen from "@/components/ConnectionErrorScreen";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ConnectionErrorScreen retry={reset} />;
}

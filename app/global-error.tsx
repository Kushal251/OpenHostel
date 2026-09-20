"use client";

import "./globals.css";
import ConnectionErrorScreen from "@/components/ConnectionErrorScreen";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body><ConnectionErrorScreen retry={reset} /></body>
    </html>
  );
}

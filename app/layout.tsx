import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenHostel | CSA",
  description: "Hostel operations, admissions and access management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

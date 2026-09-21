import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "./LogoutButton";
import HomeScanner from "./mess/HomeScanner";
import MobileNavigation from "./MobileNavigation";

export default async function AppNavbar() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  const name = session.user.name || "User";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navigationLinks = [
    { href: "/home", label: "Home", icon: "⌂" },
    { href: "/history", label: "History", icon: "◷" },
    { href: "/profile", label: "My profile", icon: "◉" },
    ...(role === "ADMIN"
      ? [{ href: "/admin", label: "Manage people", icon: "♙" }]
      : []),
    ...(["ADMIN", "MESS_MANAGER"].includes(role)
      ? [{ href: "/mess", label: "Mess workspace", icon: "⌑" }]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-8"
          aria-label="Main navigation"
        >
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <MobileNavigation links={navigationLinks} name={name} role={role} initials={initials} />
            <Link
              href="/home"
              className="truncate text-lg font-bold text-[#234b50] sm:text-xl"
            >
              OpenHostel
            </Link>
            <Link
              href="/home"
              className="hidden text-sm font-semibold text-slate-600 hover:text-[#d63a36] sm:block"
            >
              Home
            </Link>
            <Link
              href="/history"
              className="hidden text-sm font-semibold text-slate-600 hover:text-[#d63a36] sm:block"
            >
              History
            </Link>
            {role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden text-sm font-semibold text-slate-600 hover:text-[#d63a36] sm:block"
              >
                Manage people
              </Link>
            )}
            {["ADMIN", "MESS_MANAGER"].includes(role) && (
              <Link
                href="/mess"
                className="hidden text-sm font-semibold text-slate-600 hover:text-[#d63a36] sm:block"
              >
                Mess
              </Link>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden sm:block"><LogoutButton /></div>
            <Link
              href="/profile"
              className="flex min-h-11 items-center gap-3 rounded-full py-1 pl-1 pr-1 transition hover:bg-slate-100 sm:pl-2"
              aria-label="Open your profile"
            >
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-bold text-slate-800">
                  {name}
                </span>
                <span className="block text-[11px] font-semibold text-slate-500">
                  {role.replaceAll("_", " ")}
                </span>
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#234b50] text-sm font-bold text-white ring-2 ring-[#e8f1f0]">
                {initials}
              </span>
            </Link>
          </div>
        </nav>
      </header>
      <HomeScanner />
    </>
  );
}

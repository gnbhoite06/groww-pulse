"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/reviews", label: "Reviews" },
  { href: "/pulse", label: "Weekly Note" },
  { href: "/email", label: "Send Email" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-card-line bg-bg-raised px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center gap-2 px-2">
        <div className="h-7 w-7 rounded-lg bg-brand-strong flex items-center justify-center text-white font-bold text-sm">
          G
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">Groww Pulse</div>
          <div className="text-[10px] text-sub leading-tight">Review digest</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-sub hover:bg-brand-soft/50 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}

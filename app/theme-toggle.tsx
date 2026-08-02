"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("groww-pulse-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-full border border-card-line bg-card px-3 py-1.5 text-xs font-medium text-sub hover:text-ink transition-colors cursor-pointer"
      aria-label="Toggle dark mode"
    >
      <span className={`h-2 w-2 rounded-full ${dark ? "bg-sub" : "bg-brand-strong"}`} />
      {dark ? "Dark" : "Light"}
    </button>
  );
}

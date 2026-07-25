"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle() {
  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("html-exam-theme", next);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label="تغییر حالت روشن یا تاریک"
      title="تغییر حالت رنگ"
    >
      <span className="theme-toggle__icon theme-toggle__moon">
        <MoonIcon />
      </span>
      <span className="theme-toggle__icon theme-toggle__sun">
        <SunIcon />
      </span>
    </button>
  );
}

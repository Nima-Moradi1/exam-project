"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label="تغییر حالت رنگ"
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

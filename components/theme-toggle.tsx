"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={mounted && resolvedTheme === "dark" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک"}
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

"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import type { MouseEvent } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const button = event.currentTarget.getBoundingClientRect();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.style.setProperty("--theme-transition-x", `${button.left + button.width / 2}px`);
    root.style.setProperty("--theme-transition-y", `${button.top + button.height / 2}px`);

    const applyTheme = () => {
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      setTheme(nextTheme);
    };

    root.classList.add("theme-is-changing");
    if (!reduceMotion && "startViewTransition" in document) {
      const viewTransition = (document as Document & { startViewTransition: (update: () => void) => { finished: Promise<void> } }).startViewTransition(applyTheme);
      void viewTransition.finished.finally(() => root.classList.remove("theme-is-changing"));
    } else {
      applyTheme();
      window.setTimeout(() => root.classList.remove("theme-is-changing"), 720);
    }
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

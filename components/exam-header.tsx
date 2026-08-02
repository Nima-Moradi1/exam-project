"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { HeaderAccountAction } from "@/components/header-account-action";
import { CodeIcon } from "@/components/icons";
import { SiteNavigation } from "@/components/site-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const subscribeToScroll = (onStoreChange: () => void) => {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
};

const isNavigationCondensed = () => window.scrollY > 48;
const serverNavigationState = () => false;

export function ExamHeader() {
  const isCondensed = useSyncExternalStore(subscribeToScroll, isNavigationCondensed, serverNavigationState);

  return (
    <header className={`site-header${isCondensed ? " site-header--condensed" : ""}`}>
      <div className="page-shell site-header__inner">
        <Link className="brand" href="/" aria-label="آزمون‌خانه؛ صفحهٔ اصلی">
          <span className="brand__mark">
            <CodeIcon />
          </span>
          <span>
            <strong>آزمون‌خانه</strong>
            <small>سنجش هدفمند مهارت‌های وب</small>
          </span>
        </Link>
        <SiteNavigation />
        <div className="site-header__actions">
          <HeaderAccountAction />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

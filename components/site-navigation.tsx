"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { NavigationLink } from "@/components/navigation-link";
import { ThemeToggle } from "@/components/theme-toggle";

const publicNavigationItems = [
  { href: "/", label: "خانه" },
  { href: "/#paths", label: "مسیرهای یادگیری" },
  { href: "/#exams", label: "آزمون‌ها" },
  { href: "/exam-request", label: "درخواست آزمون" }
] as const;

export function SiteNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const canManage = ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "");
  const navigationItems = status === "authenticated"
    ? [...publicNavigationItems, { href: "/profile/exams", label: "نتایج من" }, ...(canManage ? [{ href: "/admin", label: "مدیریت" }] : [])]
    : publicNavigationItems;

  return (
    <div className="site-navigation">
      <button className="site-menu-button" type="button" aria-expanded={isOpen} aria-controls="primary-navigation" onClick={() => setIsOpen((value) => !value)}>
        <span className="sr-only">{isOpen ? "بستن منو" : "باز کردن منو"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={isOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
      </button>
      <nav className={`site-nav${isOpen ? " is-open" : ""}`} id="primary-navigation" aria-label="ناوبری اصلی">
        {navigationItems.map((item) => <NavigationLink key={item.href} href={item.href} onNavigate={() => setIsOpen(false)}>{item.label}</NavigationLink>)}
        <div className="site-nav__mobile-actions"><span>حالت نمایش</span><ThemeToggle /></div>
      </nav>
    </div>
  );
}

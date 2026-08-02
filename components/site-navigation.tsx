"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { HeaderAccountAction } from "@/components/header-account-action";
import { NavigationLink } from "@/components/navigation-link";
import { ThemeToggle } from "@/components/theme-toggle";

const publicNavigationItems = [
  { href: "/", label: "خانه", match: "/" },
  { href: "/#paths", label: "مسیرهای یادگیری", match: "" },
  { href: "/#exams", label: "فهرست آزمون‌ها", match: "/exams" },
  { href: "/exam-request", label: "درخواست آزمون", match: "/exam-request" }
] as const;

export function SiteNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { data: session, status } = useSession();
  const canManage = ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "");
  const navigationItems = status === "authenticated" ? [...publicNavigationItems, { href: "/profile/exams", label: "نتایج من", match: "/profile/exams" }, ...(canManage ? [{ href: "/admin", label: "مدیریت", match: "/admin" }] : [])] : publicNavigationItems;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setIsOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", close); };
  }, [isOpen]);

  function closeAndRestore() { setIsOpen(false); triggerRef.current?.focus(); }

  return <div className="site-navigation">
    <button ref={triggerRef} className="site-menu-button" type="button" aria-expanded={isOpen} aria-controls="primary-navigation" onClick={() => setIsOpen((value) => !value)}><span className="sr-only">{isOpen ? "بستن منو" : "باز کردن منو"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={isOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg></button>
    {isOpen && <button type="button" className="site-nav-backdrop" aria-label="بستن منو" onClick={closeAndRestore} />}
    <nav ref={panelRef} className={`site-nav${isOpen ? " is-open" : ""}`} id="primary-navigation" aria-label="ناوبری اصلی">
      {navigationItems.map((item) => { const active = item.match === "/" ? pathname === "/" && item.href === "/" : Boolean(item.match && (pathname === item.match || pathname.startsWith(`${item.match}/`))); return <NavigationLink key={item.href} href={item.href} aria-current={active ? "page" : undefined} onNavigate={() => setIsOpen(false)}>{item.label}</NavigationLink>; })}
      <div className="site-nav__mobile-account"><HeaderAccountAction /></div>
      <div className="site-nav__mobile-actions"><span>حالت نمایش</span><ThemeToggle /></div>
    </nav>
  </div>;
}

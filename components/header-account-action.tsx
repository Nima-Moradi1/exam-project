"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { NavigationLink } from "@/components/navigation-link";

export function HeaderAccountAction() {
  const { status } = useSession();
  const pathname = usePathname();
  const isAuthenticationPage = pathname === "/login" || pathname === "/signup";

  if (status !== "authenticated" && isAuthenticationPage) return null;

  return <NavigationLink className="primary-button site-header__account" href={status === "authenticated" ? "/profile" : "/login"}>{status === "authenticated" ? "حساب کاربری" : "ورود یا ثبت‌نام"}</NavigationLink>;
}

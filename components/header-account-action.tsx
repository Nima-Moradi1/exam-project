"use client";

import { useSession } from "next-auth/react";

import { NavigationLink } from "@/components/navigation-link";

export function HeaderAccountAction() {
  const { status } = useSession();
  return <NavigationLink className="primary-button site-header__account" href={status === "authenticated" ? "/profile" : "/login"}>{status === "authenticated" ? "حساب کاربری" : "ورود یا ثبت‌نام"}</NavigationLink>;
}

"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@heroui/react";

export function HeroProvider({ children }: { children: ReactNode }) {
  return <I18nProvider locale="fa-IR">{children}</I18nProvider>;
}

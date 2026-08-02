"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}

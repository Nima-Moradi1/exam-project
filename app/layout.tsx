import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ExamHeader } from "@/components/exam-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "آزمون جامع HTML | سنجش دانش وب",
  description: "آزمون فارسی و تعاملی HTML با ارزیابی امن سمت سرور",
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111613" }
  ]
};

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("html-exam-theme");
    const dark = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ExamHeader />
        {children}
        <footer className="site-footer">
          <div className="page-shell">
            <p>طراحی‌شده برای یادگیری عمیق‌تر HTML</p>
            <span>پاسخ‌ها تنها هنگام ثبت نهایی ارزیابی می‌شوند.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

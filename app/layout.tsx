import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import type { ReactNode } from "react";

import { ExamHeader } from "@/components/exam-header";
import { GithubIcon, LinkedinIcon, MailIcon, PhoneIcon, TelegramIcon } from "@/components/icons";
import { ThemeProvider } from "@/components/theme-provider";
import { HeroProvider } from "@/components/ui/heroui-provider";
import { WebVitals } from "@/components/web-vitals";
import { getAppOrigin } from "@/lib/config/app-url";
import { publicRobots } from "@/lib/seo/metadata";

import "./globals.css";
import "./audit.css";

const yekan = localFont({
  src: [
    { path: "../public/fonts/iranyekanx/IRANYekanX-Regular.woff2", weight: "400" },
    { path: "../public/fonts/iranyekanx/IRANYekanX-Medium.woff2", weight: "500" },
    { path: "../public/fonts/iranyekanx/IRANYekanX-Bold.woff2", weight: "700" }
  ],
  display: "optional",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  variable: "--font-yekan"
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppOrigin()),
  title: { default: "آزمون‌خانه | سنجش و پیشرفت هدفمند", template: "%s | آزمون‌خانه" },
  description: "پلتفرم آنلاین آزمون، ارزیابی مهارت و مسیرهای یادگیری برای موضوعات گوناگون؛ با زمان‌سنج امن، بازخورد و نتایج شخصی‌سازی‌شده.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
  robots: publicRobots()
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={yekan.variable}>
        <ThemeProvider>
          <HeroProvider>
            <WebVitals />
            <a className="skip-link" href="#main-content">پرش به محتوای اصلی</a>
            <ExamHeader />
            {children}
            <footer className="site-footer">
              <div className="page-shell site-footer__inner">
                <div className="footer-identity">
                  <strong translate="no">آزمون‌خانه</strong>
                  <span>سنجش امن، بازخورد روشن و پیشرفت قابل‌اندازه‌گیری</span>
                </div>
                <nav className="footer-policy-links" aria-label="اطلاعات و پشتیبانی">
                  <Link href="/terms">شرایط استفاده</Link>
                  <Link href="/privacy">حریم خصوصی</Link>
                  <Link href="/accessibility">دسترس‌پذیری</Link>
                  <Link href="/help">راهنما</Link>
                  <Link href="/support">پشتیبانی</Link>
                </nav>
                <div className="footer-socials" aria-label="راه‌های ارتباطی آزمون‌خانه">
                  <a href="https://github.com/Nima-Moradi1" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><GithubIcon /></a>
                  <a href="https://www.linkedin.com/in/nima-moradi-rad-1380s" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn"><LinkedinIcon /></a>
                  <a href="https://t.me/Nimamoradirad" target="_blank" rel="noreferrer" aria-label="Telegram" title="Telegram"><TelegramIcon /></a>
                  <a href="mailto:nimamoradirad@gmail.com" aria-label="ایمیل" title="nimamoradirad@gmail.com"><MailIcon /></a>
                  <a href="/support" aria-label="پشتیبانی" title="پشتیبانی"><PhoneIcon /></a>
                </div>
                <span className="footer-note">پاسخ‌ها تنها هنگام ثبت نهایی ارزیابی می‌شوند.</span>
              </div>
            </footer>
          </HeroProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

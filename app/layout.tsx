import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ExamHeader } from "@/components/exam-header";
import { GithubIcon, LinkedinIcon, MailIcon, PhoneIcon, TelegramIcon } from "@/components/icons";
import { ThemeProvider } from "@/components/theme-provider";
import { HeroProvider } from "@/components/ui/heroui-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "آزمون‌خانه | پلتفرم آزمون و ارزیابی آنلاین",
  description: "پلتفرم آنلاین آزمون، ارزیابی مهارت و مسیرهای یادگیری برای موضوعات گوناگون؛ با زمان‌سنج امن، بازخورد و نتایج شخصی‌سازی‌شده.",
  other: { google: "notranslate" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" translate="no" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <HeroProvider>
            <a className="skip-link" href="#main-content">پرش به محتوای اصلی</a>
            <ExamHeader />
            {children}
            <footer className="site-footer">
              <div className="page-shell site-footer__inner">
                <div className="footer-identity">
                  <strong>نیما مرادی راد</strong>
                  <span>طراحی و توسعهٔ آزمون‌خانه</span>
                </div>
                <div className="footer-socials" aria-label="راه‌های ارتباطی نیما مرادی راد">
                  <a href="https://github.com/Nima-Moradi1" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><GithubIcon /></a>
                  <a href="https://www.linkedin.com/in/nima-moradi-rad-1380s" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn"><LinkedinIcon /></a>
                  <a href="https://t.me/Nimamoradirad" target="_blank" rel="noreferrer" aria-label="Telegram" title="Telegram"><TelegramIcon /></a>
                  <a href="mailto:nimamoradirad@gmail.com" aria-label="ایمیل" title="nimamoradirad@gmail.com"><MailIcon /></a>
                  <a href="tel:+989036837788" aria-label="تماس" title="۰۹۰۳۶۸۳۷۷۸۸"><PhoneIcon /></a>
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

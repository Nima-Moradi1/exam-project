import Link from "next/link";

import { CodeIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export function ExamHeader() {
  return (
    <header className="site-header">
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
        <nav className="site-nav" aria-label="ناوبری اصلی">
          <Link href="/">خانه</Link>
          <Link href="/#exams">آزمون‌ها</Link>
          <Link href="/html">HTML</Link>
          <Link href="/css">CSS</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

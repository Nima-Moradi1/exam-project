import Link from "next/link";

import { CodeIcon } from "@/components/icons";
import { NavigationLink } from "@/components/navigation-link";
import { SiteNavigation } from "@/components/site-navigation";
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
        <SiteNavigation />
        <div className="site-header__actions">
          <NavigationLink className="secondary-button site-header__login" href="/login">ورود</NavigationLink>
          <NavigationLink className="primary-button site-header__signup" href="/signup">ثبت‌نام</NavigationLink>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

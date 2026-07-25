import Link from "next/link";

import { CodeIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

export function ExamHeader() {
  return (
    <header className="site-header">
      <div className="page-shell site-header__inner">
        <Link className="brand" href="/" aria-label="آزمون HTML؛ صفحهٔ اصلی">
          <span className="brand__mark">
            <CodeIcon />
          </span>
          <span>
            <strong>آزمون HTML</strong>
            <small>سنجش دانش، قدم‌به‌قدم</small>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

import Link from "next/link";

import { HeaderAccountAction } from "@/components/header-account-action";
import { CodeIcon } from "@/components/icons";
import { SiteNavigation } from "@/components/site-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function ExamHeader() {
  return <header className="site-header"><div className="page-shell site-header__inner"><Link className="brand" href="/" aria-label="آزمون‌خانه؛ صفحهٔ اصلی"><span className="brand__mark"><CodeIcon /></span><span><strong translate="no">آزمون‌خانه</strong><small>سنجش و پیشرفت هدفمند</small></span></Link><SiteNavigation /><div className="site-header__actions"><HeaderAccountAction /><ThemeToggle /></div></div></header>;
}

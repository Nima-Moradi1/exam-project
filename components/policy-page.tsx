import Link from "next/link";
import type { ReactNode } from "react";

export function PolicyPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main id="main-content" className="policy-page page-shell"><header><span className="eyebrow"><i /> {eyebrow}</span><h1>{title}</h1><p>{intro}</p></header><article>{children}</article><nav aria-label="صفحه‌های راهنما"><Link href="/terms">شرایط استفاده</Link><Link href="/privacy">حریم خصوصی</Link><Link href="/accessibility">دسترس‌پذیری</Link><Link href="/help">راهنما</Link><Link href="/support">پشتیبانی</Link></nav></main>;
}

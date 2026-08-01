import Link from "next/link";
import type { ReactNode } from "react";

import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePermission("category:read");
  return <main id="main-content" className="admin-page page-shell"><aside className="admin-sidebar"><strong>مدیریت آزمون‌خانه</strong><nav aria-label="مدیریت"><Link href="/admin">داشبورد</Link><Link href="/admin/categories">دسته‌بندی‌ها</Link><Link href="/admin/exams">آزمون‌ها</Link><Link href="/admin/resources">منابع</Link><Link href="/admin/media">رسانه</Link><Link href="/admin/users">کاربران</Link><Link href="/admin/attempts">تلاش‌ها</Link><Link href="/admin/audit-logs">گزارش رویداد</Link></nav></aside><section className="admin-content">{children}</section></main>;
}

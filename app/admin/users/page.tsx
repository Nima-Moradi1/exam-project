import { asc, count } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("user:read");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(users))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const records = await db.select({ id: users.id, username: users.username, email: users.email, role: users.role, status: users.status, lastLoginAt: users.lastLoginAt }).from(users).orderBy(asc(users.usernameNormalized)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="users-title"><span className="eyebrow"><i /> مدیریت</span><h1 id="users-title">کاربران</h1><p className="admin-page-intro">حساب‌ها، سطح دسترسی و وضعیت فعالیت اعضای آزمون‌خانه.</p><AdminDataGrid columns={["کاربر", "نقش", "وضعیت", "آخرین ورود"]} itemName="کاربران" page={page} total={total} emptyMessage="کاربری برای نمایش وجود ندارد.">{records.map((user) => <tr key={user.id}><td><strong>{user.username ?? "تکمیل‌نشده"}</strong><small dir="ltr">{user.email}</small></td><td><AdminBadge tone={user.role === "USER" ? "neutral" : "info"}>{user.role}</AdminBadge></td><td><AdminBadge tone={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "warning" : "danger"}>{user.status}</AdminBadge></td><td>{user.lastLoginAt ? user.lastLoginAt.toLocaleDateString("fa-IR") : "—"}</td></tr>)}</AdminDataGrid></section>;
}

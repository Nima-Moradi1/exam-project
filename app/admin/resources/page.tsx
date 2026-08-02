import { asc, count } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { learningResources } from "@/lib/db/schema";

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("resource:manage");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(learningResources))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const resources = await db.select({ id: learningResources.id, title: learningResources.title, type: learningResources.type, url: learningResources.url, locale: learningResources.locale, isActive: learningResources.isActive }).from(learningResources).orderBy(asc(learningResources.title)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="resources-title"><span className="eyebrow"><i /> یادگیری</span><h1 id="resources-title">منابع آموزشی</h1><p className="admin-page-intro">فهرست منابع منتشرشده برای پیشنهادهای آموزشی و مسیرهای یادگیری.</p><AdminDataGrid columns={["منبع", "نوع", "زبان", "پیوند", "وضعیت"]} itemName="منابع آموزشی" page={page} total={total} emptyMessage="منبع آموزشی ثبت نشده است.">{resources.map((resource) => <tr key={resource.id}><td><strong>{resource.title}</strong></td><td>{resource.type}</td><td>{resource.locale}</td><td><a className="admin-table-link admin-table-link--url" href={resource.url} target="_blank" rel="noreferrer">باز کردن پیوند</a></td><td><AdminBadge tone={resource.isActive ? "success" : "neutral"}>{resource.isActive ? "فعال" : "غیرفعال"}</AdminBadge></td></tr>)}</AdminDataGrid></section>;
}

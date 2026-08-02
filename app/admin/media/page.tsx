import { count, desc } from "drizzle-orm";

import { AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("media:manage");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(mediaAssets))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const assets = await db.select({ id: mediaAssets.id, kind: mediaAssets.kind, url: mediaAssets.url, altText: mediaAssets.altText, createdAt: mediaAssets.createdAt }).from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="media-title"><span className="eyebrow"><i /> رسانه</span><h1 id="media-title">دارایی‌های رسانه</h1><p className="admin-page-intro">آپلود فقط از endpoint مجاز و با token سروری Blob انجام می‌شود.</p><AdminDataGrid columns={["نوع", "توضیح", "پیوند", "تاریخ"]} itemName="دارایی‌های رسانه" page={page} total={total} emptyMessage="دارایی رسانه‌ای ثبت نشده است.">{assets.map((asset) => <tr key={asset.id}><td><strong>{asset.kind}</strong></td><td>{asset.altText || "—"}</td><td><a className="admin-table-link admin-table-link--url" href={asset.url} target="_blank" rel="noreferrer">نمایش فایل</a></td><td>{asset.createdAt.toLocaleDateString("fa-IR")}</td></tr>)}</AdminDataGrid></section>;
}

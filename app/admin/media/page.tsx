import { desc } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";

export default async function AdminMediaPage() {
  await requirePermission("media:manage");
  const assets = await getDb().select({ id: mediaAssets.id, kind: mediaAssets.kind, url: mediaAssets.url, altText: mediaAssets.altText, createdAt: mediaAssets.createdAt }).from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(100);
  return <section aria-labelledby="media-title"><span className="eyebrow"><i /> رسانه</span><h1 id="media-title">دارایی‌های رسانه</h1><p>آپلود فقط از endpoint مجاز و با token سروری Blob انجام می‌شود.</p><div className="admin-tree">{assets.map((asset) => <div className="admin-tree__row" key={asset.id}><span><strong>{asset.kind}</strong><small dir="ltr">{asset.url}</small></span><span>{asset.altText}</span><span>{asset.createdAt.toLocaleDateString("fa-IR")}</span></div>)}</div></section>;
}

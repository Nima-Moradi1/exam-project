import { asc } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { learningResources } from "@/lib/db/schema";

export default async function AdminResourcesPage() {
  await requirePermission("resource:manage");
  const resources = await getDb().select({ id: learningResources.id, title: learningResources.title, type: learningResources.type, url: learningResources.url, isActive: learningResources.isActive }).from(learningResources).orderBy(asc(learningResources.title)).limit(100);
  return <section aria-labelledby="resources-title"><span className="eyebrow"><i /> یادگیری</span><h1 id="resources-title">منابع آموزشی</h1><div className="admin-tree">{resources.map((resource) => <div className="admin-tree__row" key={resource.id}><span><strong>{resource.title}</strong><small dir="ltr">{resource.url}</small></span><span>{resource.type}</span><span>{resource.isActive ? "فعال" : "غیرفعال"}</span></div>)}</div></section>;
}

import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config/app-url";
import { getPublishedCategorySitemapRows, getPublishedExamSitemapRows } from "@/lib/exams/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = { url: appUrl("/"), changeFrequency: "daily" as const, priority: 1 };
  if (!process.env.DATABASE_URL) return [home];
  const [examRows, categoryRows] = await Promise.all([getPublishedExamSitemapRows(), getPublishedCategorySitemapRows()]);
  return [
    home,
    ...categoryRows.map((item) => ({ url: appUrl(`/categories/${item.slug}`), lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...examRows.map((item) => ({ url: appUrl(`/exams/${item.slug}`), lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 }))
  ];
}

import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config/app-url";
import { isProductionIndexingEnabled } from "@/lib/config/app-url";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [{ userAgent: "*", allow: ["/", "/categories/", "/exams/"], disallow: ["/admin/", "/api/", "/attempts/", "/profile/", "/login", "/signup"] }],
    sitemap: appUrl("/sitemap.xml"),
    host: appUrl("/")
  };
}

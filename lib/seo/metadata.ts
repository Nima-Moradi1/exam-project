import type { Metadata } from "next";

import { appUrl, isProductionIndexingEnabled } from "@/lib/config/app-url";

export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true
};

export function publicRobots(): Metadata["robots"] {
  return isProductionIndexingEnabled()
    ? { index: true, follow: true }
    : privateRobots;
}

export function publicMetadata(input: {
  title: string;
  description: string;
  pathname: string;
  locale?: string;
  imagePath?: string;
}): Metadata {
  const canonical = appUrl(input.pathname);
  const image = appUrl(input.imagePath ?? "/opengraph-image");
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: publicRobots(),
    openGraph: {
      type: "website",
      title: input.title,
      description: input.description,
      url: canonical,
      locale: input.locale ?? "fa_IR",
      siteName: "آزمون‌خانه",
      images: [{ url: image, width: 1200, height: 630, alt: input.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

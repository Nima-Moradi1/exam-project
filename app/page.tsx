import { ExamHub } from "@/components/exam-hub";
import { appUrl } from "@/lib/config/app-url";
import { parseDiscoveryParams } from "@/lib/exams/discovery";
import { getPublicHomeDiscovery } from "@/lib/exams/queries";
import { publicMetadata, serializeJsonLd } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata = publicMetadata({
  title: "آزمون آنلاین برای سنجش واقعی و پیشرفت هدفمند",
  description: "مسیر مناسب را پیدا کنید، با زمان‌بندی امن آزمون بدهید و از بازخورد عملی برای قدم بعدی یادگیری استفاده کنید.",
  pathname: "/"
});

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseDiscoveryParams(await searchParams);
  const discovery = process.env.DATABASE_URL ? await getPublicHomeDiscovery(filters) : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "آزمون‌خانه",
    url: appUrl("/"),
    inLanguage: "fa",
    potentialAction: {
      "@type": "SearchAction",
      target: `${appUrl("/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} /><ExamHub discovery={discovery} filters={filters} /></>;
}

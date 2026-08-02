import { ArrowIcon, ClockIcon, CodeIcon, ListIcon, ShieldIcon } from "@/components/icons";
import { ExamDiscovery, type DiscoveryCard } from "@/components/exam-discovery";
import { NavigationLink } from "@/components/navigation-link";
import type { DiscoveryFilters } from "@/lib/exams/discovery";
import { getExamCardTheme } from "@/lib/exams/presentation";

const fallbackExams = [
  { href: "/html", title: "آزمون HTML", topic: "مبانی ساخت صفحات وب", topicSlug: "html", description: "ساختار سند، تگ‌های معنایی، فرم‌ها و رسانه‌ها را در یک آزمون کامل مرور کن.", durationSeconds: 35 * 60, difficulty: "INTERMEDIATE", language: "fa", questionCount: 30, theme: "coral" },
  { href: "/css", title: "آزمون‌های CSS", topic: "طراحی و چیدمان رابط", topicSlug: "css", description: "دو بخش کاربردی از انتخاب‌کننده‌ها تا چیدمان، رسپانسیو و انیمیشن پیش روی توست.", durationSeconds: 40 * 60, difficulty: "INTERMEDIATE", language: "fa", questionCount: 30, theme: "mint" }
] satisfies DiscoveryCard[];

type DiscoveryExam = { slug: string; title: string; categoryName: string; categorySlug: string; levelName: string | null; levelSlug: string | null; pathName: string | null; pathSlug: string | null; shortDescription: string; durationSeconds: number; difficulty: string; locale: string; questionCount: number };
type Facet = { value: string; label: string; count: number };
type Discovery = {
  rootCategories: Array<{ name: string; slug: string; description: string | null }>;
  publishedExams: DiscoveryExam[];
  filters: DiscoveryFilters;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  facets: { paths: Facet[]; levels: Facet[]; topics: Facet[]; difficulties: Array<{ value: string; count: number }> };
};

export function ExamHub({ discovery, filters }: { discovery?: Discovery; filters: DiscoveryFilters }) {
  const filteredFallback = fallbackExams.filter((exam) => {
    const search = filters.q.toLocaleLowerCase("fa-IR");
    const matchesSearch = !search || `${exam.title} ${exam.topic} ${exam.description}`.toLocaleLowerCase("fa-IR").includes(search);
    const matchesTopic = !filters.topics.length || filters.topics.includes(exam.topicSlug);
    const matchesDifficulty = !filters.difficulties.length || filters.difficulties.includes(exam.difficulty);
    return matchesSearch && matchesTopic && matchesDifficulty;
  });
  const examCards: DiscoveryCard[] = discovery?.publishedExams.map((exam) => ({
    href: `/exams/${exam.slug}`,
    title: exam.title,
    topic: exam.categoryName,
    topicSlug: exam.categorySlug,
    description: exam.shortDescription,
    durationSeconds: exam.durationSeconds,
    difficulty: exam.difficulty,
    language: exam.locale,
    questionCount: exam.questionCount,
    theme: getExamCardTheme(exam.slug, exam.difficulty)
  })) ?? filteredFallback;
  const fallbackFacets = {
    paths: [{ value: "web", label: "مهارت‌های وب", count: examCards.length }],
    levels: [] as Facet[],
    topics: [...new Map(examCards.map((exam) => [exam.topicSlug, { value: exam.topicSlug, label: exam.topic, count: 1 }])).values()],
    difficulties: [{ value: "INTERMEDIATE", count: examCards.length }]
  };
  const totalExams = discovery?.pagination.total ?? fallbackExams.length;

  return <main className="exam-hub" id="main-content">
    <section className="hub-hero page-shell" aria-labelledby="hub-title">
      <div className="hub-hero__content">
        <span className="eyebrow"><i /> پلتفرم سنجش و پیشرفت هدفمند</span>
        <h1 id="hub-title">مسیر درست را پیدا کن،<br /><span>پیشرفتت را بسنج.</span></h1>
        <p>در مسیرهای ساختاریافته آزمون بده، با زمان‌بندی امن جلو برو و از بازخورد عملی برای قدم بعدی یادگیری استفاده کن.</p>
        <div className="hub-hero__actions"><NavigationLink className="primary-button primary-button--large" href="/#exams">آزمون مناسبم را پیدا کن <ArrowIcon /></NavigationLink><NavigationLink className="hub-text-link" href="/#paths">انتخاب مسیر یادگیری</NavigationLink></div>
      </div>
      <aside className="hub-summary" aria-label="ویژگی‌های پلتفرم">
        <div className="hub-summary__top"><span><CodeIcon /></span><p>مسیر یادگیری تو</p></div>
        <strong>سنجش، بازخورد، پیشرفت</strong>
        <div className="hub-summary__stats"><span><b>{totalExams.toLocaleString("fa-IR")}</b> آزمون فعال</span><span><b>{discovery?.rootCategories.length.toLocaleString("fa-IR") ?? "۱"}</b> مسیر یادگیری</span></div>
        <div className="hub-summary__line"><i /> آمادهٔ شروعی؟</div>
      </aside>
    </section>

    <section className="hub-features page-shell" aria-label="ویژگی‌های آزمون‌ها">
      <article><span><ClockIcon /></span><div><strong>زمان‌بندی شفاف</strong><p>زمان آزمون پس از شروع ثابت می‌ماند.</p></div></article>
      <article><span><ShieldIcon /></span><div><strong>ارزیابی امن</strong><p>پاسخ‌ها فقط هنگام ثبت نهایی تصحیح می‌شوند.</p></div></article>
      <article><span><ListIcon /></span><div><strong>بازخورد کاربردی</strong><p>پاسخ‌نامه و نکتهٔ آموزشی هر سؤال را ببین.</p></div></article>
    </section>

    <section className="hub-paths page-shell" id="paths" aria-labelledby="paths-title">
      <div className="hub-section-heading"><div><span className="eyebrow"><i /> از کجا شروع کنم؟</span><h2 id="paths-title">ابتدا موضوعی را که می‌خواهی تقویت کنی انتخاب کن</h2></div><p>هر مسیر، دسته‌بندی‌ها و آزمون‌های مرتبط را در یک صفحهٔ روشن و قابل‌فهم جمع می‌کند.</p></div>
      {discovery?.rootCategories.length ? <div className="hub-path-grid">{discovery.rootCategories.map((category, index) => <NavigationLink className="hub-path-card" key={category.slug} href={`/categories/${category.slug}`}><span>مسیر {(index + 1).toLocaleString("fa-IR")}</span><h3>{category.name}</h3><p>{category.description || "دسته‌بندی‌ها و آزمون‌های این مسیر را بررسی کنید."}</p><strong>دیدن مسیر <ArrowIcon /></strong></NavigationLink>)}</div> : <p className="empty-state">مسیرهای فعال پس از اتصال پایگاه داده اینجا نمایش داده می‌شوند.</p>}
    </section>

    <section className="hub-exams page-shell" id="exams" aria-labelledby="exams-title">
      <div className="hub-section-heading"><div><span className="eyebrow"><i /> آزمون‌های آماده</span><h2 id="exams-title">آزمون مناسب سطح خودت را انتخاب کن</h2></div><p>عنوان، زمان، سطح، زبان و تعداد پرسش‌ها را پیش از شروع مقایسه کن.</p></div>
      <ExamDiscovery key={discovery?.filters.q ?? filters.q} cards={examCards} filters={discovery?.filters ?? filters} facets={discovery?.facets ?? fallbackFacets} pagination={discovery?.pagination ?? { page: 1, pageSize: 12, total: examCards.length, totalPages: 1 }} />
    </section>
  </main>;
}

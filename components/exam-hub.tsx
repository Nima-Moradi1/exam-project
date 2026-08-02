import { ArrowIcon, ClockIcon, CodeIcon, ListIcon, ShieldIcon } from "@/components/icons";
import { ExamCategorySliders, type LearningPath } from "@/components/exam-category-sliders";
import { NavigationLink } from "@/components/navigation-link";
import { getExamCardTheme } from "@/lib/exams/presentation";

const fallbackExams = [
  {
    href: "/html",
    label: "آزمون HTML",
    category: "مبانی ساخت صفحات وب",
    description: "ساختار سند، تگ‌های معنایی، فرم‌ها و رسانه‌ها را در یک آزمون کامل مرور کن.",
    duration: "۳۵ دقیقه",
    difficulty: "متوسط",
    accent: "coral"
  },
  {
    href: "/css",
    label: "آزمون‌های CSS",
    category: "طراحی و چیدمان رابط",
    description: "دو بخش کاربردی از انتخاب‌کننده‌ها تا چیدمان، رسپانسیو و انیمیشن پیش روی توست.",
    duration: "۴۰ دقیقه",
    difficulty: "متوسط",
    accent: "mint"
  }
] as const;

type DiscoveryExam = { slug: string; title: string; categoryName: string; categorySlug: string; levelName: string | null; levelSlug: string | null; pathName: string | null; pathSlug: string | null; shortDescription: string; durationSeconds: number; difficulty: string };
type HubExam = LearningPath["exams"][number];

export function ExamHub({ discovery }: { discovery?: { rootCategories: Array<{ name: string; slug: string; description: string | null }>; publishedExams: DiscoveryExam[] } }) {
  const exams: HubExam[] = discovery?.publishedExams.map((exam) => ({
    href: `/exams/${exam.slug}`,
    label: exam.title,
    category: exam.categoryName, categorySlug: exam.categorySlug,
    level: exam.levelName ?? "عمومی", levelSlug: exam.levelSlug ?? "general",
    description: exam.shortDescription,
    duration: `${Math.ceil(exam.durationSeconds / 60)} دقیقه`,
    difficulty: exam.difficulty,
    accent: getExamCardTheme(exam.slug, exam.difficulty)
  })) ?? fallbackExams.map((exam) => ({ ...exam, categorySlug: exam.category === "مبانی ساخت صفحات وب" ? "html" : "css", level: "Frontend", levelSlug: "frontend" }));
  const learningPaths = exams.reduce<LearningPath[]>((paths, exam, index) => {
    const source = discovery?.publishedExams[index];
    const slug = source?.pathSlug ?? "general";
    const name = source?.pathName ?? "عمومی";
    const path = paths.find((entry) => entry.slug === slug);
    if (path) {
      path.exams.push(exam);
    } else {
      paths.push({ name, slug, exams: [exam] });
    }
    return paths;
  }, []);
  return (
    <main className="exam-hub" id="main-content">
      <section className="hub-hero page-shell" aria-labelledby="hub-title">
        <div className="hub-hero__content">
          <span className="eyebrow"><i /> پلتفرم سنجش مهارت وب</span>
          <h1 id="hub-title">با آزمون‌های هدفمند،<br /><span>یادگیریت را بسنج.</span></h1>
          <p>مجموعه‌ای رو‌به‌رشد از آزمون‌های عملی وب؛ زمان‌بندی دقیق، تصحیح امن و بازخورد روشن برای هر پاسخ.</p>
          <div className="hub-hero__actions">
            <NavigationLink className="primary-button primary-button--large" href="/#exams">مشاهده آزمون‌ها <ArrowIcon /></NavigationLink>
            <NavigationLink className="hub-text-link" href="/#paths">انتخاب مسیر یادگیری</NavigationLink>
          </div>
        </div>
        <aside className="hub-summary" aria-label="ویژگی‌های پلتفرم">
          <div className="hub-summary__top"><span><CodeIcon /></span><p>مسیر یادگیری تو</p></div>
          <strong>سنجش، بازخورد، پیشرفت</strong>
          <div className="hub-summary__stats">
            <span><b>{exams.length.toLocaleString("fa-IR")}</b> آزمون فعال</span>
            <span><b>{discovery?.rootCategories.length.toLocaleString("fa-IR") ?? "۳"}</b> مسیر یادگیری</span>
          </div>
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
        {discovery?.rootCategories.length ? <div className="hub-path-grid">{discovery.rootCategories.map((category, index) => <NavigationLink className="hub-path-card" key={category.slug} href={`/categories/${category.slug}`}><span>مسیر {(index + 1).toLocaleString("fa-IR")}</span><h3>{category.name}</h3><p>{category.description || "دسته‌بندی‌ها و آزمون‌های این مسیر را بررسی کنید."}</p><strong>دیدن مسیر <ArrowIcon /></strong></NavigationLink>)}</div> : <p className="empty-state">مسیر یادگیری فعالی برای نمایش وجود ندارد.</p>}
      </section>

      <section className="hub-exams page-shell" id="exams" aria-labelledby="exams-title">
        <div className="hub-section-heading"><div><span className="eyebrow"><i /> آزمون‌های آماده</span><h2 id="exams-title">آزمون مناسب سطح خودت را انتخاب کن</h2></div><p>پیش از شروع، زمان، سطح و موضوع هر آزمون را با خیال راحت بررسی کن.</p></div>
        <ExamCategorySliders paths={learningPaths} />
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";

import { NavigationLink } from "@/components/navigation-link";
import { getCatalogCardTheme, getExamCardTheme } from "@/lib/exams/presentation";
import { getPublicCategoryPath, getPublicCategoryPage } from "@/lib/categories/queries";

export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const resolved = await getPublicCategoryPath(segments);
  if (!resolved) notFound();
  const { category } = resolved;
  const content = await getPublicCategoryPage(category.id, resolved.breadcrumbs);
  const direction = category.direction === "AUTO" ? (category.locale === "fa" ? "rtl" : "ltr") : category.direction.toLowerCase();
  return (
    <main id="main-content" className="catalog-page page-shell" lang={category.locale} dir={direction}>
      <nav aria-label="مسیر دسته‌بندی" className="breadcrumbs"><NavigationLink href="/">خانه</NavigationLink>{content.breadcrumbs.map((item, index) => <span key={item.id}><span aria-hidden="true">/</span><NavigationLink href={`/categories/${segments.slice(0, index + 1).join("/")}`}>{item.name}</NavigationLink></span>)}</nav>
      <header className="catalog-header"><span className="eyebrow"><i /> دسته‌بندی</span><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}</header>
      {content.children.length > 0 && <section className="catalog-section" aria-labelledby="children-title"><div className="catalog-section__heading"><div><span className="eyebrow"><i /> گام بعدی</span><h2 id="children-title">دسته‌بندی‌های این بخش</h2></div><p>برای محدودتر کردن موضوع، یکی از زیرشاخه‌ها را انتخاب کنید.</p></div><div className="catalog-grid">{content.children.map((child) => <NavigationLink className={`catalog-card exam-card--${getCatalogCardTheme(child.slug)}`} key={child.id} href={`/categories/${[...segments, child.slug].join("/")}`}><h3>{child.name}</h3>{child.description && <p>{child.description}</p>}<strong>مشاهدهٔ دسته‌بندی</strong></NavigationLink>)}</div></section>}
      <section className="catalog-section" aria-labelledby="exams-title"><div className="catalog-section__heading"><div><span className="eyebrow"><i /> آزمون‌های آماده</span><h2 id="exams-title">آزمون‌های منتشرشده</h2></div><p>سطح و زمان هر آزمون را بررسی و سپس شروع کنید.</p></div>{content.exams.length ? <div className="catalog-grid">{content.exams.map((exam) => <NavigationLink className={`catalog-card exam-card--${getExamCardTheme(exam.slug, exam.difficulty)}`} key={exam.id} href={`/exams/${exam.slug}`}><div className="exam-card__attributes"><strong className="exam-difficulty">{exam.difficulty}</strong><span className="exam-duration-badge">{Math.ceil(exam.durationSeconds / 60)} دقیقه</span></div><h3>{exam.title}</h3><p>{exam.shortDescription}</p><strong>مشاهدهٔ آزمون</strong></NavigationLink>)}</div> : <p className="empty-state">فعلاً آزمون منتشرشده‌ای در این دسته وجود ندارد.</p>}</section>
    </main>
  );
}

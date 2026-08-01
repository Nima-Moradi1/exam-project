import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryByPath, getPublicCategoryPage } from "@/lib/categories/queries";

export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const category = await getCategoryByPath(segments);
  if (!category) notFound();
  const content = await getPublicCategoryPage(category.id);
  const direction = category.direction === "AUTO" ? (category.locale === "fa" ? "rtl" : "ltr") : category.direction.toLowerCase();
  return (
    <main id="main-content" className="catalog-page page-shell" lang={category.locale} dir={direction}>
      <nav aria-label="مسیر دسته‌بندی" className="breadcrumbs"><Link href="/">خانه</Link>{content.breadcrumbs.map((item, index) => <span key={item.id}><span aria-hidden="true">/</span><Link href={`/categories/${segments.slice(0, index + 1).join("/")}`}>{item.name}</Link></span>)}</nav>
      <header className="catalog-header"><span className="eyebrow"><i /> دسته‌بندی</span><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}</header>
      {content.children.length > 0 && <section aria-labelledby="children-title"><h2 id="children-title">دسته‌بندی‌های این بخش</h2><div className="catalog-grid">{content.children.map((child) => <Link className="catalog-card" key={child.id} href={`/categories/${[...segments, child.slug].join("/")}`}><h3>{child.name}</h3>{child.description && <p>{child.description}</p>}</Link>)}</div></section>}
      <section aria-labelledby="exams-title"><h2 id="exams-title">آزمون‌های منتشرشده</h2>{content.exams.length ? <div className="catalog-grid">{content.exams.map((exam) => <Link className="catalog-card" key={exam.id} href={`/exams/${exam.slug}`}><h3>{exam.title}</h3><p>{exam.shortDescription}</p><small>{Math.ceil(exam.durationSeconds / 60)} دقیقه · {exam.difficulty}</small></Link>)}</div> : <p className="empty-state">فعلاً آزمون منتشرشده‌ای در این دسته وجود ندارد.</p>}</section>
    </main>
  );
}

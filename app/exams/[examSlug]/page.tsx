import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StartExamButton } from "@/components/exam/start-exam-button";
import { appUrl } from "@/lib/config/app-url";
import { formatDuration, formatNumber, formatPercent, getDifficultyLabel, getLanguageLabel, questionTypeLabels, reviewStateLabels } from "@/lib/exams/presentation";
import { getExamOutline, getExamPublicFacts, getPublicExamBySlug } from "@/lib/exams/queries";
import { resolveDirection } from "@/lib/exams/types";
import { publicMetadata, serializeJsonLd } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = { params: Promise<{ examSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getPublicExamBySlug(examSlug);
  if (!exam) return { title: "آزمون پیدا نشد", robots: { index: false, follow: false } };
  const description = `${exam.shortDescription} سطح ${getDifficultyLabel(exam.difficulty)}، زمان ${formatDuration(exam.durationSeconds)}.`;
  return publicMetadata({ title: exam.title, description, pathname: `/exams/${exam.slug}`, locale: exam.locale.replace("-", "_") });
}

export default async function ExamDetailPage({ params }: Props) {
  const exam = await getPublicExamBySlug((await params).examSlug);
  if (!exam) notFound();
  const [outline, facts] = await Promise.all([getExamOutline(exam.id), getExamPublicFacts(exam.id)]);
  const direction = resolveDirection(exam.direction, exam.locale);
  const usesPersianNumerals = exam.locale.toLowerCase().startsWith("fa");
  const questionTypeText = facts.questionTypes.map((type) => questionTypeLabels[type]).join("، ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "خانه", item: appUrl("/") }, { "@type": "ListItem", position: 2, name: exam.categoryName, item: appUrl(`/categories/${exam.categorySlug}`) }, { "@type": "ListItem", position: 3, name: exam.title, item: appUrl(`/exams/${exam.slug}`) }] },
      { "@type": "Quiz", name: exam.title, description: exam.shortDescription, educationalLevel: getDifficultyLabel(exam.difficulty), timeRequired: `PT${Math.ceil(exam.durationSeconds / 60)}M`, inLanguage: exam.locale, url: appUrl(`/exams/${exam.slug}`) }
    ]
  };
  return <main id="main-content" className="exam-detail page-shell" lang={exam.locale} dir={direction}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <section className="exam-detail__hero"><span className="eyebrow"><i /> {exam.categoryName}</span><h1 dir="auto">{exam.title}</h1><p dir="auto">{exam.description}</p><dl className="exam-metadata"><div><dt>سطح</dt><dd>{getDifficultyLabel(exam.difficulty)}</dd></div><div><dt>مدت</dt><dd>{formatDuration(exam.durationSeconds)}</dd></div><div><dt>حدنصاب</dt><dd>{formatPercent(exam.passingScorePercent)}</dd></div><div><dt>زبان</dt><dd>{getLanguageLabel(exam.locale)}</dd></div><div><dt>پرسش</dt><dd>{formatNumber(facts.questionCount)}</dd></div></dl><StartExamButton examId={exam.id} durationSeconds={exam.durationSeconds} questionCount={facts.questionCount} maxAttempts={exam.maxAttempts} /></section>
    <div className="exam-detail__supporting">
      <section className="before-start-card" aria-labelledby="before-start-title"><span className="eyebrow"><i /> تصمیم آگاهانه</span><h2 id="before-start-title">پیش از شروع بدانید</h2><dl><div><dt>نوع پرسش‌ها</dt><dd>{questionTypeText || "اعلام نشده"}</dd></div><div><dt>ذخیره و ادامه</dt><dd>پاسخ‌ها پس از تأیید سرور خودکار ذخیره می‌شوند و تلاش فعال قابل ادامه است.</dd></div><div><dt>پایان زمان</dt><dd>در پایان زمان، پاسخ‌های تأییدشده برای ارزیابی نهایی ثبت می‌شوند.</dd></div><div><dt>شیوهٔ ارزیابی</dt><dd>{exam.showResultsImmediately ? reviewStateLabels.AUTOMATIC : `${reviewStateLabels.AUTOMATIC} و ${reviewStateLabels.MANUAL}`}</dd></div><div><dt>تلاش مجدد</dt><dd>{exam.maxAttempts ? `حداکثر ${formatNumber(exam.maxAttempts)} بار` : "بدون محدودیت اعلام‌شده"}{exam.retryCooldownMinutes ? `؛ فاصلهٔ ${formatNumber(exam.retryCooldownMinutes)} دقیقه` : ""}</dd></div><div><dt>نتیجه</dt><dd>{exam.showResultsImmediately ? "بخش خودکار بلافاصله نمایش داده می‌شود." : "پس از تکمیل بررسی دستی اعلام می‌شود."}</dd></div></dl>{exam.learningObjectives.length > 0 && <><h3>هدف‌های یادگیری</h3><ul>{exam.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></>}</section>
      <section className="outline-card" aria-labelledby="outline-title"><header className="outline-card__header"><span className="eyebrow"><i /> راهنمای آزمون</span><h2 id="outline-title">راهنما و سرفصل آزمون</h2><p>{exam.instructions}</p></header>{outline.length ? <ol className="outline-list">{outline.map((item, index) => <li key={item.id}><span className={`outline-list__number${usesPersianNumerals ? "" : " outline-list__number--latin"}`} aria-hidden="true"><b>{usesPersianNumerals ? (index + 1).toLocaleString("fa-IR") : index + 1}</b></span><div><strong dir="auto">{item.title}</strong>{item.description && <span dir="auto">{item.description}</span>}</div></li>)}</ol> : <p className="outline-card__empty">سرفصل جداگانه‌ای ثبت نشده است.</p>}</section>
    </div>
  </main>;
}

import { notFound } from "next/navigation";

import { StartExamButton } from "@/components/exam/start-exam-button";
import { getExamOutline, getPublicExamBySlug } from "@/lib/exams/queries";
import { resolveDirection } from "@/lib/exams/types";

export const revalidate = 300;

export default async function ExamDetailPage({ params }: { params: Promise<{ examSlug: string }> }) {
  const exam = await getPublicExamBySlug((await params).examSlug);
  if (!exam) notFound();
  const outline = await getExamOutline(exam.id);
  const direction = resolveDirection(exam.direction, exam.locale);
  return <main id="main-content" className="exam-detail page-shell" lang={exam.locale} dir={direction}><section className="exam-detail__hero"><span className="eyebrow"><i /> {exam.categoryName}</span><h1>{exam.title}</h1><p>{exam.description}</p><dl className="exam-metadata"><div><dt>سطح</dt><dd>{exam.difficulty}</dd></div><div><dt>مدت</dt><dd>{Math.ceil(exam.durationSeconds / 60)} دقیقه</dd></div><div><dt>حدنصاب</dt><dd>{exam.passingScorePercent}٪</dd></div><div><dt>زبان</dt><dd>{exam.locale}</dd></div></dl><StartExamButton examId={exam.id} /></section><section className="outline-card" aria-labelledby="outline-title"><header className="outline-card__header"><span className="eyebrow"><i /> پیش از شروع</span><h2 id="outline-title">راهنما و سرفصل آزمون</h2><p>{exam.instructions}</p></header>{outline.length ? <ol className="outline-list">{outline.map((item, index) => <li key={item.id}><span className="outline-list__number" aria-hidden="true">{(index + 1).toLocaleString("fa-IR")}</span><div><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}</div></li>)}</ol> : <p className="outline-card__empty">سرفصل جداگانه‌ای ثبت نشده است.</p>}</section></main>;
}

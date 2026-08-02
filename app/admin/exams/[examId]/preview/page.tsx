import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { formatDuration, formatPercent, getDifficultyLabel, getLanguageLabel } from "@/lib/exams/presentation";
import { getAdminExam } from "@/lib/exams/queries";

export default async function AdminExamPreviewPage({ params }: { params: Promise<{ examId: string }> }) {
  await requirePermission("exam:read");
  const content = await getAdminExam((await params).examId);
  if (!content) notFound();
  const { exam, outline, questions } = content;
  return <section className="admin-exam-preview" aria-labelledby="preview-title"><span className="eyebrow"><i /> پیش‌نمایش داخلی</span><h1 id="preview-title" dir="auto">{exam.title}</h1><p dir="auto">{exam.description}</p><dl className="exam-metadata"><div><dt>سطح</dt><dd>{getDifficultyLabel(exam.difficulty)}</dd></div><div><dt>زمان</dt><dd>{formatDuration(exam.durationSeconds)}</dd></div><div><dt>حدنصاب</dt><dd>{formatPercent(exam.passingScorePercent)}</dd></div><div><dt>زبان</dt><dd>{getLanguageLabel(exam.locale)}</dd></div><div><dt>پرسش</dt><dd>{questions.length.toLocaleString("fa-IR")}</dd></div></dl><section className="outline-card"><h2>هدف‌ها و سرفصل‌ها</h2>{exam.learningObjectives.length ? <ul>{exam.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul> : <p>هدف یادگیری ثبت نشده است.</p>}{outline.length ? <ol>{outline.map((item) => <li key={item.id}>{item.title}</li>)}</ol> : <p>سرفصل ثبت نشده است.</p>}</section></section>;
}

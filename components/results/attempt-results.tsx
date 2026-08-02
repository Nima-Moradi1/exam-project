"use client";

import { useMemo, useState } from "react";
import { AppSelect } from "@/components/ui/form-controls";

type ResultItem = {
  snapshotId: string;
  position: number;
  question: { prompt: string; options: Array<{ id: string; label: string }>; direction: "ltr" | "rtl" };
  answer: unknown;
  status: "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT" | "UNANSWERED" | "PENDING_REVIEW";
  pointsAwarded: number;
  explanation: string | null;
  modelAnswer: string | null;
  correctOptionIds: string[];
  acceptedAnswers: string[];
};

const labels = { CORRECT: "درست", INCORRECT: "نادرست", PARTIALLY_CORRECT: "نیمه‌درست", UNANSWERED: "بی‌پاسخ", PENDING_REVIEW: "در انتظار بررسی" };

function answerText(item: ResultItem, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (value && typeof value === "object" && !Array.isArray(value) && (value as { kind?: unknown }).kind === "AUDIO_RECORDING" && typeof (value as { url?: unknown }).url === "string") return <audio controls controlsList="nodownload noplaybackrate"><source src={(value as { url: string }).url} /></audio>;
  if (Array.isArray(value)) return value.map((id) => item.question.options.find((option) => option.id === id)?.label ?? String(id)).join("، ");
  if (typeof value === "boolean") return value ? "درست" : "نادرست";
  return item.question.options.find((option) => option.id === value)?.label ?? String(value);
}

type Recommendation = { summary: string; strengths: string[]; weaknesses: string[]; studyPlan: Array<{ title: string; reason: string; estimatedMinutes?: number }>; resources: Array<{ id: string; title: string; description: string; type: string; url: string }>; source: "AI" | "DETERMINISTIC"; provider: string | null; model: string | null };

export function AttemptResults({ result }: { result: { attempt: { scorePercent: number | null; scorePoints: number | null; maxPoints: number; message: string | null; direction: "AUTO" | "LTR" | "RTL" }; items: ResultItem[]; recommendation: Recommendation | null } }) {
  const [filter, setFilter] = useState<"ALL" | ResultItem["status"]>("ALL");
  const visible = useMemo(() => result.items.filter((item) => filter === "ALL" || item.status === filter), [filter, result.items]);
  return <main id="main-content" className="results page-shell" dir={result.attempt.direction === "LTR" ? "ltr" : "rtl"}><section className="result-hero"><div><span className="eyebrow"><i /> نتیجهٔ آزمون</span><h1>{result.attempt.scorePercent ?? 0}٪</h1><p>{result.attempt.message}</p><p>{result.attempt.scorePoints ?? 0} از {result.attempt.maxPoints} امتیاز</p></div></section>{result.recommendation && <section className="review-card" aria-labelledby="recommendations-title"><h2 id="recommendations-title">پیشنهادهای شخصی‌سازی‌شده</h2><p>{result.recommendation.summary}</p>{result.recommendation.strengths.length > 0 && <p><strong>نقاط قوت: </strong>{result.recommendation.strengths.join("، ")}</p>}{result.recommendation.weaknesses.length > 0 && <p><strong>نیازمند تمرین: </strong>{result.recommendation.weaknesses.join("، ")}</p>}{result.recommendation.studyPlan.length > 0 && <ol>{result.recommendation.studyPlan.map((step) => <li key={`${step.title}-${step.reason}`}><strong>{step.title}</strong> — {step.reason}{step.estimatedMinutes ? ` (${step.estimatedMinutes} دقیقه)` : ""}</li>)}</ol>}{result.recommendation.resources.length > 0 && <div className="admin-tree">{result.recommendation.resources.map((resource) => <a className="admin-tree__row" key={resource.id} href={resource.url} target="_blank" rel="noreferrer"><span><strong>{resource.title}</strong><small>{resource.description}</small></span><span>{resource.type}</span></a>)}</div>}</section>}<section className="result-status-sheet" aria-labelledby="status-sheet-title"><h2 id="status-sheet-title">پاسخ‌برگ فشرده</h2><AppSelect className="result-status-sheet__filter" label="فیلتر وضعیت" onChange={(value) => setFilter(value as typeof filter)} options={[{ value: "ALL", label: "همه" }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))]} value={filter} /><div className="status-grid">{result.items.map((item) => <a key={item.snapshotId} href={`#result-${item.snapshotId}`} aria-label={`پرسش ${item.position}، ${labels[item.status]}`} className={`status status--${item.status.toLowerCase()}`}>{item.position} <span>{labels[item.status]}</span></a>)}</div></section><section className="review-card" aria-labelledby="details-title"><h2 id="details-title">پاسخ‌نامهٔ تشریحی</h2>{visible.map((item) => <article className="result-item" key={item.snapshotId} id={`result-${item.snapshotId}`} dir={item.question.direction}><header><span>پرسش {item.position}</span><span className={`status status--${item.status.toLowerCase()}`}>{labels[item.status]}</span></header><h3>{item.question.prompt}</h3><dl><div><dt>پاسخ شما</dt><dd>{answerText(item, item.answer)}</dd></div><div><dt>پاسخ درست</dt><dd>{item.correctOptionIds.length ? item.correctOptionIds.map((id) => item.question.options.find((option) => option.id === id)?.label ?? id).join("، ") : item.acceptedAnswers.join("، ") || item.modelAnswer || "پس از بررسی اعلام می‌شود"}</dd></div><div><dt>امتیاز</dt><dd>{item.pointsAwarded}</dd></div></dl>{item.explanation && <p><strong>نکتهٔ آموزشی: </strong>{item.explanation}</p>}</article>)}</section></main>;
}

"use client";

import { useMemo, useState } from "react";

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
  if (Array.isArray(value)) return value.map((id) => item.question.options.find((option) => option.id === id)?.label ?? String(id)).join("، ");
  if (typeof value === "boolean") return value ? "درست" : "نادرست";
  return item.question.options.find((option) => option.id === value)?.label ?? String(value);
}

export function AttemptResults({ result }: { result: { attempt: { scorePercent: number | null; scorePoints: number | null; maxPoints: number; message: string | null; direction: "AUTO" | "LTR" | "RTL" }; items: ResultItem[] } }) {
  const [filter, setFilter] = useState<"ALL" | ResultItem["status"]>("ALL");
  const visible = useMemo(() => result.items.filter((item) => filter === "ALL" || item.status === filter), [filter, result.items]);
  return <main id="main-content" className="results page-shell" dir={result.attempt.direction === "LTR" ? "ltr" : "rtl"}><section className="result-hero"><div><span className="eyebrow"><i /> نتیجهٔ آزمون</span><h1>{result.attempt.scorePercent ?? 0}٪</h1><p>{result.attempt.message}</p><p>{result.attempt.scorePoints ?? 0} از {result.attempt.maxPoints} امتیاز</p></div></section><section className="result-status-sheet" aria-labelledby="status-sheet-title"><h2 id="status-sheet-title">پاسخ‌برگ فشرده</h2><label>فیلتر وضعیت<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="ALL">همه</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="status-grid">{result.items.map((item) => <a key={item.snapshotId} href={`#result-${item.snapshotId}`} aria-label={`پرسش ${item.position}، ${labels[item.status]}`} className={`status status--${item.status.toLowerCase()}`}>{item.position} <span>{labels[item.status]}</span></a>)}</div></section><section className="review-card" aria-labelledby="details-title"><h2 id="details-title">پاسخ‌نامهٔ تشریحی</h2>{visible.map((item) => <article className="result-item" key={item.snapshotId} id={`result-${item.snapshotId}`} dir={item.question.direction}><header><span>پرسش {item.position}</span><span className={`status status--${item.status.toLowerCase()}`}>{labels[item.status]}</span></header><h3>{item.question.prompt}</h3><dl><div><dt>پاسخ شما</dt><dd>{answerText(item, item.answer)}</dd></div><div><dt>پاسخ درست</dt><dd>{item.correctOptionIds.length ? item.correctOptionIds.map((id) => item.question.options.find((option) => option.id === id)?.label ?? id).join("، ") : item.acceptedAnswers.join("، ") || item.modelAnswer || "پس از بررسی اعلام می‌شود"}</dd></div><div><dt>امتیاز</dt><dd>{item.pointsAwarded}</dd></div></dl>{item.explanation && <p><strong>نکتهٔ آموزشی: </strong>{item.explanation}</p>}</article>)}</section></main>;
}

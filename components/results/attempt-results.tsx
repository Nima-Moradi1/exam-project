"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, CircleAlert, Clock3, Download, FileText, GraduationCap, ListChecks, Target, X } from "lucide-react";
import Link from "next/link";
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
const resourceTypes: Record<string, string> = { ARTICLE: "مقاله", DOCUMENTATION: "مستندات", BOOK: "کتاب", COURSE: "دوره", VIDEO: "ویدئو", FILM: "فیلم", SERIES: "مجموعه", PODCAST: "پادکست", EXERCISE: "تمرین", OTHER: "منبع آموزشی" };

function answerText(item: ResultItem, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (value && typeof value === "object" && !Array.isArray(value) && (value as { kind?: unknown }).kind === "AUDIO_RECORDING" && typeof (value as { url?: unknown }).url === "string") return <audio controls controlsList="nodownload noplaybackrate"><source src={(value as { url: string }).url} /></audio>;
  if (Array.isArray(value)) return value.map((id) => item.question.options.find((option) => option.id === id)?.label ?? String(id)).join("، ");
  if (typeof value === "boolean") return value ? "درست" : "نادرست";
  return item.question.options.find((option) => option.id === value)?.label ?? String(value);
}

type Recommendation = { summary: string; strengths: string[]; weaknesses: string[]; studyPlan: Array<{ title: string; reason: string; estimatedMinutes?: number }>; resources: Array<{ id: string; title: string; description: string; type: string; url: string }>; source: "AI" | "DETERMINISTIC"; provider: string | null; model: string | null };

function SectionHeading({ icon, eyebrow, title, description, id }: { icon: ReactNode; eyebrow: string; title: string; description?: string; id: string }) {
  return <div className="results-section-heading">
    <span className="results-section-heading__icon" aria-hidden="true">{icon}</span>
    <div>
      <span className="results-section-heading__eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  </div>;
}

function AnswerCard({ item }: { item: ResultItem }) {
  return <article className="result-item" id={`result-${item.snapshotId}`} dir={item.question.direction}>
    <header><span className="result-item__number">پرسش {item.position}</span><span className={`status status--${item.status.toLowerCase()}`}>{labels[item.status]}</span></header>
    <h3>{item.question.prompt}</h3>
    <dl>
      <div className="result-answer result-answer--yours"><dt>پاسخ شما</dt><dd>{answerText(item, item.answer)}</dd></div>
      <div className="result-answer result-answer--correct"><dt>پاسخ درست</dt><dd>{item.correctOptionIds.length ? item.correctOptionIds.map((id) => item.question.options.find((option) => option.id === id)?.label ?? id).join("، ") : item.acceptedAnswers.join("، ") || item.modelAnswer || "پس از بررسی اعلام می‌شود"}</dd></div>
      <div className="result-answer result-answer--points"><dt>امتیاز این پرسش</dt><dd>{item.pointsAwarded}</dd></div>
    </dl>
    {item.explanation && <aside className="result-item__explanation"><BookOpen aria-hidden="true" /><p><strong>نکتهٔ آموزشی</strong>{item.explanation}</p></aside>}
  </article>;
}

export function AttemptResults({ result }: { result: { attempt: { scorePercent: number | null; scorePoints: number | null; maxPoints: number; message: string | null; direction: "AUTO" | "LTR" | "RTL" }; items: ResultItem[]; recommendation: Recommendation | null } }) {
  const [filter, setFilter] = useState<"ALL" | ResultItem["status"]>("ALL");
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const counts = useMemo(() => result.items.reduce<Record<ResultItem["status"], number>>((total, item) => ({ ...total, [item.status]: total[item.status] + 1 }), { CORRECT: 0, INCORRECT: 0, PARTIALLY_CORRECT: 0, UNANSWERED: 0, PENDING_REVIEW: 0 }), [result.items]);
  const score = Math.max(0, Math.min(100, result.attempt.scorePercent ?? 0));
  const visible = useMemo(() => result.items.filter((item) => filter === "ALL" || item.status === filter), [filter, result.items]);
  const reviewed = counts.CORRECT + counts.INCORRECT + counts.PARTIALLY_CORRECT;
  const scoreTone = score >= 70 ? "success" : score >= 45 ? "warning" : "needs-work";
  const scoreTitle = score >= 70 ? "عملکرد قابل‌اتکا" : score >= 45 ? "پیشرفت خوبی در راه است" : "نقطهٔ شروع روشن است";
  const activeItem = visible[activeIndex];

  function moveSlide(direction: number) {
    setActiveIndex((current) => Math.max(0, Math.min(visible.length - 1, current + direction)));
  }

  function showAnswer(snapshotId: string) {
    const index = visible.findIndex((item) => item.snapshotId === snapshotId);
    if (index < 0) return;
    setActiveIndex(index);
    requestAnimationFrame(() => document.getElementById("details-title")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 42) return;
    moveSlide(distance > 0 ? 1 : -1);
  }

  return <main id="main-content" className="results page-shell" dir="rtl">
    <section className={`result-report-hero result-report-hero--${scoreTone}`} aria-labelledby="result-title">
      <div className="result-report-hero__copy">
        <span className="result-report-hero__eyebrow"><Target aria-hidden="true" /> کارنامهٔ آزمون</span>
        <h1 id="result-title">{scoreTitle}</h1>
        <p>{result.attempt.message || "نتیجهٔ آزمون شما آماده است. در ادامه، جزئیات پاسخ‌ها و مسیر پیشنهادی مرور را ببینید."}</p>
        <div className="result-report-hero__chips">
          <span><Check aria-hidden="true" /> {reviewed} پاسخ بررسی‌شده</span>
          {counts.UNANSWERED > 0 && <span><CircleAlert aria-hidden="true" /> {counts.UNANSWERED} پاسخ بی‌پاسخ</span>}
        </div>
      </div>
      <div className="score-display" aria-label={`نمرهٔ شما ${score} درصد`}>
        <div className="score-display__ring" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}>
          <div><strong>{score}٪</strong><span>نمرهٔ شما</span></div>
        </div>
        <p><b>{result.attempt.scorePoints ?? 0}</b> از {result.attempt.maxPoints} امتیاز</p>
      </div>
      <div className="result-report-hero__note"><span>تحلیل عملکرد</span><strong>پاسخ‌ها، نکته‌ها و منابع پیشنهادی بر اساس همین آزمون آماده شده‌اند.</strong></div>
    </section>

    <section className="result-analytics" aria-label="خلاصهٔ آماری آزمون">
      <article className="result-stat result-stat--correct"><span className="result-stat__icon"><Check /></span><div><span>پاسخ درست</span><strong>{counts.CORRECT}</strong><small>پاسخ دقیق و کامل</small></div></article>
      <article className="result-stat result-stat--incorrect"><span className="result-stat__icon"><X /></span><div><span>پاسخ نادرست</span><strong>{counts.INCORRECT}</strong><small>نیازمند مرور بیشتر</small></div></article>
      <article className="result-stat result-stat--partial"><span className="result-stat__icon"><Target /></span><div><span>نیمه‌درست</span><strong>{counts.PARTIALLY_CORRECT}</strong><small>نزدیک به پاسخ کامل</small></div></article>
      <article className="result-stat result-stat--empty"><span className="result-stat__icon"><CircleAlert /></span><div><span>بی‌پاسخ</span><strong>{counts.UNANSWERED + counts.PENDING_REVIEW}</strong><small>{counts.PENDING_REVIEW ? `${counts.PENDING_REVIEW} مورد در انتظار بررسی` : "فرصت مرور دوباره"}</small></div></article>
    </section>

    {result.recommendation && <section className="recommendation-report" aria-labelledby="recommendations-title">
      <SectionHeading icon={<GraduationCap />} eyebrow="مسیر پیشنهادی شما" title="پیشنهادهای شخصی‌سازی‌شده" description="منابع و تمرین‌ها متناسب با نتیجهٔ همین آزمون چیده شده‌اند." id="recommendations-title" />
      <p className="recommendation-report__summary">{result.recommendation.summary}</p>
      {(result.recommendation.strengths.length > 0 || result.recommendation.weaknesses.length > 0) && <div className="learning-insights">
        {result.recommendation.strengths.length > 0 && <article className="learning-insight learning-insight--strength"><h3><Check aria-hidden="true" /> نقاط قوت شما</h3><ul>{result.recommendation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>}
        {result.recommendation.weaknesses.length > 0 && <article className="learning-insight learning-insight--focus"><h3><Target aria-hidden="true" /> اولویت‌های مرور</h3><ul>{result.recommendation.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul></article>}
      </div>}
      {result.recommendation.studyPlan.length > 0 && <div className="study-plan"><h3>برنامهٔ پیشنهادی مرور</h3><ol>{result.recommendation.studyPlan.map((step, index) => <li key={`${step.title}-${step.reason}`}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.reason}</p></div>{step.estimatedMinutes && <small><Clock3 aria-hidden="true" /> {step.estimatedMinutes} دقیقه</small>}</li>)}</ol></div>}
      {result.recommendation.resources.length > 0 && <div className="recommended-resources"><div className="recommended-resources__title"><BookOpen aria-hidden="true" /><h3>منابع منتخب برای ادامهٔ مسیر</h3></div><div className="resource-grid">{result.recommendation.resources.map((resource) => <a className="resource-card" key={resource.id} href={resource.url} target="_blank" rel="noreferrer"><span className="resource-card__type">{resourceTypes[resource.type] ?? resource.type}</span><strong dir="auto">{resource.title}</strong><p dir="auto">{resource.description}</p><span className="resource-card__link">مشاهدهٔ منبع <ChevronLeft aria-hidden="true" /></span></a>)}</div></div>}
    </section>}

    <section className="result-status-sheet" aria-labelledby="status-sheet-title">
      <div className="result-status-sheet__top"><SectionHeading icon={<ListChecks />} eyebrow="مرور سریع" title="پاسخ‌برگ فشرده" description="روی هر شماره بزنید تا به پاسخ تشریحی همان پرسش بروید." id="status-sheet-title" /><AppSelect className="result-status-sheet__filter" label="نمایش پاسخ‌ها" onChange={(value) => { setFilter(value as typeof filter); setActiveIndex(0); }} options={[{ value: "ALL", label: "همهٔ پاسخ‌ها" }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))]} value={filter} /></div>
      <div className="status-legend" aria-label="راهنمای رنگ وضعیت‌ها"><span className="status-legend__correct">درست</span><span className="status-legend__incorrect">نادرست</span><span className="status-legend__partial">نیمه‌درست</span><span className="status-legend__empty">بی‌پاسخ</span></div>
      <div className="status-grid">{result.items.map((item) => <a key={item.snapshotId} href="#details-title" onClick={(event) => { event.preventDefault(); showAnswer(item.snapshotId); }} aria-label={`نمایش پرسش ${item.position}، ${labels[item.status]}`} className={`status status--${item.status.toLowerCase()}`}><b>{item.position}</b><span>{labels[item.status]}</span></a>)}</div>
    </section>

    <section className="detailed-answers" aria-labelledby="details-title">
      <SectionHeading icon={<FileText />} eyebrow="تحلیل پاسخ‌ها" title="پاسخ‌نامهٔ تشریحی" description={filter === "ALL" ? "پاسخ‌ها را یکی‌یکی ورق بزنید یا با لمس صفحه بین آن‌ها جابه‌جا شوید." : `${visible.length} پاسخ با فیلتر انتخاب‌شده نمایش داده می‌شود.`} id="details-title" />
      {activeItem ? <div className="result-carousel" role="region" aria-roledescription="carousel" aria-label="پاسخ‌نامهٔ تشریحی" onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
        <div className="result-carousel__top"><span>پرسش {activeIndex + 1} از {visible.length}</span><span>{labels[activeItem.status]}</span></div>
        <div className="result-carousel__slide" key={activeItem.snapshotId} role="group" aria-roledescription="slide" aria-label={`پرسش ${activeIndex + 1} از ${visible.length}`}><AnswerCard item={activeItem} /></div>
        <div className="result-carousel__controls"><button type="button" onClick={() => moveSlide(1)} disabled={activeIndex === visible.length - 1} aria-label="پاسخ بعدی"><ArrowRight aria-hidden="true" /> پاسخ بعدی</button><div aria-live="polite"><b>{activeIndex + 1}</b> / {visible.length}</div><button type="button" onClick={() => moveSlide(-1)} disabled={activeIndex === 0} aria-label="پاسخ قبلی">پاسخ قبلی <ArrowLeft aria-hidden="true" /></button></div>
      </div> : <p className="result-carousel__empty">پاسخی با این وضعیت پیدا نشد.</p>}
      <aside className="result-actions" aria-label="اقدام‌های پاسخ‌نامه"><div><span><FileText aria-hidden="true" /> پروندهٔ نتیجه</span><h3>کارنامه‌تان همیشه در دسترس است</h3><p>یک رکورد کامل از این آزمون در بخش «نتایج من» پروفایلتان ذخیره می‌شود و هر زمان می‌توانید دوباره آن را ببینید.</p></div><div className="result-actions__buttons"><button type="button" onClick={() => window.print()}><Download aria-hidden="true" /> دانلود و ذخیرهٔ PDF</button><Link href="/#exams">بازگشت به آزمون‌ها <ChevronLeft aria-hidden="true" /></Link></div></aside>
      <div className="result-print-sheet" aria-hidden="true">{result.items.map((item) => <AnswerCard item={item} key={`print-${item.snapshotId}`} />)}</div>
    </section>
  </main>;
}

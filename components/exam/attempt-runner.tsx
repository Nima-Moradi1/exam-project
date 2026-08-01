"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PublicAttemptDto, PublicQuestionDto } from "@/lib/exams/types";

type SaveState = "saved" | "saving" | "failed";

function empty(value: unknown) {
  return value === null || value === undefined || value === "" || Array.isArray(value) && value.length === 0;
}

function AnswerControl({ question, value, onChange, disabled }: { question: PublicQuestionDto; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const name = `question-${question.id}`;
  if (question.type === "SHORT_TEXT" || question.type === "NUMERIC") return <label className="attempt-field">پاسخ شما<input type={question.type === "NUMERIC" ? "number" : "text"} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>;
  if (question.type === "LONG_TEXT") return <label className="attempt-field">پاسخ شما<textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>;
  if (question.type === "DROPDOWN") return <label className="attempt-field">پاسخ خود را انتخاب کنید<select value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}><option value="">یک گزینه را انتخاب کنید</option>{question.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    return <fieldset className="choice-list"><legend>همهٔ گزینه‌های درست را انتخاب کنید</legend>{question.options.map((option) => <label className="choice-item" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id))} disabled={disabled} /><span>{option.label}</span></label>)}</fieldset>;
  }
  if (question.type === "ORDERING") return <fieldset className="choice-list"><legend>گزینه‌ها را به‌ترتیب انتخاب کنید</legend><p className="form-hint">هر گزینه را با ترتیب درست انتخاب کنید.</p>{question.options.map((option) => <label className="choice-item" key={option.id}><input type="checkbox" checked={Array.isArray(value) && value.includes(option.id)} onChange={(event) => { const current = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; onChange(event.target.checked ? [...current, option.id] : current.filter((item) => item !== option.id)); }} disabled={disabled} /><span>{option.label}</span></label>)}</fieldset>;
  if (question.type === "MATCHING") return <p className="form-hint">این نوع پرسش در ویرایشگر مدیریت به‌صورت جفت‌های پایدار پیکربندی می‌شود.</p>;
  const booleanQuestion = question.type === "TRUE_FALSE";
  return <fieldset className="choice-list"><legend>یک گزینه را انتخاب کنید</legend>{question.options.map((option) => { const optionValue = booleanQuestion ? option.value === "true" : option.id; return <label className="choice-item" key={option.id}><input type="radio" name={name} checked={value === optionValue} onChange={() => onChange(optionValue)} disabled={disabled} /><span>{option.label}</span></label>; })}</fieldset>;
}

export function AttemptRunner({ attempt }: { attempt: PublicAttemptDto }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => Object.fromEntries(attempt.answers.map((answer) => [answer.snapshotId, answer.value])));
  const [revisions, setRevisions] = useState<Record<string, number>>(() => Object.fromEntries(attempt.answers.map((answer) => [answer.snapshotId, answer.clientRevision])));
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<Record<string, unknown>>({});
  const current = attempt.questions[index];
  const answered = useMemo(() => attempt.questions.filter((question) => !empty(answers[question.id])).length, [answers, attempt.questions]);
  const expired = remaining <= 0;

  useEffect(() => { const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now())), 1_000); return () => window.clearInterval(timer); }, [attempt.expiresAt]);
  useEffect(() => { try { localStorage.setItem(`attempt-backup:${attempt.id}`, JSON.stringify({ answers, revisions })); } catch {} }, [answers, attempt.id, revisions]);
  async function flush() {
    const entries = Object.entries(pending.current);
    if (!entries.length || expired) return;
    pending.current = {};
    setSaveState("saving");
    const response = await fetch(`/api/attempts/${attempt.id}/answers`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: entries.map(([snapshotId, value]) => ({ snapshotId, value, clientRevision: revisions[snapshotId] ?? 0 })) }) });
    if (!response.ok) { entries.forEach(([id, value]) => { pending.current[id] = value; }); setSaveState("failed"); return; }
    setSaveState("saved");
  }
  useEffect(() => { const timeout = window.setTimeout(() => void flush(), 700); return () => window.clearTimeout(timeout); });
  function update(snapshotId: string, value: unknown) { setAnswers((currentAnswers) => ({ ...currentAnswers, [snapshotId]: value })); setRevisions((currentRevisions) => ({ ...currentRevisions, [snapshotId]: (currentRevisions[snapshotId] ?? 0) + 1 })); pending.current[snapshotId] = value; setError(""); }
  async function submit() {
    await flush(); setSubmitting(true); setError("");
    const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: [] }) });
    if (!response.ok) { setError("ثبت آزمون انجام نشد. دوباره تلاش کنید."); setSubmitting(false); return; }
    window.location.assign(`/attempts/${attempt.id}/results`);
  }
  if (!current) return null;
  const minutes = Math.floor(remaining / 60_000); const seconds = Math.floor(remaining / 1_000) % 60;
  return <main id="main-content" className="attempt-runner page-shell" lang={attempt.exam.locale} dir={attempt.exam.direction}><header className="attempt-runner__header"><div><p>{attempt.exam.title}</p><strong>{answered} / {attempt.questions.length} پاسخ</strong></div><div role="timer" aria-live="polite" aria-label={`زمان باقی‌مانده ${minutes}:${String(seconds).padStart(2, "0")}`}>{minutes}:{String(seconds).padStart(2, "0")}</div><span role="status">{saveState === "saving" ? "در حال ذخیره…" : saveState === "failed" ? "ذخیره ناموفق؛ تلاش مجدد" : "ذخیره شد"}</span></header><div className="attempt-layout"><nav aria-label="پرسش‌ها" className="attempt-palette">{attempt.questions.map((question, itemIndex) => <button type="button" key={question.id} onClick={() => setIndex(itemIndex)} aria-current={itemIndex === index ? "step" : undefined} className={itemIndex === index ? "is-current" : ""}>{question.position}</button>)}</nav><section className="attempt-question" aria-labelledby={`question-${current.id}`}><p>پرسش {current.position} از {attempt.questions.length}</p><h1 id={`question-${current.id}`}>{current.prompt}</h1>{current.description && <p>{current.description}</p>}<AnswerControl question={current} value={answers[current.id] ?? null} onChange={(value) => update(current.id, value)} disabled={expired || submitting} /><div className="attempt-actions"><button type="button" className="secondary-button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>قبلی</button>{index < attempt.questions.length - 1 ? <button type="button" className="primary-button" onClick={() => setIndex((value) => Math.min(attempt.questions.length - 1, value + 1))}>بعدی</button> : <button type="button" className="primary-button" disabled={submitting || expired} onClick={() => void submit()}>{submitting ? "در حال ثبت…" : "ثبت نهایی آزمون"}</button>}</div>{error && <p role="alert" className="form-error">{error}</p>}</section></div></main>;
}

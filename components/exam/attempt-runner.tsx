"use client";

import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getQuestionPassage, type QuestionPassage } from "@/lib/exams/passage";
import type { PublicAttemptDto, PublicQuestionDto } from "@/lib/exams/types";
import { AppSelect, AppTextArea, AppTextField } from "@/components/ui/form-controls";
import { SpeechRecorder } from "./speech-recorder";
import { ListeningPlayer } from "./listening-player";

type SaveState = "saved" | "saving" | "failed";

function empty(value: unknown) {
  return value === null || value === undefined || value === "" || Array.isArray(value) && value.length === 0;
}

function Choice({ checked, children, input }: { checked: boolean; children: ReactNode; input: ReactNode }) {
  return <label className={`choice-item${checked ? " choice-item--selected" : ""}`}>{input}<span className="choice-item__marker" aria-hidden="true">{checked ? "✓" : ""}</span><span>{children}</span></label>;
}

type PassageEntry = { key: string; id: string; passage: QuestionPassage };

const PassagePanel = memo(function PassagePanel({ entry, open, onToggle }: { entry: PassageEntry; open: boolean; onToggle: () => void }) {
  return <section className="attempt-passage" aria-labelledby={entry.id}>
    <header>
      <div><span>متن مرتبط</span><h2 id={entry.id}>{entry.passage.title}</h2></div>
      <button type="button" onClick={onToggle} aria-expanded={open}>{open ? "بستن متن" : "نمایش متن"}</button>
    </header>
    {open && <div className="attempt-passage__content">{entry.passage.text.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
  </section>;
});

const skillNames = { READING: "Reading", LISTENING: "Listening", WRITING: "Writing", SPEAKING: "Speaking" } as const;

function skillOf(question: PublicQuestionDto) {
  const value = question.settings.skill;
  return typeof value === "string" && value in skillNames ? value as keyof typeof skillNames : null;
}

function AnswerControl({ question, value, onChange, disabled, attemptId, onRecordingBusyChange }: { question: PublicQuestionDto; value: unknown; onChange: (value: unknown) => void; disabled: boolean; attemptId: string; onRecordingBusyChange: (busy: boolean) => void }) {
  const name = `question-${question.id}`;
  if (question.settings.responseMode === "AUDIO") return <SpeechRecorder attemptId={attemptId} snapshotId={question.id} value={value} disabled={disabled} onChange={onChange} onBusyChange={onRecordingBusyChange} />;
  if (question.type === "SHORT_TEXT" || question.type === "NUMERIC") return <AppTextField fieldClassName="attempt-field" label="پاسخ شما" type={question.type === "NUMERIC" ? "number" : "text"} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} />;
  if (question.type === "LONG_TEXT") return <AppTextArea fieldClassName="attempt-field" label="پاسخ شما" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} />;
  if (question.type === "DROPDOWN") return <AppSelect className="attempt-field" disabled={disabled} label="پاسخ خود را انتخاب کنید" onChange={onChange} options={question.options.map((option) => ({ value: option.id, label: option.label }))} placeholder="یک گزینه را انتخاب کنید" value={typeof value === "string" ? value : ""} />;
  if (question.type === "MULTIPLE_CHOICE" || question.type === "ORDERING") {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    return <fieldset className="choice-list"><legend>{question.type === "MULTIPLE_CHOICE" ? "همهٔ گزینه‌های درست را انتخاب کنید" : "گزینه‌ها را به‌ترتیب انتخاب کنید"}</legend>{question.type === "ORDERING" && <p className="form-hint">هر گزینه را با ترتیب درست انتخاب کنید.</p>}{question.options.map((option) => {
      const checked = selected.includes(option.id);
      return <Choice key={option.id} checked={checked} input={<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id))} disabled={disabled} />}>{option.label}</Choice>;
    })}</fieldset>;
  }
  if (question.type === "MATCHING") return <p className="form-hint">این نوع پرسش در ویرایشگر مدیریت به‌صورت جفت‌های پایدار پیکربندی می‌شود.</p>;
  const booleanQuestion = question.type === "TRUE_FALSE";
  return <fieldset className="choice-list"><legend>یک گزینه را انتخاب کنید</legend>{question.options.map((option) => {
    const optionValue = booleanQuestion ? option.value === "true" : option.id;
    const checked = value === optionValue;
    return <Choice key={option.id} checked={checked} input={<input type="radio" name={name} checked={checked} onChange={() => onChange(optionValue)} disabled={disabled} />}>{option.label}</Choice>;
  })}</fieldset>;
}

export function AttemptRunner({ attempt }: { attempt: PublicAttemptDto }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => Object.fromEntries(attempt.answers.map((answer) => [answer.snapshotId, answer.value])));
  const [revisions, setRevisions] = useState<Record<string, number>>(() => Object.fromEntries(attempt.answers.map((answer) => [answer.snapshotId, answer.clientRevision])));
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [passageOpenByKey, setPassageOpenByKey] = useState<Record<string, boolean>>({});
  const [integrityNotice, setIntegrityNotice] = useState("");
  const [captureShield, setCaptureShield] = useState(false);
  const pending = useRef<Record<string, unknown>>({});
  const revisionsRef = useRef(revisions);
  const current = attempt.questions[index];
  const passagesByQuestionId = useMemo(() => {
    const entries = new Map<string, PassageEntry>();
    const byQuestionId: Record<string, PassageEntry | undefined> = {};
    for (const question of attempt.questions) {
      const passage = getQuestionPassage(question);
      if (!passage) continue;
      const key = `${passage.title}\u0000${passage.text}`;
      const entry = entries.get(key) ?? { key, id: `attempt-passage-${entries.size + 1}`, passage };
      entries.set(key, entry);
      byQuestionId[question.id] = entry;
    }
    return byQuestionId;
  }, [attempt.questions]);
  const answered = useMemo(() => attempt.questions.filter((question) => !empty(answers[question.id])).length, [answers, attempt.questions]);
  const expired = remaining <= 0;
  const passageEntry = current ? passagesByQuestionId[current.id] : undefined;
  const passageOpen = passageEntry ? passageOpenByKey[passageEntry.key] ?? true : false;

  useEffect(() => { const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now())), 1_000); return () => window.clearInterval(timer); }, [attempt.expiresAt]);
  useEffect(() => { try { localStorage.setItem(`attempt-backup:${attempt.id}`, JSON.stringify({ answers, revisions })); } catch {} }, [answers, attempt.id, revisions]);
  const notifyIntegrity = useCallback((message: string) => {
    setIntegrityNotice(message);
    window.setTimeout(() => setIntegrityNotice(""), 3200);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") notifyIntegrity("خروج از صفحهٔ آزمون ثبت شد."); };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      if (event.key === "PrintScreen") {
        event.preventDefault();
        setCaptureShield(true);
        window.setTimeout(() => setCaptureShield(false), 900);
        notifyIntegrity("تلاش برای ثبت تصویر از آزمون ثبت شد.");
        return;
      }
      if (modifier && ["c", "x", "v", "s", "p", "u"].includes(key)) {
        event.preventDefault();
        notifyIntegrity("کپی، جای‌گذاری و ذخیره‌سازی محتوا در آزمون مجاز نیست.");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("visibilitychange", onVisibilityChange); document.removeEventListener("keydown", onKeyDown); };
  }, [notifyIntegrity]);

  const flush = useCallback(async () => {
    const entries = Object.entries(pending.current);
    if (!entries.length || expired) return;
    pending.current = {};
    setSaveState("saving");
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/answers`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: entries.map(([snapshotId, value]) => ({ snapshotId, value, clientRevision: revisionsRef.current[snapshotId] ?? 0 })) }) });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setSaveState("saved");
    } catch {
      entries.forEach(([id, value]) => { pending.current[id] = value; });
      setSaveState("failed");
    }
  }, [attempt.id, expired]);

  useEffect(() => { const timeout = window.setTimeout(() => void flush(), 350); return () => window.clearTimeout(timeout); }, [answers, flush]);

  function update(snapshotId: string, value: unknown) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [snapshotId]: value }));
    setRevisions((currentRevisions) => {
      const next = { ...currentRevisions, [snapshotId]: (currentRevisions[snapshotId] ?? 0) + 1 };
      revisionsRef.current = next;
      return next;
    });
    pending.current[snapshotId] = value;
    setError("");
  }

  const togglePassage = useCallback(() => {
    if (!passageEntry) return;
    setPassageOpenByKey((currentState) => ({ ...currentState, [passageEntry.key]: !(currentState[passageEntry.key] ?? true) }));
  }, [passageEntry]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    await flush();
    try {
      const finalAnswers = Object.entries(answers)
        .filter(([, value]) => !empty(value))
        .map(([snapshotId, value]) => ({ snapshotId, value, clientRevision: revisionsRef.current[snapshotId] ?? 0 }));
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: finalAnswers }) });
      if (!response.ok) throw new Error("SUBMIT_FAILED");
      window.location.assign(`/attempts/${attempt.id}/results`);
    } catch {
      setError("ثبت آزمون انجام نشد. دوباره تلاش کنید.");
      setSubmitting(false);
    }
  }

  if (!current) return null;
  const minutes = Math.floor(remaining / 60_000); const seconds = Math.floor(remaining / 1_000) % 60;
  const currentSkill = skillOf(current);
  const listeningUrl = typeof current.settings.audioUrl === "string" ? current.settings.audioUrl : undefined;
  const listeningScript = typeof current.settings.audioScript === "string" ? current.settings.audioScript : undefined;
  return <main id="main-content" className={`attempt-runner page-shell${captureShield ? " attempt-runner--shielded" : ""}`} lang={attempt.exam.locale} dir={attempt.exam.direction} translate="no" onContextMenu={(event) => { event.preventDefault(); notifyIntegrity("باز کردن منوی محتوا در آزمون مجاز نیست."); }} onCopy={(event) => { event.preventDefault(); notifyIntegrity("کپی‌برداری از محتوای آزمون مجاز نیست."); }} onCut={(event) => { event.preventDefault(); notifyIntegrity("برداشتن محتوا در آزمون مجاز نیست."); }} onPaste={(event) => { event.preventDefault(); notifyIntegrity("جای‌گذاری متن در آزمون مجاز نیست."); }} onDragStart={(event) => event.preventDefault()}><div className="attempt-watermark" aria-hidden="true">{attempt.id.slice(0, 8)}</div><header className="attempt-runner__header"><div><p>{attempt.exam.title}</p><strong>{answered} / {attempt.questions.length} پاسخ</strong></div><div role="timer" aria-live="polite" aria-label={`زمان باقی‌مانده ${minutes}:${String(seconds).padStart(2, "0")}`}>{minutes}:{String(seconds).padStart(2, "0")}</div><span role="status">{saveState === "saving" ? "در حال ذخیره…" : saveState === "failed" ? "ذخیره ناموفق؛ تلاش مجدد" : "ذخیره شد"}</span></header>{integrityNotice && <p className="attempt-integrity-notice" role="status">{integrityNotice}</p>}<div className="attempt-layout"><nav aria-label="پرسش‌ها" className="attempt-palette">{attempt.questions.map((question, itemIndex) => <button type="button" key={question.id} onClick={() => setIndex(itemIndex)} disabled={recordingBusy} aria-current={itemIndex === index ? "step" : undefined} className={`${itemIndex === index ? "is-current" : ""}${!empty(answers[question.id]) ? " is-answered" : ""}`}>{question.position}</button>)}</nav><section className="attempt-question" aria-labelledby={`question-${current.id}`}>{currentSkill && <p className={`attempt-skill attempt-skill--${currentSkill.toLowerCase()}`}>{skillNames[currentSkill]}</p>}{currentSkill === "LISTENING" && <ListeningPlayer audioUrl={listeningUrl} audioScript={listeningScript} />}{passageEntry && <PassagePanel entry={passageEntry} open={passageOpen} onToggle={togglePassage} />}<p>پرسش {current.position} از {attempt.questions.length}</p><h1 id={`question-${current.id}`}>{current.prompt}</h1>{current.description && <p>{current.description}</p>}<AnswerControl question={current} value={answers[current.id] ?? null} onChange={(value) => update(current.id, value)} disabled={expired || submitting} attemptId={attempt.id} onRecordingBusyChange={setRecordingBusy} /><div className="attempt-actions"><button type="button" className="secondary-button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0 || recordingBusy}>قبلی</button>{index < attempt.questions.length - 1 ? <button type="button" className="primary-button" onClick={() => setIndex((value) => Math.min(attempt.questions.length - 1, value + 1))} disabled={recordingBusy}>بعدی</button> : <button type="button" className="primary-button" disabled={submitting || expired || recordingBusy} onClick={() => void submit()}>{submitting ? "در حال ثبت…" : recordingBusy ? "در حال ذخیرهٔ صدا…" : "ثبت نهایی آزمون"}</button>}</div>{error && <p role="alert" className="form-error attempt-submit-error">{error}</p>}</section></div></main>;
}

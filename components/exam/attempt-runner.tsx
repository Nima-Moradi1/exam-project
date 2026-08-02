"use client";

import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getQuestionPassage, type QuestionPassage } from "@/lib/exams/passage";
import type { PublicAttemptDto, PublicQuestionDto } from "@/lib/exams/types";
import { AppSelect, AppTextArea, AppTextField } from "@/components/ui/form-controls";
import { AppButton } from "@/components/ui/form-controls";
import { AppModal } from "@/components/ui/app-modal";
import { formatNumber } from "@/lib/exams/presentation";
import { trackProductEvent } from "@/lib/analytics/events";
import { SpeechRecorder } from "./speech-recorder";
import { ListeningPlayer } from "./listening-player";

type SaveState = "saved" | "saving" | "failed" | "offline";

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
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(attempt.answers.length ? attempt.startedAt : null);
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now()));
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [passageOpenByKey, setPassageOpenByKey] = useState<Record<string, boolean>>({});
  const [integrityNotice, setIntegrityNotice] = useState("");
  const [timerAnnouncement, setTimerAnnouncement] = useState("");
  const [captureShield, setCaptureShield] = useState(false);
  const pending = useRef<Record<string, unknown>>({});
  const revisionsRef = useRef(revisions);
  const expirySubmitted = useRef(false);
  const serverClockOffset = useRef(0);
  const announcedThreshold = useRef<number | null>(null);
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
  const unanswered = attempt.questions.length - answered;
  const expired = remaining <= 0;
  const passageEntry = current ? passagesByQuestionId[current.id] : undefined;
  const passageOpen = passageEntry ? passageOpenByKey[passageEntry.key] ?? true : false;

  useEffect(() => { const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(attempt.expiresAt).getTime() - (Date.now() + serverClockOffset.current))), 1_000); return () => window.clearInterval(timer); }, [attempt.expiresAt]);
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
      const payload = await response.json() as { serverTime?: string };
      if (payload.serverTime) serverClockOffset.current = new Date(payload.serverTime).getTime() - Date.now();
      setLastSavedAt(payload.serverTime ?? new Date().toISOString());
      setSaveState("saved");
    } catch {
      entries.forEach(([id, value]) => { pending.current[id] = value; });
      setSaveState(navigator.onLine ? "failed" : "offline");
      trackProductEvent("exam_autosave_failed", { examId: attempt.exam.id });
    }
  }, [attempt.exam.id, attempt.id, expired]);

  useEffect(() => {
    const online = () => { setSaveState((state) => state === "offline" ? "failed" : state); void flush(); };
    const offline = () => setSaveState("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    if (!navigator.onLine) window.setTimeout(offline, 0);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [flush]);

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
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "X-Idempotency-Key": attempt.id }, body: JSON.stringify({ answers: finalAnswers }) });
      if (!response.ok) throw new Error("SUBMIT_FAILED");
      trackProductEvent("exam_submitted", { examId: attempt.exam.id });
      window.location.assign(`/attempts/${attempt.id}/results`);
    } catch {
      setError("ثبت آزمون انجام نشد. دوباره تلاش کنید.");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (remaining > 0 || expirySubmitted.current) return;
    expirySubmitted.current = true;
    void submit();
  });

  useEffect(() => {
    const threshold = remaining <= 0 ? 0 : remaining <= 60_000 ? 60_000 : remaining <= 5 * 60_000 ? 5 * 60_000 : null;
    if (threshold === null || threshold === announcedThreshold.current) return;
    announcedThreshold.current = threshold;
    setTimerAnnouncement(threshold === 0 ? "زمان آزمون پایان یافت و پاسخ‌های ذخیره‌شده در حال ثبت هستند." : threshold === 60_000 ? "یک دقیقه تا پایان آزمون باقی مانده است." : "پنج دقیقه تا پایان آزمون باقی مانده است.");
  }, [remaining]);

  if (!current) return null;
  const minutes = Math.floor(remaining / 60_000); const seconds = Math.floor(remaining / 1_000) % 60;
  const currentSkill = skillOf(current);
  const listeningUrl = typeof current.settings.audioUrl === "string" ? current.settings.audioUrl : undefined;
  const listeningScript = typeof current.settings.audioScript === "string" ? current.settings.audioScript : undefined;
  const paletteDensity = attempt.questions.length > 30 ? " attempt-layout--dense" : "";
  const timerTone = remaining <= 60_000 ? "critical" : remaining <= 5 * 60_000 ? "warning" : "normal";
  const saveLabel = saveState === "saving" ? "در حال ذخیره…" : saveState === "offline" ? "اتصال قطع است؛ پاسخ در این دستگاه نگه داشته شد" : saveState === "failed" ? "ذخیره ناموفق؛ تلاش مجدد خودکار" : lastSavedAt ? `ذخیره‌شده در ${new Date(lastSavedAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}` : "آمادهٔ ذخیره";
  const nextUnanswered = attempt.questions.findIndex((question, itemIndex) => itemIndex > index && empty(answers[question.id]));

  return <main id="main-content" className={`attempt-runner page-shell${captureShield ? " attempt-runner--shielded" : ""}`} lang={attempt.exam.locale} dir={attempt.exam.direction} onContextMenu={(event) => { event.preventDefault(); notifyIntegrity("باز کردن منوی محتوا در آزمون مجاز نیست."); }} onCopy={(event) => { event.preventDefault(); notifyIntegrity("کپی‌برداری از محتوای آزمون مجاز نیست."); }} onCut={(event) => { event.preventDefault(); notifyIntegrity("برداشتن محتوا در آزمون مجاز نیست."); }} onPaste={(event) => { event.preventDefault(); notifyIntegrity("جای‌گذاری متن در آزمون مجاز نیست."); }} onDragStart={(event) => event.preventDefault()}>
    <div className="attempt-watermark" aria-hidden="true">{attempt.id.slice(0, 8)}</div>
    <header className="attempt-runner__header"><div><p dir="auto">{attempt.exam.title}</p><strong>{formatNumber(answered)} پاسخ · {formatNumber(unanswered)} بی‌پاسخ · {formatNumber(flagged.size)} نشان‌دار</strong></div><div className={`attempt-timer attempt-timer--${timerTone}`} role="timer" aria-label={`زمان باقی‌مانده ${minutes}:${String(seconds).padStart(2, "0")}`}><span aria-hidden="true">{minutes}:{String(seconds).padStart(2, "0")}</span><small>{timerTone === "critical" ? "زمان بسیار کم" : timerTone === "warning" ? "زمان رو به پایان" : "زمان باقی‌مانده"}</small></div><span className={`save-status save-status--${saveState}`} role="status">{saveLabel}</span></header>
    <p className="sr-only" aria-live="assertive">{timerAnnouncement}</p>
    {integrityNotice && <p className="attempt-integrity-notice" role="status">{integrityNotice}</p>}
    <div className="attempt-progress" aria-label="پیشرفت آزمون"><span style={{ inlineSize: `${attempt.questions.length ? answered / attempt.questions.length * 100 : 0}%` }} /><p>پرسش {formatNumber(index + 1)} از {formatNumber(attempt.questions.length)}</p></div>
    <div className={`attempt-layout${paletteDensity}`}>
      <nav aria-label="راهنمای پرسش‌ها" className="attempt-palette">{attempt.questions.map((question, itemIndex) => { const isAnswered = !empty(answers[question.id]); const isFlagged = flagged.has(question.id); const state = isFlagged ? "نشان‌دار" : isAnswered ? "پاسخ داده شده" : "بی‌پاسخ"; return <button type="button" key={question.id} onClick={() => setIndex(itemIndex)} disabled={recordingBusy} aria-current={itemIndex === index ? "step" : undefined} aria-label={`پرسش ${question.position}، ${state}`} title={state} className={`${itemIndex === index ? "is-current" : ""}${isAnswered ? " is-answered" : ""}${isFlagged ? " is-flagged" : ""}`}><span>{question.position}</span><small aria-hidden="true">{isFlagged ? "⚑" : isAnswered ? "✓" : "○"}</small></button>; })}</nav>
      <section className="attempt-question" aria-labelledby={`question-${current.id}`}>
        <div className="attempt-question__tools"><span>پرسش {formatNumber(current.position)} از {formatNumber(attempt.questions.length)}</span><button type="button" aria-pressed={flagged.has(current.id)} onClick={() => setFlagged((currentFlags) => { const next = new Set(currentFlags); if (next.has(current.id)) next.delete(current.id); else next.add(current.id); return next; })}>{flagged.has(current.id) ? "برداشتن نشان" : "نشان‌گذاری برای مرور"}</button></div>
        {currentSkill && <p className={`attempt-skill attempt-skill--${currentSkill.toLowerCase()}`}><bdi>{skillNames[currentSkill]}</bdi></p>}
        {currentSkill === "LISTENING" && <ListeningPlayer audioUrl={listeningUrl} audioScript={listeningScript} />}
        {passageEntry && <PassagePanel entry={passageEntry} open={passageOpen} onToggle={togglePassage} />}
        <h1 id={`question-${current.id}`} dir="auto">{current.prompt}</h1>{current.description && <p dir="auto">{current.description}</p>}
        <AnswerControl question={current} value={answers[current.id] ?? null} onChange={(value) => update(current.id, value)} disabled={expired || submitting} attemptId={attempt.id} onRecordingBusyChange={setRecordingBusy} />
        <div className="attempt-review-actions">{nextUnanswered >= 0 && <button type="button" onClick={() => setIndex(nextUnanswered)}>بعدیِ بی‌پاسخ</button>}{flagged.size > 0 && <button type="button" onClick={() => { const nextFlagged = attempt.questions.findIndex((question) => flagged.has(question.id)); if (nextFlagged >= 0) setIndex(nextFlagged); }}>مرور نشان‌دارها</button>}</div>
        <div className="attempt-actions"><button type="button" className="secondary-button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0 || recordingBusy}>قبلی</button>{index < attempt.questions.length - 1 ? <button type="button" className="primary-button" onClick={() => setIndex((value) => Math.min(attempt.questions.length - 1, value + 1))} disabled={recordingBusy}>بعدی</button> : <button type="button" className="primary-button" disabled={submitting || recordingBusy} onClick={() => setConfirmSubmit(true)}>{submitting ? "در حال ثبت…" : recordingBusy ? "در حال ذخیرهٔ صدا…" : expired && error ? "تلاش دوباره برای ثبت" : "مرور و ثبت نهایی"}</button>}</div>
        {error && <p role="alert" className="form-error attempt-submit-error">{error}</p>}
      </section>
    </div>
    <AppModal isOpen={confirmSubmit} onOpenChange={setConfirmSubmit} title="ثبت نهایی آزمون" footer={<><AppButton tone="secondary" onPress={() => setConfirmSubmit(false)}>ادامهٔ آزمون</AppButton><AppButton isDisabled={submitting || recordingBusy} onPress={() => void submit()}>{submitting ? "در حال ثبت…" : "تأیید ثبت نهایی"}</AppButton></>}><div className="submit-confirmation"><p>پس از ثبت نهایی امکان تغییر پاسخ‌ها وجود ندارد.</p><dl><div><dt>پاسخ‌داده‌شده</dt><dd>{formatNumber(answered)}</dd></div><div><dt>بی‌پاسخ</dt><dd>{formatNumber(unanswered)}</dd></div><div><dt>نشان‌دار</dt><dd>{formatNumber(flagged.size)}</dd></div></dl><p>{saveState === "saved" ? "همهٔ تغییرهای اخیر توسط سرور تأیید شده‌اند." : "هنوز تغییر تأییدنشده دارید؛ پیش از ثبت اتصال را بررسی کنید."}</p></div></AppModal>
  </main>;
}

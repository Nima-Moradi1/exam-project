"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AlertIcon, ArrowIcon, ClockIcon, FlagIcon } from "@/components/icons";
import { QuestionCard } from "@/components/question-card";
import { ResultsScreen } from "@/components/results-screen";
import { WelcomeScreen } from "@/components/welcome-screen";
import type {
  AnswerValue,
  GradeResult,
  PublicQuestion,
  SubmittedAnswer
} from "@/types/exam";

type Phase = "welcome" | "exam" | "results";

interface StoredAttempt {
  version: 2;
  phase: "exam" | "results";
  startedAt: number;
  expiresAt: number;
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  warningCount: number;
  result?: GradeResult;
}

interface ExamAppProps {
  questions: readonly PublicQuestion[];
  config?: ExamConfig;
}

export interface ExamConfig {
  title: string;
  description: string;
  courseRange?: string;
  durationMinutes: number;
  storageKey: string;
  apiExamId?: "css-part-1" | "css-part-2";
  abandon?: { cooldownKey: string; returnTo: string };
}

const DEFAULT_CONFIG: ExamConfig = {
  title: "HTML",
  description: "با یک آزمون جامع و کاربردی، دانسته‌هایت دربارهٔ ساختار صفحات وب، عناصر معنایی، فرم‌ها و رسانه‌ها را محک بزن.",
  durationMinutes: 35,
  storageKey: "html-exam-attempt-v2",
  abandon: { cooldownKey: "html-exam-cooldown-until", returnTo: "/" }
};

function emptyAnswers(questions: readonly PublicQuestion[]): Record<string, AnswerValue> {
  return Object.fromEntries(questions.map((question) => [question.id, null]));
}

function hasAnswer(value: AnswerValue): boolean {
  return value !== null && (typeof value !== "string" || value.trim() !== "");
}

function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatUnit = (value: number) =>
    value.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false });

  return `${formatUnit(minutes)}:${formatUnit(seconds)}`;
}

function readStoredAttempt(
  questions: readonly PublicQuestion[],
  durationMs: number,
  storageKey: string
): StoredAttempt | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttempt>;
    const validIds = new Set(questions.map(({ id }) => id));
    if (
      parsed.version !== 2 ||
      (parsed.phase !== "exam" && parsed.phase !== "results") ||
      typeof parsed.startedAt !== "number" ||
      !Number.isFinite(parsed.startedAt) ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt - parsed.startedAt !== durationMs ||
      typeof parsed.currentIndex !== "number" ||
      !parsed.answers ||
      typeof parsed.answers !== "object"
    ) {
      return null;
    }
    const answers = emptyAnswers(questions);
    for (const [id, value] of Object.entries(parsed.answers)) {
      if (
        validIds.has(id) &&
        (value === null || typeof value === "string" || typeof value === "boolean")
      ) {
        answers[id] = value;
      }
    }
    if (parsed.phase === "results" && !parsed.result) return null;
    return {
      version: 2,
      phase: parsed.phase,
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt,
      currentIndex: Math.min(
        Math.max(0, Math.trunc(parsed.currentIndex)),
        questions.length - 1
      ),
      answers,
      warningCount:
        typeof parsed.warningCount === "number"
          ? Math.max(0, Math.trunc(parsed.warningCount))
          : 0,
      result: parsed.result
    };
  } catch {
    return null;
  }
}

export function ExamApp({ questions, config = DEFAULT_CONFIG }: ExamAppProps) {
  const durationMs = config.durationMinutes * 60 * 1000;
  const [phase, setPhase] = useState<Phase>("welcome");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    emptyAnswers(questions)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [attemptLoaded, setAttemptLoaded] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const hasAttemptedTimedSubmission = useRef(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = readStoredAttempt(questions, durationMs, config.storageKey);
      if (stored) {
        setPhase(stored.phase);
        setAnswers(stored.answers);
        setCurrentIndex(stored.currentIndex);
        setWarningCount(stored.warningCount);
        setResult(stored.result ?? null);
        setStartedAt(stored.startedAt);
        setExpiresAt(stored.expiresAt);
      }
      if (config.abandon) {
        const until = Number(localStorage.getItem(config.abandon.cooldownKey) ?? 0);
        if (Number.isFinite(until) && until > Date.now()) setCooldownUntil(until);
      }
      setAttemptLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [config.abandon, config.storageKey, durationMs, questions]);

  useEffect(() => {
    if (phase === "welcome") return;
    const stored: StoredAttempt = {
      version: 2,
      phase,
      startedAt: startedAt ?? Date.now(),
      expiresAt: expiresAt ?? Date.now() + durationMs,
      currentIndex,
      answers,
      warningCount,
      ...(result ? { result } : {})
    };
    localStorage.setItem(config.storageKey, JSON.stringify(stored));
  }, [answers, config.storageKey, currentIndex, durationMs, expiresAt, phase, result, startedAt, warningCount]);

  useEffect(() => {
    if (phase !== "exam" || !expiresAt) return;

    const updateRemainingTime = () => {
      setRemainingMs(Math.max(0, expiresAt - Date.now()));
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 250);
    return () => window.clearInterval(interval);
  }, [expiresAt, phase]);

  const warn = useCallback(() => {
    setWarningCount((count) => count + 1);
    setShowWarning(true);
    window.setTimeout(() => setShowWarning(false), 5000);
  }, []);

  useEffect(() => {
    if (phase !== "exam") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") warn();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const blocked =
        event.key === "F12" ||
        (event.altKey && ["arrowleft", "arrowright"].includes(key)) ||
        (modifier && ["c", "s", "p", "u"].includes(key)) ||
        (modifier && event.shiftKey && ["i", "j", "c"].includes(key));
      if (blocked) {
        event.preventDefault();
        warn();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown);
    const lockHistory = () => window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      lockHistory();
      warn();
    };
    const onDocumentClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("a")) {
        event.preventDefault();
        warn();
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    lockHistory();
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, warn]);

  const answeredCount = useMemo(
    () => questions.filter((question) => hasAnswer(answers[question.id] ?? null)).length,
    [answers, questions]
  );
  const unansweredCount = questions.length - answeredCount;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  function startExam() {
    if (cooldownUntil && cooldownUntil > Date.now()) return;
    const now = Date.now();
    setAnswers(emptyAnswers(questions));
    setCurrentIndex(0);
    setWarningCount(0);
    setResult(null);
    setError("");
    setStartedAt(now);
    setExpiresAt(now + durationMs);
    setRemainingMs(durationMs);
    hasAttemptedTimedSubmission.current = false;
    setPhase("exam");
  }

  function abandonExam() {
    if (!config.abandon) return;
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.removeItem(config.storageKey);
    localStorage.setItem(config.abandon.cooldownKey, String(until));
    window.location.assign(config.abandon.returnTo);
  }

  function updateAnswer(value: AnswerValue) {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
    setError("");
  }

  const submitExam = useCallback(async () => {
    if (submitting || phase !== "exam") return;
    setSubmitting(true);
    setError("");
    setShowConfirm(false);

    const submittedAnswers: SubmittedAnswer[] = questions.map(({ id }) => ({
      id,
      value: answers[id] ?? null
    }));

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: submittedAnswers, warningCount, ...(config.apiExamId ? { examId: config.apiExamId } : {}) })
      });
      const payload = await response.json() as GradeResult & { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ?? "ثبت پاسخ‌ها انجام نشد. دوباره تلاش کنید."
        );
      }
      setResult(payload);
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }, [answers, config.apiExamId, phase, questions, submitting, warningCount]);

  const isExpired = phase === "exam" && expiresAt !== null && remainingMs <= 0;

  useEffect(() => {
    if (isExpired && !submitting && !hasAttemptedTimedSubmission.current) {
      hasAttemptedTimedSubmission.current = true;
      void submitExam();
    }
  }, [isExpired, submitExam, submitting]);

  if (questions.length === 0) {
    return (
      <main className="empty-screen page-shell">
        <AlertIcon />
        <h1>پرسشی برای نمایش وجود ندارد</h1>
        <p>لطفاً کمی بعد دوباره تلاش کنید.</p>
      </main>
    );
  }

  if (!attemptLoaded) {
    return <main className="empty-screen page-shell"><p>در حال بازیابی آزمون…</p></main>;
  }

  if (phase === "welcome") return (
    <WelcomeScreen
      onStart={startExam}
      showCssEntry={!config.apiExamId}
      exam={{ title: config.title, description: config.description, questionCount: questions.length, durationMinutes: config.durationMinutes, courseRange: config.courseRange }}
      startDisabled={cooldownUntil !== null}
      cooldownMessage={cooldownUntil ? `پس از انصراف، امکان شرکت دوباره از ${new Date(cooldownUntil).toLocaleString("fa-IR")} فراهم می‌شود.` : undefined}
    />
  );
  if (phase === "results" && result) {
    return <ResultsScreen result={result} examTitle={config.title} />;
  }

  return (
    <main
      className="exam-page page-shell no-select"
      onContextMenu={(event) => {
        event.preventDefault();
        warn();
      }}
      onCopy={(event) => {
        event.preventDefault();
        warn();
      }}
    >
      {showWarning && (
        <div className="warning-toast" role="status">
          <AlertIcon />
          <div>
            <strong>لطفاً در صفحهٔ آزمون بمانید</strong>
            <span>خروج از زبانه یا تلاش برای کپی ثبت شد. هشدار {warningCount.toLocaleString("fa-IR")}</span>
          </div>
        </div>
      )}

      <section className="exam-top" aria-label="پیشرفت آزمون">
        <div>
          <p>پیشرفت آزمون</p>
          <strong>{answeredCount.toLocaleString("fa-IR")} از {questions.length.toLocaleString("fa-IR")} پاسخ داده شده</strong>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span>{Math.round(progress).toLocaleString("fa-IR")}٪</span>
        <div className={`exam-timer ${isExpired ? "is-expired" : ""}`} role="timer" aria-live="polite" aria-label={`زمان باقی‌مانده: ${formatRemainingTime(remainingMs)}`}>
          <ClockIcon />
          <div>
            <small>زمان باقی‌مانده</small>
            <strong>{formatRemainingTime(remainingMs)}</strong>
          </div>
        </div>
      </section>

      {config.abandon && (
        <div className="exam-abandon">
          <button className="abandon-button" type="button" onClick={() => setShowAbandonConfirm(true)} disabled={submitting}>
            انصراف از آزمون
          </button>
        </div>
      )}

      {isExpired && (
        <div className="time-expired-notice" role="status">
          <AlertIcon />
          زمان آزمون به پایان رسید؛ پاسخ‌ها در حال ثبت هستند.
        </div>
      )}

      <div className="exam-layout">
        <aside className="palette-card" aria-labelledby="palette-title">
          <div className="palette-card__heading">
            <div>
              <p>دسترسی سریع</p>
              <h2 id="palette-title">پرسش‌ها</h2>
            </div>
            <span>{answeredCount.toLocaleString("fa-IR")}/{questions.length.toLocaleString("fa-IR")}</span>
          </div>
          <div className="question-palette">
            {questions.map((question, index) => {
              const answered = hasAnswer(answers[question.id] ?? null);
              const current = index === currentIndex;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={`${answered ? "is-answered" : ""} ${current ? "is-current" : ""}`}
                  onClick={() => setCurrentIndex(index)}
                  disabled={isExpired || submitting}
                  aria-label={`پرسش ${(index + 1).toLocaleString("fa-IR")}${answered ? "، پاسخ‌داده‌شده" : "، بی‌پاسخ"}${current ? "، پرسش فعلی" : ""}`}
                  aria-current={current ? "step" : undefined}
                >
                  {(index + 1).toLocaleString("fa-IR")}
                </button>
              );
            })}
          </div>
          <div className="palette-legend">
            <span><i className="legend-current" /> فعلی</span>
            <span><i className="legend-answered" /> پاسخ‌داده</span>
            <span><i /> بی‌پاسخ</span>
          </div>
          <div className="warning-counter">
            <AlertIcon />
            <span>هشدار خروج از صفحه</span>
            <strong>{warningCount.toLocaleString("fa-IR")}</strong>
          </div>
        </aside>

        <div className="question-column">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              number={currentIndex + 1}
              total={questions.length}
              value={answers[currentQuestion.id] ?? null}
              onChange={updateAnswer}
              disabled={isExpired || submitting}
            />
          )}

          {error && (
            <div className="form-error" role="alert">
              <AlertIcon />
              {error}
            </div>
          )}

          <nav className="question-nav" aria-label="پیمایش پرسش‌ها">
            <button
              className="secondary-button"
              type="button"
              disabled={currentIndex === 0 || isExpired || submitting}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            >
              <ArrowIcon className="arrow-back" />
              پرسش قبلی
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                disabled={isExpired || submitting}
              >
                پرسش بعدی
                <ArrowIcon />
              </button>
            ) : (
              <button className="submit-button" type="button" disabled={isExpired || submitting} onClick={() => setShowConfirm(true)}>
                <FlagIcon />
                ثبت نهایی آزمون
              </button>
            )}
          </nav>

          {currentIndex < questions.length - 1 && (
            <button className="finish-link" type="button" disabled={isExpired || submitting} onClick={() => setShowConfirm(true)}>
              پایان و ثبت آزمون
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setShowConfirm(false)}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="confirm-dialog__icon"><FlagIcon /></span>
            <h2 id="confirm-title">آزمون ثبت نهایی شود؟</h2>
            <p>
              پس از ثبت، امکان تغییر پاسخ‌ها وجود ندارد.
              {unansweredCount > 0 && (
                <> هنوز <strong>{unansweredCount.toLocaleString("fa-IR")} پرسش</strong> بی‌پاسخ مانده است.</>
              )}
            </p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setShowConfirm(false)}>
                بازگشت به آزمون
              </button>
              <button className="submit-button" type="button" disabled={submitting} onClick={submitExam}>
                {submitting ? <span className="button-spinner" /> : <FlagIcon />}
                {submitting ? "در حال ثبت…" : "بله، ثبت شود"}
              </button>
            </div>
          </section>
        </div>
      )}
      {showAbandonConfirm && config.abandon && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setShowAbandonConfirm(false)}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="abandon-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="confirm-dialog__icon"><AlertIcon /></span>
            <h2 id="abandon-title">از آزمون انصراف می‌دهید؟</h2>
            <p>پاسخ‌های فعلی حذف می‌شوند و تا ۲۴ ساعت آینده امکان شرکت دوباره در همین بخش را نخواهید داشت.</p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setShowAbandonConfirm(false)}>بازگشت به آزمون</button>
              <button className="abandon-button" type="button" onClick={abandonExam}>بله، انصراف می‌دهم</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

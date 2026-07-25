"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertIcon, ArrowIcon, FlagIcon } from "@/components/icons";
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
  version: 1;
  phase: "exam" | "results";
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  warningCount: number;
  result?: GradeResult;
}

interface ExamAppProps {
  questions: readonly PublicQuestion[];
}

const STORAGE_KEY = "html-exam-attempt-v1";

function emptyAnswers(questions: readonly PublicQuestion[]): Record<string, AnswerValue> {
  return Object.fromEntries(questions.map((question) => [question.id, null]));
}

function hasAnswer(value: AnswerValue): boolean {
  return value !== null && (typeof value !== "string" || value.trim() !== "");
}

function readStoredAttempt(
  questions: readonly PublicQuestion[]
): StoredAttempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttempt>;
    const validIds = new Set(questions.map(({ id }) => id));
    if (
      parsed.version !== 1 ||
      (parsed.phase !== "exam" && parsed.phase !== "results") ||
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
      version: 1,
      phase: parsed.phase,
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

export function ExamApp({ questions }: ExamAppProps) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    emptyAnswers(questions)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = readStoredAttempt(questions);
      if (stored) {
        setPhase(stored.phase);
        setAnswers(stored.answers);
        setCurrentIndex(stored.currentIndex);
        setWarningCount(stored.warningCount);
        setResult(stored.result ?? null);
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [questions]);

  useEffect(() => {
    if (!hydrated || phase === "welcome") return;
    const stored: StoredAttempt = {
      version: 1,
      phase,
      currentIndex,
      answers,
      warningCount,
      ...(result ? { result } : {})
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [answers, currentIndex, hydrated, phase, result, warningCount]);

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
        (modifier && ["c", "s", "p", "u"].includes(key)) ||
        (modifier && event.shiftKey && ["i", "j", "c"].includes(key));
      if (blocked) {
        event.preventDefault();
        warn();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("keydown", onKeyDown);
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
    setAnswers(emptyAnswers(questions));
    setCurrentIndex(0);
    setWarningCount(0);
    setResult(null);
    setError("");
    setPhase("exam");
  }

  function restartExam() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("welcome");
    setAnswers(emptyAnswers(questions));
    setCurrentIndex(0);
    setWarningCount(0);
    setResult(null);
    setError("");
  }

  function updateAnswer(value: AnswerValue) {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
    setError("");
  }

  async function submitExam() {
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
        body: JSON.stringify({ answers: submittedAnswers, warningCount })
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
  }

  if (!hydrated) {
    return (
      <main className="loading-screen page-shell" aria-live="polite">
        <span className="spinner" />
        <p>در حال آماده‌سازی آزمون…</p>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="empty-screen page-shell">
        <AlertIcon />
        <h1>پرسشی برای نمایش وجود ندارد</h1>
        <p>لطفاً کمی بعد دوباره تلاش کنید.</p>
      </main>
    );
  }

  if (phase === "welcome") return <WelcomeScreen onStart={startExam} />;
  if (phase === "results" && result) {
    return <ResultsScreen result={result} onRestart={restartExam} />;
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
      </section>

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
              value={answers[currentQuestion.id] ?? null}
              onChange={updateAnswer}
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
              disabled={currentIndex === 0}
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
              >
                پرسش بعدی
                <ArrowIcon />
              </button>
            ) : (
              <button className="submit-button" type="button" onClick={() => setShowConfirm(true)}>
                <FlagIcon />
                ثبت نهایی آزمون
              </button>
            )}
          </nav>

          {currentIndex < questions.length - 1 && (
            <button className="finish-link" type="button" onClick={() => setShowConfirm(true)}>
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
    </main>
  );
}

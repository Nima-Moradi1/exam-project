"use client";

import { useEffect, useRef, useState } from "react";

import { AppButton } from "@/components/ui/form-controls";
import { AppModal } from "@/components/ui/app-modal";
import { formatDuration, formatNumber } from "@/lib/exams/presentation";
import { trackProductEvent } from "@/lib/analytics/events";

const startErrors: Record<string, string> = {
  EXAM_NOT_READY: "این آزمون هنوز پرسش آماده برای شروع ندارد.",
  MAX_ATTEMPTS_REACHED: "تعداد مجاز تلاش برای این آزمون به پایان رسیده است.",
  RETRY_COOLDOWN: "برای شروع دوبارهٔ آزمون باید تا پایان زمان انتظار صبر کنید.",
  NOT_FOUND: "آزمون در دسترس نیست یا منتشر نشده است.",
  VALIDATION_ERROR: "اطلاعات آزمون معتبر نیست. صفحه را تازه‌سازی کنید."
};

type EntryState = { kind: "LOADING" | "SIGNED_OUT" | "START" } | { kind: "CONTINUE"; attemptId: string; lastSavedAt: string } | { kind: "REVIEW" | "RESULT"; attemptId: string; scorePercent: number | null };

export function StartExamButton({ examId, durationSeconds, questionCount, maxAttempts }: { examId: string; durationSeconds: number; questionCount: number; maxAttempts: number | null }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [entry, setEntry] = useState<EntryState>({ kind: "LOADING" });
  const [mainVisible, setMainVisible] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/exams/${examId}/entry-state`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<EntryState> : Promise.reject())
      .then(setEntry)
      .catch(() => { if (!controller.signal.aborted) setEntry({ kind: "SIGNED_OUT" }); });
    return () => controller.abort();
  }, [examId]);
  useEffect(() => { trackProductEvent("exam_detail_viewed", { examId }); }, [examId]);

  useEffect(() => {
    const element = mainRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([item]) => setMainVisible(Boolean(item?.isIntersecting)), { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  async function start() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/attempts/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId }) });
      const payload = await response.json().catch(() => ({})) as { id?: string; error?: string };
      if (response.status === 401) {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok || !payload.id) throw new Error(payload.error ?? "UNKNOWN");
      trackProductEvent("exam_started", { examId });
      window.location.assign(`/attempts/${payload.id}`);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(startErrors[code] ?? "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
      setPending(false);
      setConfirming(false);
    }
  }

  function act() {
    if (entry.kind === "CONTINUE") { trackProductEvent("exam_resumed", { examId }); return window.location.assign(`/attempts/${entry.attemptId}`); }
    if (entry.kind === "REVIEW" || entry.kind === "RESULT") return window.location.assign(`/attempts/${entry.attemptId}/results`);
    if (entry.kind === "SIGNED_OUT") return window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    if (entry.kind === "START") setConfirming(true);
  }

  const label = entry.kind === "LOADING" ? "در حال بررسی وضعیت…" : entry.kind === "CONTINUE" ? "ادامهٔ تلاش" : entry.kind === "REVIEW" ? "مشاهدهٔ وضعیت بررسی" : entry.kind === "RESULT" ? "مشاهدهٔ نتیجه" : entry.kind === "SIGNED_OUT" ? "ورود و شروع آزمون" : "شروع آزمون";
  const action = <AppButton className="primary-button primary-button--large" isDisabled={pending || entry.kind === "LOADING"} onPress={act}>{pending ? "در حال آماده‌سازی…" : label}</AppButton>;

  return <>
    <div className="start-exam-action" ref={mainRef}>{action}{entry.kind === "CONTINUE" && <p className="start-exam-action__hint">آخرین ذخیره: {new Date(entry.lastSavedAt).toLocaleString("fa-IR")}</p>}{message && <p role="alert" className="form-error">{message}</p>}</div>
    {!mainVisible && <div className="mobile-sticky-start" aria-hidden="true"><button className="primary-button primary-button--large" type="button" tabIndex={-1} disabled={pending || entry.kind === "LOADING"} onClick={act}>{pending ? "در حال آماده‌سازی…" : label}</button></div>}
    <AppModal isOpen={confirming} onOpenChange={setConfirming} title="آمادهٔ شروع آزمون هستید؟" footer={<><AppButton tone="secondary" onPress={() => setConfirming(false)}>بازگشت</AppButton><AppButton isDisabled={pending} onPress={() => void start()}>تأیید و شروع</AppButton></>}>
      <div className="start-confirmation"><p>با تأیید، زمان رسمی آزمون آغاز می‌شود و در پایان زمان پاسخ‌های ذخیره‌شده ثبت خواهند شد.</p><ul><li>زمان: {formatDuration(durationSeconds)}</li><li>تعداد پرسش: {formatNumber(questionCount)}</li><li>پاسخ‌ها پس از تأیید سرور ذخیره می‌شوند.</li><li>{maxAttempts ? `حداکثر ${formatNumber(maxAttempts)} تلاش مجاز است.` : "محدودیت تعداد تلاش ثبت نشده است."}</li></ul><a href="/terms">شرایط استفاده و حریم خصوصی آزمون</a></div>
    </AppModal>
  </>;
}

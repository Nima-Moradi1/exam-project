"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/form-controls";

const startErrors: Record<string, string> = {
  EXAM_NOT_READY: "این آزمون هنوز پرسش آماده برای شروع ندارد.",
  MAX_ATTEMPTS_REACHED: "تعداد مجاز تلاش برای این آزمون به پایان رسیده است.",
  RETRY_COOLDOWN: "برای شروع دوبارهٔ آزمون باید تا پایان زمان انتظار صبر کنید.",
  NOT_FOUND: "آزمون در دسترس نیست یا منتشر نشده است.",
  VALIDATION_ERROR: "اطلاعات آزمون معتبر نیست. صفحه را تازه‌سازی کنید."
};

export function StartExamButton({ examId }: { examId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function start() {
    setPending(true);
    setMessage("");
    let response: Response;
    try {
      response = await fetch("/api/attempts/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId }) });
    } catch {
      setMessage("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
      setPending(false);
      return;
    }
    const payload = await response.json().catch(() => ({})) as { id?: string; error?: string };
    if (response.status === 401) {
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!response.ok || !payload.id) {
      setMessage(startErrors[payload.error ?? ""] ?? "شروع آزمون انجام نشد. دوباره تلاش کنید.");
      setPending(false);
      return;
    }
    window.location.assign(`/attempts/${payload.id}`);
  }
  return <div className="start-exam-action"><AppButton className="primary-button primary-button--large" isDisabled={pending} onPress={() => void start()}>{pending ? "در حال آماده‌سازی…" : "شروع یا ادامهٔ آزمون"}</AppButton>{message && <p role="alert" className="form-error">{message}</p>}</div>;
}

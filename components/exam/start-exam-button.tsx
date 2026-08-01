"use client";

import { useState } from "react";

export function StartExamButton({ examId }: { examId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function start() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/attempts/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId }) });
    const payload = await response.json() as { id?: string; error?: string };
    if (response.status === 401) {
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!response.ok || !payload.id) {
      setMessage("شروع آزمون انجام نشد. دوباره تلاش کنید.");
      setPending(false);
      return;
    }
    window.location.assign(`/attempts/${payload.id}`);
  }
  return <div><button className="primary-button primary-button--large" type="button" onClick={() => void start()} disabled={pending}>{pending ? "در حال آماده‌سازی…" : "شروع یا ادامهٔ آزمون"}</button>{message && <p role="alert" className="form-error">{message}</p>}</div>;
}

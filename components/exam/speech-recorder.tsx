"use client";

import { useEffect, useRef, useState } from "react";

type Recording = { kind: "AUDIO_RECORDING"; url: string; durationSeconds: number; mimeType: string };

export function SpeechRecorder({ attemptId, snapshotId, value, disabled, onChange, onBusyChange }: { attemptId: string; snapshotId: string; value: unknown; disabled: boolean; onChange: (value: Recording) => void; onBusyChange: (busy: boolean) => void }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const [state, setState] = useState<"idle" | "recording" | "uploading" | "ready" | "error">(value && typeof value === "object" ? "ready" : "idle");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => () => { stream.current?.getTracks().forEach((track) => track.stop()); onBusyChange(false); }, [onBusyChange]);
  useEffect(() => { onBusyChange(state === "recording" || state === "uploading"); }, [onBusyChange, state]);

  async function start() {
    try {
      setMessage("");
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("UNSUPPORTED");
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const instance = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      instance.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      instance.onstop = () => void upload(new Blob(chunks, { type: instance.mimeType || "audio/webm" }));
      recorder.current = instance;
      startedAt.current = Date.now();
      setSeconds(0);
      instance.start();
      setState("recording");
    } catch {
      setState("error");
      setMessage("دسترسی به میکروفون ممکن نیست. اجازهٔ مرورگر را بررسی کنید.");
    }
  }

  function stop() {
    if (recorder.current?.state === "recording") {
      setSeconds(Math.max(1, Math.round((Date.now() - startedAt.current) / 1_000)));
      recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      setState("uploading");
    }
  }

  async function upload(blob: Blob) {
    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1_000));
      const formData = new FormData();
      formData.set("snapshotId", snapshotId);
      formData.set("durationSeconds", String(durationSeconds));
      formData.set("file", new File([blob], "speaking-response.webm", { type: blob.type || "audio/webm" }));
      const response = await fetch(`/api/attempts/${attemptId}/recordings`, { method: "POST", body: formData });
      if (!response.ok) throw new Error("UPLOAD_FAILED");
      onChange(await response.json() as Recording);
      setState("ready");
      setMessage("پاسخ صوتی شما با موفقیت ضبط و ذخیره شد.");
    } catch {
      setState("error");
      setMessage("ذخیرهٔ صدای شما انجام نشد. دوباره ضبط کنید.");
    }
  }

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => setSeconds(Math.max(1, Math.floor((Date.now() - startedAt.current) / 1_000))), 1_000);
    return () => window.clearInterval(timer);
  }, [state]);

  return <section className={`speech-recorder speech-recorder--${state}`} aria-live="polite"><div><span>پاسخ گفتاری</span><strong>{state === "recording" ? `در حال ضبط · ${seconds} ثانیه` : state === "uploading" ? "در حال ذخیرهٔ صدا…" : state === "ready" ? "پاسخ صوتی آماده است" : "پاسخ خود را ضبط کنید"}</strong></div>{state === "recording" ? <button type="button" className="secondary-button" onClick={stop}>پایان ضبط</button> : <button type="button" className="primary-button" onClick={() => void start()} disabled={disabled || state === "uploading"}>ضبط پاسخ</button>}{message && <p className={state === "error" ? "form-error" : "speech-recorder__success"}>{message}</p>}</section>;
}

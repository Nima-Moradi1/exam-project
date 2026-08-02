"use client";

import { useState } from "react";

export function ListeningPlayer({ audioUrl, audioScript }: { audioUrl?: string; audioScript?: string }) {
  const [playing, setPlaying] = useState(false);
  function speak() {
    if (!audioScript || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(audioScript);
    utterance.lang = "en-GB";
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }
  return <section className="listening-player"><div><span>Listening audio</span><strong>فایل صوتی را پیش از پاسخ پخش کنید.</strong></div>{audioUrl ? <audio controls controlsList="nodownload noplaybackrate"><source src={audioUrl} /></audio> : <button type="button" className="secondary-button" onClick={speak} disabled={!audioScript || playing}>{playing ? "در حال پخش…" : "پخش صوت"}</button>}</section>;
}

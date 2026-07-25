"use client";

import { useState } from "react";

import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  ListIcon,
  ShieldIcon
} from "@/components/icons";
import Link from "next/link";
import { SyllabusDialog } from "@/components/syllabus-dialog";
import type { ExamSyllabus } from "@/lib/exam-syllabi";

interface WelcomeScreenProps {
  onStart: () => void;
  exam?: {
    title: string;
    description: string;
    questionCount: number;
    durationMinutes: number;
    syllabus?: ExamSyllabus;
  };
  startDisabled?: boolean;
  cooldownMessage?: string;
  showCssEntry?: boolean;
}

const defaultExam = {
  title: "HTML",
  description: "با یک آزمون جامع و کاربردی، دانسته‌هایت دربارهٔ ساختار صفحات وب، عناصر معنایی، فرم‌ها و رسانه‌ها را محک بزن.",
  questionCount: 30,
  durationMinutes: 35
};

export function WelcomeScreen({ onStart, exam = defaultExam, startDisabled = false, cooldownMessage, showCssEntry = false }: WelcomeScreenProps) {
  const [showSyllabus, setShowSyllabus] = useState(false);
  const instructions = [
    `آزمون شامل ${exam.questionCount.toLocaleString("fa-IR")} پرسش در چهار قالب متفاوت است.`,
    `پس از شروع، ${exam.durationMinutes.toLocaleString("fa-IR")} دقیقه فرصت دارید و زمان با بستن صفحه هم ادامه پیدا می‌کند.`,
    "پس از ثبت نهایی، نتیجه و پاسخ‌نامهٔ تشریحی نمایش داده می‌شود.",
    "برای هر پرسش تنها یک پاسخ در نظر گرفته شده است."
  ];
  return (
    <main className="welcome page-shell">
      <section className="welcome__hero" aria-labelledby="welcome-title">
        <div className="eyebrow">
          <span />
          آماده‌ای دانشت را بسنجی؟
        </div>
        <h1 id="welcome-title">
          یک قدم تا تسلط بیشتر بر
          <span> {exam.title}</span>
        </h1>
        <p>
          {exam.description}
        </p>

        <div className="exam-facts" aria-label="مشخصات آزمون">
          <div>
            <ListIcon />
            <span><strong>{exam.questionCount.toLocaleString("fa-IR")} پرسش</strong><small>چهار نوع سؤال</small></span>
          </div>
          <div>
            <ClockIcon />
            <span><strong>{exam.durationMinutes.toLocaleString("fa-IR")} دقیقه</strong><small>زمان ثابت آزمون</small></span>
          </div>
          <div>
            <ShieldIcon />
            <span><strong>ارزیابی امن</strong><small>تصحیح سمت سرور</small></span>
          </div>
        </div>

        {exam.syllabus && <button className="syllabus-link" type="button" onClick={() => setShowSyllabus(true)}>مشاهده سرفصل‌های آزمون</button>}
        <button className="primary-button primary-button--large" type="button" onClick={onStart} disabled={startDisabled}>
          شروع آزمون
          <ArrowIcon />
        </button>
        <p className="start-note">{cooldownMessage ?? "با شروع آزمون، زمان و پاسخ‌ها در همین مرورگر ذخیره می‌شوند و زمان قابل شروع مجدد نیست."}</p>
        {showCssEntry && <Link className="secondary-button css-entry-button" href="/css">ورود به آزمون‌های CSS</Link>}
      </section>

      <aside className="instruction-card" aria-labelledby="instructions-title">
        <span className="instruction-card__number">{exam.questionCount.toLocaleString("fa-IR")}</span>
        <div className="instruction-card__top">
          <span className="instruction-card__icon"><ListIcon /></span>
          <div>
            <p>پیش از شروع</p>
            <h2 id="instructions-title">راهنمای آزمون</h2>
          </div>
        </div>
        <ul>
          {instructions.map((instruction) => (
            <li key={instruction}>
              <span><CheckIcon /></span>
              {instruction}
            </li>
          ))}
        </ul>
        <div className="question-mix">
          <span>ترکیب پرسش‌ها</span>
          <div aria-hidden="true">
            <i className="mix-description" />
            <i className="mix-dropdown" />
            <i className="mix-choice" />
            <i className="mix-boolean" />
          </div>
          <p>{exam.questionCount === 40 ? "۵ تشریحی · ۱۰ کشویی · ۱۵ چهارگزینه‌ای · ۱۰ درست/نادرست" : "۳ تشریحی · ۱۰ کشویی · ۱۲ چهارگزینه‌ای · ۵ درست/نادرست"}</p>
        </div>
      </aside>
      {showSyllabus && exam.syllabus && <SyllabusDialog syllabus={exam.syllabus} onClose={() => setShowSyllabus(false)} />}
    </main>
  );
}

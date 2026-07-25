"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SyllabusDialog } from "@/components/syllabus-dialog";
import { cssPart1Syllabus, cssPart2Syllabus, type ExamSyllabus } from "@/lib/exam-syllabi";

const exams = [
  { id: "css-part-1", href: "/css/part-1", title: "آزمون CSS — بخش ۱", key: "css-part-1-cooldown-until", syllabus: cssPart1Syllabus },
  { id: "css-part-2", href: "/css/part-2", title: "آزمون CSS — بخش ۲", key: "css-part-2-cooldown-until", syllabus: cssPart2Syllabus }
] as const;

export default function CssLandingPage() {
  const [locked, setLocked] = useState<Record<string, number>>({});
  const [selectedSyllabus, setSelectedSyllabus] = useState<ExamSyllabus | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setLocked(Object.fromEntries(exams.map((exam) => {
        const until = Number(localStorage.getItem(exam.key) ?? 0);
        return [exam.id, until > now ? until : 0];
      })));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="css-landing page-shell">
      <section className="css-landing__hero">
        <span className="eyebrow"><i /> مسیر سنجش CSS</span>
        <h1>آزمون‌های جامع <span>CSS</span></h1>
        <p>هر بخش شامل ۴۰ پرسش کاربردی از سرفصل‌های دورهٔ آموزش CSS روکت، با ۴۵ دقیقه زمان ثابت و پاسخ‌نامهٔ تشریحی است.</p>
      </section>
      <section className="css-exam-grid" aria-label="انتخاب آزمون CSS">
        {exams.map((exam, index) => {
          const until = locked[exam.id] ?? 0;
          const unavailable = until > 0;
          return (
            <article className="css-exam-card" key={exam.id}>
              <span>بخش {(index + 1).toLocaleString("fa-IR")}</span>
              <h2>{exam.title}</h2>
              <button className="syllabus-link" type="button" onClick={() => setSelectedSyllabus(exam.syllabus)}>مشاهده سرفصل‌های آزمون</button>
              <ul>
                <li>۴۰ پرسش در چهار قالب</li>
                <li>۴۵ دقیقه زمان غیرقابل‌توقف</li>
                <li>پاسخ‌نامه و نکته پس از ثبت</li>
              </ul>
              {unavailable ? <p className="cooldown-note">به‌دلیل انصراف، این بخش تا {new Date(until).toLocaleString("fa-IR")} قفل است.</p> : <Link className="primary-button" href={exam.href}>شروع بخش {(index + 1).toLocaleString("fa-IR")}</Link>}
            </article>
          );
        })}
      </section>
      {selectedSyllabus && <SyllabusDialog syllabus={selectedSyllabus} onClose={() => setSelectedSyllabus(null)} />}
    </main>
  );
}

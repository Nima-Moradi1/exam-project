"use client";

import { CheckIcon } from "@/components/icons";
import type { GradeResult } from "@/types/exam";

interface ResultsScreenProps {
  result: GradeResult;
  examTitle?: string;
}

const statusLabel = {
  correct: "درست",
  incorrect: "نادرست",
  unanswered: "بی‌پاسخ"
};

export function ResultsScreen({ result, examTitle = "HTML" }: ResultsScreenProps) {
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - result.percentage / 100);

  return (
    <main className="results page-shell" id="main-content">
      <section className="result-hero" aria-labelledby="result-title">
        <div className="score-ring" aria-label={`امتیاز ${result.percentage} درصد`}>
          <svg viewBox="0 0 124 124" aria-hidden="true">
            <circle className="score-ring__track" cx="62" cy="62" r="54" />
            <circle
              className="score-ring__value"
              cx="62"
              cy="62"
              r="54"
              style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
            />
          </svg>
          <span><strong>{result.percentage.toLocaleString("fa-IR")}%</strong><small>امتیاز شما</small></span>
        </div>
        <div>
          <span className="eyebrow"><i /> آزمون با موفقیت ثبت شد</span>
          <h1 id="result-title">نتیجهٔ آزمون {examTitle}</h1>
          <p>{result.message}</p>
        </div>
      </section>

      <section className="stat-grid" aria-label="خلاصهٔ نتیجه">
        <article>
          <span className="stat-icon stat-icon--total">{result.total.toLocaleString("fa-IR")}</span>
          <p>کل پرسش‌ها</p>
          <strong>{result.total.toLocaleString("fa-IR")}</strong>
        </article>
        <article>
          <span className="stat-icon stat-icon--correct"><CheckIcon /></span>
          <p>پاسخ درست</p>
          <strong>{result.correct.toLocaleString("fa-IR")}</strong>
        </article>
        <article>
          <span className="stat-icon stat-icon--wrong">×</span>
          <p>پاسخ نادرست</p>
          <strong>{result.incorrect.toLocaleString("fa-IR")}</strong>
        </article>
        <article>
          <span className="stat-icon stat-icon--empty">—</span>
          <p>بدون پاسخ</p>
          <strong>{result.unanswered.toLocaleString("fa-IR")}</strong>
        </article>
      </section>

      <section className="review-card" aria-labelledby="review-title">
        <div className="review-card__heading">
          <div>
            <p>مرور و یادگیری</p>
            <h2 id="review-title">پاسخ‌نامهٔ تشریحی</h2>
          </div>
          <span>{result.review.length.toLocaleString("fa-IR")} پرسش</span>
        </div>
        <div className="review-table-wrap">
          <table>
            <thead>
              <tr>
                <th>شماره</th>
                <th>پرسش</th>
                <th>پاسخ شما</th>
                <th>پاسخ درست</th>
                <th>وضعیت</th>
                <th>نکته</th>
              </tr>
            </thead>
            <tbody>
              {result.review.map((item) => (
                <tr key={item.id}>
                  <td data-label="شماره">{item.number.toLocaleString("fa-IR")}</td>
                  <td data-label="پرسش">{item.question}</td>
                  <td data-label="پاسخ شما"><code>{item.userAnswer}</code></td>
                  <td data-label="پاسخ درست"><code>{item.correctAnswer}</code></td>
                  <td data-label="وضعیت">
                    <span className={`status status--${item.status}`}>
                      {statusLabel[item.status]}
                    </span>
                  </td>
                  <td data-label="نکته">{item.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

"use client";

import type { AnswerValue, PublicQuestion } from "@/types/exam";

interface QuestionCardProps {
  question: PublicQuestion;
  number: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

const typeLabels: Record<PublicQuestion["type"], string> = {
  descriptive: "پاسخ کوتاه",
  dropdown: "انتخاب از فهرست",
  "multiple-choice": "چهارگزینه‌ای",
  "true-false": "درست یا نادرست"
};

export function QuestionCard({
  question,
  number,
  value,
  onChange
}: QuestionCardProps) {
  const inputName = `answer-${question.id}`;

  return (
    <article className="question-card" aria-labelledby={`question-${question.id}`}>
      <div className="question-card__meta">
        <span>پرسش {number} از ۳۰</span>
        <span>{typeLabels[question.type]}</span>
      </div>
      <h2 id={`question-${question.id}`}>{question.text}</h2>

      {question.type === "descriptive" && (
        <div className="short-answer">
          <label htmlFor={inputName}>پاسخ شما</label>
          <input
            id={inputName}
            name={inputName}
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={160}
            value={typeof value === "string" ? value : ""}
            placeholder={question.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
          <small>یک پاسخ کوتاه و دقیق بنویسید.</small>
        </div>
      )}

      {question.type === "dropdown" && (
        <div className="select-answer">
          <label htmlFor={inputName}>پاسخ خود را انتخاب کنید</label>
          <div className="select-wrap">
            <select
              id={inputName}
              name={inputName}
              value={typeof value === "string" ? value : ""}
              onChange={(event) => onChange(event.target.value)}
            >
              <option value="">یک گزینه را انتخاب کنید…</option>
              {question.choices?.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {(question.type === "multiple-choice" || question.type === "true-false") && (
        <fieldset className={`choice-list ${question.type === "true-false" ? "choice-list--boolean" : ""}`}>
          <legend className="sr-only">یکی از گزینه‌ها را انتخاب کنید</legend>
          {question.choices?.map((choice, index) => {
            const choiceValue = question.type === "true-false"
              ? choice.id === "true"
              : choice.id;
            const selected = value === choiceValue;
            return (
              <label className={`choice-item ${selected ? "choice-item--selected" : ""}`} key={choice.id}>
                <input
                  type="radio"
                  name={inputName}
                  value={choice.id}
                  checked={selected}
                  onChange={() => onChange(choiceValue)}
                />
                <span className="choice-item__marker" aria-hidden="true">
                  {question.type === "true-false"
                    ? choice.id === "true" ? "✓" : "×"
                    : String.fromCharCode(65 + index)}
                </span>
                <span>{choice.label}</span>
              </label>
            );
          })}
        </fieldset>
      )}
    </article>
  );
}

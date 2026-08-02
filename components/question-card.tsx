"use client";

import type { AnswerValue, PublicQuestion } from "@/types/exam";
import { AppSelect, AppTextField } from "@/components/ui/form-controls";

interface QuestionCardProps {
  question: PublicQuestion;
  number: number;
  total: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
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
  total,
  value,
  onChange,
  disabled = false
}: QuestionCardProps) {
  const inputName = `answer-${question.id}`;

  return (
    <article className="question-card" aria-labelledby={`question-${question.id}`}>
      <div className="question-card__meta">
        <span>پرسش {number.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")}</span>
        <span>{typeLabels[question.type]}</span>
      </div>
      <h2 id={`question-${question.id}`}>{question.text}</h2>

      {question.type === "descriptive" && (
        <div className="short-answer">
          <AppTextField
            id={inputName}
            label="پاسخ شما"
            name={inputName}
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={160}
            value={typeof value === "string" ? value : ""}
            placeholder={question.placeholder}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
          />
          <small>یک پاسخ کوتاه و دقیق بنویسید.</small>
        </div>
      )}

      {question.type === "dropdown" && (
        <AppSelect className="select-answer" disabled={disabled} label="پاسخ خود را انتخاب کنید" name={inputName} onChange={onChange} options={(question.choices ?? []).map((choice) => ({ value: choice.id, label: choice.label }))} placeholder="یک گزینه را انتخاب کنید…" value={typeof value === "string" ? value : ""} />
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
                  disabled={disabled}
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

import "server-only";

import { answerKey } from "@/lib/questions/private.server";
import { publicQuestions } from "@/lib/questions/public";
import type { AnswerValue, GradeResult, SubmittedAnswer } from "@/types/exam";

export function normalizeDescriptiveAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”„«»]/g, "\"")
    .replace(/[‘’‚`´]/g, "'")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s+/g, " ")
    .replace(/<\s+/g, "<")
    .replace(/\s+>/g, ">");
}

function isUnanswered(value: AnswerValue): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function answerLabel(questionId: string, value: AnswerValue): string {
  if (isUnanswered(value)) return "بی‌پاسخ";
  const question = publicQuestions.find(({ id }) => id === questionId);
  if (typeof value === "boolean") return value ? "درست" : "نادرست";
  const choice = question?.choices?.find(({ id }) => id === value);
  return choice?.label ?? String(value).trim();
}

function isCorrectAnswer(answer: SubmittedAnswer): boolean {
  const key = answerKey[answer.id as keyof typeof answerKey];
  if (!key || isUnanswered(answer.value)) return false;

  if (key.acceptedAnswers && typeof answer.value === "string") {
    const normalized = normalizeDescriptiveAnswer(answer.value);
    return key.acceptedAnswers.some(
      (accepted) => normalizeDescriptiveAnswer(accepted) === normalized
    );
  }
  return answer.value === key.answer;
}

export function performanceMessage(percentage: number): string {
  if (percentage >= 90) return "درخشان! پایه‌های HTML را بسیار خوب می‌شناسید.";
  if (percentage >= 75) return "خیلی خوب! تنها چند نکته تا تسلط کامل فاصله دارید.";
  if (percentage >= 60) return "خوب پیش رفته‌اید؛ مرور پاسخ‌های نادرست نتیجه را بهتر می‌کند.";
  if (percentage >= 40) return "شروع خوبی است؛ سرفصل‌های پایه را یک‌بار دیگر مرور کنید.";
  return "این آزمون نقطهٔ شروع شماست؛ با مرور درس‌ها دوباره امتحان کنید.";
}

export function gradeSubmission(answers: readonly SubmittedAnswer[]): GradeResult {
  const submittedById = new Map(answers.map((answer) => [answer.id, answer]));
  let correct = 0;
  let unanswered = 0;

  const review = publicQuestions.map((question, index) => {
    const submitted = submittedById.get(question.id) ?? {
      id: question.id,
      value: null
    };
    const empty = isUnanswered(submitted.value);
    const valid = !empty && isCorrectAnswer(submitted);
    const key = answerKey[question.id as keyof typeof answerKey];

    if (empty) unanswered += 1;
    if (valid) correct += 1;

    return {
      id: question.id,
      number: index + 1,
      question: question.text,
      userAnswer: answerLabel(question.id, submitted.value),
      correctAnswer: answerLabel(question.id, key.answer),
      status: empty ? "unanswered" as const : valid ? "correct" as const : "incorrect" as const,
      explanation: key.explanation
    };
  });

  const incorrect = publicQuestions.length - correct - unanswered;
  const percentage = Math.round((correct / publicQuestions.length) * 1000) / 10;

  return {
    total: publicQuestions.length,
    correct,
    incorrect,
    unanswered,
    percentage,
    message: performanceMessage(percentage),
    review
  };
}

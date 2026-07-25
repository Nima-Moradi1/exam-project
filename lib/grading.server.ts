import "server-only";

import { answerKey } from "@/lib/questions/private.server";
import { publicQuestions } from "@/lib/questions/public";
import type { AnswerValue, GradeResult, PublicQuestion, SubmittedAnswer } from "@/types/exam";

interface AnswerKeyItem {
  answer: string | boolean;
  acceptedAnswers?: readonly string[];
  explanation: string;
}

export function normalizeDescriptiveAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”„«»]/g, "\"")
    .replace(/[‘’‚`´]/g, "'")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ")
    .replace(/<\s+/g, "<")
    .replace(/\s+>/g, ">");
}

function isUnanswered(value: AnswerValue): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function answerLabel(questions: readonly PublicQuestion[], questionId: string, value: AnswerValue): string {
  if (isUnanswered(value)) return "بی‌پاسخ";
  const question = questions.find(({ id }) => id === questionId);
  if (typeof value === "boolean") return value ? "درست" : "نادرست";
  const choice = question?.choices?.find(({ id }) => id === value);
  return choice?.label ?? String(value).trim();
}

function isCorrectAnswer(answer: SubmittedAnswer, keys: Readonly<Record<string, AnswerKeyItem>>): boolean {
  const key = keys[answer.id];
  if (!key || isUnanswered(answer.value)) return false;

  if (key.acceptedAnswers && typeof answer.value === "string") {
    const normalized = normalizeDescriptiveAnswer(answer.value);
    return key.acceptedAnswers.some(
      (accepted) => normalizeDescriptiveAnswer(accepted) === normalized
    );
  }
  return answer.value === key.answer;
}

export function performanceMessage(percentage: number, subject = "HTML"): string {
  if (percentage >= 90) return `درخشان! پایه‌های ${subject} را بسیار خوب می‌شناسید.`;
  if (percentage >= 75) return "خیلی خوب! تنها چند نکته تا تسلط کامل فاصله دارید.";
  if (percentage >= 60) return "خوب پیش رفته‌اید؛ مرور پاسخ‌های نادرست نتیجه را بهتر می‌کند.";
  if (percentage >= 40) return "شروع خوبی است؛ سرفصل‌های پایه را یک‌بار دیگر مرور کنید.";
  return "این آزمون نقطهٔ شروع شماست؛ با مرور درس‌ها دوباره امتحان کنید.";
}

export function gradeSubmission(
  answers: readonly SubmittedAnswer[],
  questions: readonly PublicQuestion[] = publicQuestions,
  keys: Readonly<Record<string, AnswerKeyItem>> = answerKey,
  subject = "HTML"
): GradeResult {
  const submittedById = new Map(answers.map((answer) => [answer.id, answer]));
  let correct = 0;
  let unanswered = 0;

  const review = questions.map((question, index) => {
    const submitted = submittedById.get(question.id) ?? {
      id: question.id,
      value: null
    };
    const empty = isUnanswered(submitted.value);
    const valid = !empty && isCorrectAnswer(submitted, keys);
    const key = keys[question.id];

    if (empty) unanswered += 1;
    if (valid) correct += 1;

    return {
      id: question.id,
      number: index + 1,
      question: question.text,
      userAnswer: answerLabel(questions, question.id, submitted.value),
      correctAnswer: answerLabel(questions, question.id, key.answer),
      status: empty ? "unanswered" as const : valid ? "correct" as const : "incorrect" as const,
      explanation: key.explanation
    };
  });

  const incorrect = questions.length - correct - unanswered;
  const percentage = Math.round((correct / questions.length) * 1000) / 10;

  return {
    total: questions.length,
    correct,
    incorrect,
    unanswered,
    percentage,
    message: performanceMessage(percentage, subject),
    review
  };
}

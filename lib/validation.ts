import { z } from "zod";

import { publicQuestions } from "@/lib/questions/public";
import type { PublicQuestion, SubmittedAnswer } from "@/types/exam";

const answerSchema = z
  .object({
    id: z.string().min(1).max(10),
    value: z.union([
      z.string().max(160),
      z.boolean(),
      z.null()
    ])
  })
  .strict();

const submissionSchema = z
  .object({
    examId: z.string().min(1).max(32).optional(),
    answers: z.array(answerSchema).min(1).max(100),
    warningCount: z.number().int().min(0).max(10_000).optional()
  })
  .strict();

export type ValidSubmission = {
  answers: SubmittedAnswer[];
  warningCount?: number;
};

export function validateSubmission(input: unknown, questions: readonly PublicQuestion[] = publicQuestions):
  | { success: true; data: ValidSubmission }
  | { success: false; message: string } {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "ساختار پاسخ‌های ارسالی معتبر نیست." };
  }

  const ids = parsed.data.answers.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    return { success: false, message: "شناسهٔ تکراری در پاسخ‌ها پذیرفته نیست." };
  }

  if (parsed.data.answers.length !== questions.length) {
    return { success: false, message: "تعداد پاسخ‌های ارسالی با آزمون هم‌خوانی ندارد." };
  }

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  if (ids.some((id) => !questionsById.has(id))) {
    return { success: false, message: "یک یا چند شناسهٔ پرسش ناشناخته است." };
  }

  if (questions.some((question) => !ids.includes(question.id))) {
    return { success: false, message: "پاسخ همهٔ پرسش‌ها باید ارسال شود؛ برای بی‌پاسخ مقدار خالی بفرستید." };
  }

  for (const submitted of parsed.data.answers) {
    const question = questionsById.get(submitted.id);
    if (!question) continue;

    if (question.type === "true-false") {
      if (submitted.value !== null && typeof submitted.value !== "boolean") {
        return { success: false, message: "نوع پاسخ درست/نادرست معتبر نیست." };
      }
      continue;
    }

    if (submitted.value !== null && typeof submitted.value !== "string") {
      return { success: false, message: "نوع یکی از پاسخ‌ها معتبر نیست." };
    }

    if (
      (question.type === "dropdown" || question.type === "multiple-choice") &&
      typeof submitted.value === "string" &&
      submitted.value !== "" &&
      !question.choices?.some((choice) => choice.id === submitted.value)
    ) {
      return { success: false, message: "یکی از گزینه‌های انتخاب‌شده معتبر نیست." };
    }
  }

  return { success: true, data: parsed.data };
}

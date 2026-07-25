import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/submit/route";
import { gradeSubmission, normalizeDescriptiveAnswer } from "@/lib/grading.server";
import { answerKey } from "@/lib/questions/private.server";
import { publicQuestions } from "@/lib/questions/public";
import { validateSubmission } from "@/lib/validation";
import type { SubmittedAnswer } from "@/types/exam";

const allEmpty = (): SubmittedAnswer[] =>
  publicQuestions.map(({ id }) => ({ id, value: null }));

const allCorrect = (): SubmittedAnswer[] =>
  publicQuestions.map(({ id }) => ({
    id,
    value: answerKey[id].answer
  }));

describe("ساختار آزمون", () => {
  it("دقیقاً ۳۰ پرسش با شمار نوع‌های خواسته‌شده دارد", () => {
    expect(publicQuestions).toHaveLength(30);
    const counts = publicQuestions.reduce<Record<string, number>>(
      (result, question) => ({
        ...result,
        [question.type]: (result[question.type] ?? 0) + 1
      }),
      {}
    );
    expect(counts).toEqual({
      descriptive: 3,
      dropdown: 10,
      "multiple-choice": 12,
      "true-false": 5
    });
  });

  it("دقیقاً سه پرسش پیشرفته دارد", () => {
    expect(
      Object.values(answerKey).filter(({ difficulty }) => difficulty === "advanced")
    ).toHaveLength(3);
  });

  it("شناسهٔ همهٔ پرسش‌ها یکتا است", () => {
    const ids = publicQuestions.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("هر پرسش کشویی دقیقاً شش گزینه دارد", () => {
    for (const question of publicQuestions.filter(({ type }) => type === "dropdown")) {
      expect(question.choices).toHaveLength(6);
    }
  });

  it("هر پرسش انتخابی دقیقاً یک پاسخ کلیدی و معتبر دارد", () => {
    for (const question of publicQuestions.filter(({ type }) => type !== "descriptive")) {
      const answer = answerKey[question.id].answer;
      if (question.type === "true-false") {
        expect(typeof answer).toBe("boolean");
      } else {
        expect(
          question.choices?.filter(({ id }) => id === answer)
        ).toHaveLength(1);
      }
    }
  });

  it("دادهٔ عمومی هیچ فیلد پاسخ یا سختی ندارد", () => {
    const serialized = JSON.stringify(publicQuestions);
    expect(serialized).not.toMatch(
      /acceptedAnswers|correctAnswer|answerKey|"answer"|"difficulty"/i
    );
  });
});

describe("ارزیابی", () => {
  it("پاسخ‌های خالی را درست می‌شمارد", () => {
    const result = gradeSubmission(allEmpty());
    expect(result).toMatchObject({
      total: 30,
      correct: 0,
      incorrect: 0,
      unanswered: 30,
      percentage: 0
    });
  });

  it("همهٔ پاسخ‌های درست را درست ارزیابی می‌کند", () => {
    const result = gradeSubmission(allCorrect());
    expect(result).toMatchObject({
      correct: 30,
      incorrect: 0,
      unanswered: 0,
      percentage: 100
    });
  });

  it("پاسخ نادرست را درست ارزیابی می‌کند", () => {
    const answers = allEmpty();
    answers[3] = { id: "q04", value: "b" };
    const result = gradeSubmission(answers);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(1);
    expect(result.unanswered).toBe(29);
  });

  it("فاصله، بزرگی حروف و گیومه‌های معادل را عادی‌سازی می‌کند", () => {
    expect(normalizeDescriptiveAnswer("  <A   TARGET = “_BLANK” >  "))
      .toBe("<a target=\"_blank\">");
    const answers = allEmpty();
    answers[2] = { id: "q03", value: "<A TARGET = “_BLANK”>" };
    expect(gradeSubmission(answers).correct).toBe(1);
  });

  it("درصد را با حداکثر یک رقم اعشار محاسبه می‌کند", () => {
    const answers = allEmpty();
    for (let index = 0; index < 2; index += 1) {
      answers[index] = allCorrect()[index];
    }
    expect(gradeSubmission(answers).percentage).toBe(6.7);
  });
});

describe("اعتبارسنجی و API", () => {
  it("شناسهٔ تکراری، شناسهٔ ناشناخته و فیلد اضافه را رد می‌کند", () => {
    const duplicate = allEmpty();
    duplicate[29] = { id: "q01", value: null };
    expect(validateSubmission({ answers: duplicate }).success).toBe(false);

    const unknown = allEmpty();
    unknown[29] = { id: "unknown", value: null };
    expect(validateSubmission({ answers: unknown }).success).toBe(false);

    expect(
      validateSubmission({ answers: allEmpty(), unexpected: true }).success
    ).toBe(false);
    expect(
      validateSubmission({
        answers: allEmpty().map((answer, index) =>
          index === 0 ? { ...answer, unexpected: true } : answer
        )
      }).success
    ).toBe(false);
  });

  it("نوع و گزینهٔ نامعتبر را رد می‌کند", () => {
    const wrongType = allEmpty();
    wrongType[25] = { id: "q26", value: "true" };
    expect(validateSubmission({ answers: wrongType }).success).toBe(false);

    const wrongChoice = allEmpty();
    wrongChoice[3] = { id: "q04", value: "z" };
    expect(validateSubmission({ answers: wrongChoice }).success).toBe(false);
  });

  it("پاسخ‌نامه را پیش از ارسال از API منتشر نمی‌کند", async () => {
    const response = GET();
    expect(response.status).toBe(405);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toMatch(/q01|acceptedAnswers|answerKey/);
  });

  it("API پاسخ نامعتبر را رد و نتیجهٔ معتبر را بدون کلید خصوصی برمی‌گرداند", async () => {
    const invalid = await POST(
      new Request("http://localhost/api/submit", {
        method: "POST",
        body: JSON.stringify({ answers: [] })
      })
    );
    expect(invalid.status).toBe(400);

    const valid = await POST(
      new Request("http://localhost/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allCorrect() })
      })
    );
    expect(valid.status).toBe(200);
    const payload = await valid.json();
    expect(payload.correct).toBe(30);
    expect(JSON.stringify(payload)).not.toMatch(/difficulty|acceptedAnswers|answerKey/);
  });
});

import { NextResponse } from "next/server";

import { gradeSubmission } from "@/lib/grading.server";
import { cssAnswerKeys } from "@/lib/questions/css.private.server";
import { cssQuestionSets } from "@/lib/questions/css.public";
import { validateSubmission } from "@/lib/validation";

const cssExams = {
  "css-part-1": { questions: cssQuestionSets["css-part-1"], keys: cssAnswerKeys["css-part-1"], subject: "CSS (بخش ۱)" },
  "css-part-2": { questions: cssQuestionSets["css-part-2"], keys: cssAnswerKeys["css-part-2"], subject: "CSS (بخش ۲)" }
} as const;

const MAX_BODY_BYTES = 100_000;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "حجم دادهٔ ارسالی بیش از حد مجاز است." },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "حجم دادهٔ ارسالی بیش از حد مجاز است." },
        { status: 413 }
      );
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "دادهٔ ارسالی JSON معتبر نیست." },
      { status: 400 }
    );
  }

  const examId = typeof body === "object" && body !== null && "examId" in body
    ? (body as { examId?: string }).examId
    : undefined;
  const cssExam = examId && examId in cssExams ? cssExams[examId as keyof typeof cssExams] : undefined;
  if (examId && !cssExam) {
    return NextResponse.json({ error: "شناسهٔ آزمون معتبر نیست." }, { status: 400 });
  }

  const validation = validateSubmission(body, cssExam?.questions);
  if (!validation.success) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  return NextResponse.json(gradeSubmission(validation.data.answers, cssExam?.questions, cssExam?.keys, cssExam?.subject), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, private"
    }
  });
}

export function GET() {
  return NextResponse.json(
    { error: "این مسیر فقط برای ثبت نهایی پاسخ‌هاست." },
    {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" }
    }
  );
}

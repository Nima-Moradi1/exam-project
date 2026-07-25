import { NextResponse } from "next/server";

import { gradeSubmission } from "@/lib/grading.server";
import { validateSubmission } from "@/lib/validation";

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

  const validation = validateSubmission(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  return NextResponse.json(gradeSubmission(validation.data.answers), {
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

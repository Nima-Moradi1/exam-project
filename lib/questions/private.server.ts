import "server-only";

import type { Difficulty } from "@/types/exam";

interface AnswerKeyItem {
  answer: string | boolean;
  acceptedAnswers?: readonly string[];
  difficulty: Difficulty;
  explanation: string;
}

export const answerKey: Readonly<Record<string, AnswerKeyItem>> = {
  q01: {
    answer: "<h1>",
    acceptedAnswers: ["h1", "<h1>", "<h1></h1>"],
    difficulty: "beginner",
    explanation: "h1 بالاترین سطح عنوان در ساختار عنوان‌های HTML است."
  },
  q02: {
    answer: "alt",
    acceptedAnswers: ["alt", "alt=\"\"", "alt=''"],
    difficulty: "beginner",
    explanation: "ویژگی alt متن جایگزین و توضیح کوتاه تصویر را فراهم می‌کند."
  },
  q03: {
    answer: "<a target=\"_blank\">",
    acceptedAnswers: [
      "<a target=\"_blank\">",
      "<a target='_blank'>",
      "a target=\"_blank\"",
      "a target='_blank'"
    ],
    difficulty: "advanced",
    explanation: "مقدار _blank برای target مقصد را در زمینهٔ مرور تازه باز می‌کند."
  },
  q04: {
    answer: "a",
    difficulty: "beginner",
    explanation: "HTML ساختار و معنای محتوای سند وب را تعریف می‌کند."
  },
  q05: {
    answer: "a",
    difficulty: "beginner",
    explanation: "عنصر p برای یک پاراگراف متن به‌کار می‌رود."
  },
  q06: {
    answer: "a",
    difficulty: "beginner",
    explanation: "br یک شکست خط در همان جریان متن ایجاد می‌کند."
  },
  q07: {
    answer: "a",
    difficulty: "beginner",
    explanation: "ol فهرست مرتب و معمولاً شماره‌دار می‌سازد."
  },
  q08: {
    answer: "a",
    difficulty: "beginner",
    explanation: "href مقصد پیوند را در عنصر a مشخص می‌کند."
  },
  q09: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "th سلول سرستون یا عنوان ردیف جدول است."
  },
  q10: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "type=email امکان اعتبارسنجی اولیهٔ قالب ایمیل را به مرورگر می‌دهد."
  },
  q11: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "for در label به id کنترل فرم اشاره می‌کند."
  },
  q12: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "main محتوای اصلی و متمایز سند را مشخص می‌کند."
  },
  q13: {
    answer: "a",
    difficulty: "advanced",
    explanation: "datalist پیشنهادها را ارائه می‌کند، اما ورودی آزاد را از کاربر نمی‌گیرد."
  },
  q14: {
    answer: "a",
    difficulty: "beginner",
    explanation: "اعلان doctype و عنصر ریشهٔ html آغاز استاندارد یک سند HTML5 هستند."
  },
  q15: {
    answer: "a",
    difficulty: "beginner",
    explanation: "محتوای نمایش‌دادنی سند در body قرار می‌گیرد."
  },
  q16: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "strong اهمیت معنایی دارد؛ b صرفاً توجه بصری را جلب می‌کند."
  },
  q17: {
    answer: "a",
    difficulty: "beginner",
    explanation: "دیدگاه HTML میان <!-- و --> نوشته می‌شود."
  },
  q18: {
    answer: "a",
    difficulty: "beginner",
    explanation: "src منبع یا نشانی فایل تصویر را تعیین می‌کند."
  },
  q19: {
    answer: "a",
    difficulty: "beginner",
    explanation: "هر قلم فهرست مرتب یا نامرتب با li ساخته می‌شود."
  },
  q20: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "controls یک ویژگی بولی روی audio و video است."
  },
  q21: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "fieldset کنترل‌های مرتبط فرم را به‌صورت معنایی گروه‌بندی می‌کند."
  },
  q22: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "action نشانی پردازش‌کنندهٔ داده‌های ارسالی فرم است."
  },
  q23: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "iframe یک زمینهٔ مرور تو‌در‌تو برای نمایش سند دیگر فراهم می‌کند."
  },
  q24: {
    answer: "a",
    difficulty: "intermediate",
    explanation: "id شناسهٔ یکتاست؛ یک class می‌تواند میان چند عنصر مشترک باشد."
  },
  q25: {
    answer: "a",
    difficulty: "advanced",
    explanation: "article برای محتوای مستقل است و header و section می‌توانند ساختار درونی آن را روشن کنند."
  },
  q26: {
    answer: true,
    difficulty: "beginner",
    explanation: "HTML ساختار محتوا را نشانه‌گذاری می‌کند و زبان برنامه‌نویسی نیست."
  },
  q27: {
    answer: true,
    difficulty: "beginner",
    explanation: "title از فراداده‌های سند است و در head قرار می‌گیرد."
  },
  q28: {
    answer: false,
    difficulty: "beginner",
    explanation: "hr یک شکست موضوعی یا جداکنندهٔ معنایی است، نه تصویر."
  },
  q29: {
    answer: true,
    difficulty: "intermediate",
    explanation: "alt جایگزین متنی تصویر است و برای دسترس‌پذیری اهمیت دارد."
  },
  q30: {
    answer: true,
    difficulty: "intermediate",
    explanation: "charset رمزگذاری نویسه‌های سند، مانند UTF-8، را مشخص می‌کند."
  }
};

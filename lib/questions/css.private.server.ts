import "server-only";

import type { Difficulty } from "@/types/exam";

const choiceAnswerIds = ["c", "a", "d", "b", "e", "f", "b", "d", "a", "c", "d", "b", "a", "c", "b", "d", "a", "c", "b", "d", "a", "b", "c", "d", "a"] as const;

export interface AnswerKeyItem {
  answer: string | boolean;
  acceptedAnswers?: readonly string[];
  difficulty: Difficulty;
  explanation: string;
}

function makeKey(
  prefix: string,
  descriptive: readonly [string, readonly string[], string][],
  choiceTopics: readonly string[],
  booleanAnswers: readonly boolean[],
  booleanTopics: readonly string[]
): Readonly<Record<string, AnswerKeyItem>> {
  const result: Record<string, AnswerKeyItem> = {};
  descriptive.forEach(([answer, acceptedAnswers, explanation], index) => {
    result[`${prefix}-${String(index + 1).padStart(2, "0")}`] = {
      answer,
      acceptedAnswers,
      difficulty: index > 2 ? "intermediate" : "beginner",
      explanation
    };
  });
  choiceTopics.forEach((topic, index) => {
    const number = index + 6;
    result[`${prefix}-${String(number).padStart(2, "0")}`] = {
      answer: choiceAnswerIds[index],
      difficulty: index > 14 ? "intermediate" : "beginner",
      explanation: `گزینهٔ نخست درست است؛ ${topic}`
    };
  });
  booleanAnswers.forEach((answer, index) => {
    result[`${prefix}-${String(index + 31).padStart(2, "0")}`] = {
      answer,
      difficulty: "intermediate",
      explanation: booleanTopics[index]
    };
  });
  return result;
}

export const cssPart1AnswerKey = makeKey(
  "css-1",
  [
    [".card", [".card", " .card "], "نقطه پیش از نام class می‌آید و همهٔ عناصر دارای آن class را انتخاب می‌کند."],
    ["#header", ["#header", " #header "], "علامت # انتخاب‌کنندهٔ id است و id باید در همان سند یکتا باشد."],
    ["padding", ["padding"], "padding فضای داخلی میان محتوای جعبه و border را کنترل می‌کند."],
    ["@font-face", ["@font-face", "font-face"], "با @font-face منبع یک فونت سفارشی معرفی می‌شود."],
    ["font-family", ["font-family"], "font-family خانوادهٔ فونت و مسیرهای جایگزین آن را تعیین می‌کند."]
  ],
  [
    "فایل خارجی CSS با link و rel=stylesheet به سند متصل می‌شود.",
    "فاصلهٔ خالی میان دو selector یعنی انتخاب descendant.",
    "margin خارج از border قرار می‌گیرد.",
    "cover ظرف را می‌پوشاند و ممکن است بخشی از تصویر برش بخورد.",
    "background-repeat رفتار تکرار پس‌زمینه را کنترل می‌کند.",
    "color رنگ foreground متن را تعیین می‌کند.",
    "sans-serif یک generic family و fallback امن است.",
    ":hover یک pseudo-class برای حالت اشاره‌گر است.",
    "selector ویژگی با [attribute=value] نوشته می‌شود.",
    "linear-gradient() برای تولید گرادیان خطی استفاده می‌شود.",
    "comment معتبر CSS میان /* و */ قرار می‌گیرد.",
    "id یکتا است؛ class را می‌توان روی چند عنصر تکرار کرد.",
    "> فقط فرزندان مستقیم را انتخاب می‌کند.",
    "border shorthand مشخصات border را در یک اعلان جمع می‌کند.",
    "border-box، padding و border را در width و height محاسبه می‌کند.",
    "margin فاصلهٔ بیرونی عنصر را تعیین می‌کند.",
    "background-image منبع تصویر پس‌زمینه است.",
    "لایه‌های متعدد پس‌زمینه با کاما از هم جدا می‌شوند.",
    "grayscale(100%) رنگ تصویر را حذف می‌کند.",
    "700 وزن رایج برای متن bold است.",
    "line-height ارتفاع خط و فاصلهٔ عمودی خطوط را کنترل می‌کند.",
    "text-decoration برای underline و سایر تزئین‌های متن است.",
    "::before محتوای تولیدی را پیش از محتوای عنصر قرار می‌دهد.",
    "^= آغاز مقدار یک attribute را بررسی می‌کند.",
    "ترتیب box model از داخل به خارج content، padding، border و margin است."
  ],
  [true, false, true, true, true, false, true, false, true, true],
  [
    "CSS زبان استایل‌دهی است، نه زبان برنامه‌نویسی عمومی.",
    "# برای id است؛ class با نقطه انتخاب می‌شود.",
    "padding میان content و border قرار دارد.",
    "no-repeat از کاشی‌شدن تصویر پس‌زمینه جلوگیری می‌کند.",
    "فهرست font-family برای fallback فونت مفید است.",
    "background-color رنگ پس‌زمینه را عوض می‌کند؛ رنگ متن color است.",
    ":hover برای واکنش بصری به قرارگرفتن نشانگر کاربرد دارد.",
    "margin بیرون border است.",
    "@font-face منبع فونت سفارشی را تعریف می‌کند.",
    "gradientها image تولید می‌کنند و در background-image قابل استفاده‌اند."
  ]
);

export const cssPart2AnswerKey = makeKey(
  "css-2",
  [
    ["rem", ["rem"], "rem بر اساس font-size عنصر ریشه محاسبه می‌شود."],
    ["display:flex", ["display:flex", "display: flex"], "display: flex عنصر را flex container می‌کند."],
    ["grid-template-columns", ["grid-template-columns"], "grid-template-columns ستون‌های یک grid container را تعریف می‌کند."],
    ["::placeholder", ["::placeholder", ":placeholder"], "::placeholder pseudo-element متن راهنمای کنترل را هدف می‌گیرد."],
    ["@media", ["@media", "media"], "قواعد شرطی واکنش‌گرا با @media نوشته می‌شوند."]
  ],
  [
    "vw یک درصد از عرض viewport است.",
    "relative جایگاه عادی را حفظ می‌کند و با offset جابه‌جا می‌شود.",
    "flex-direction جهت محور اصلی flex را تعیین می‌کند.",
    "space-between فضای خالی را میان آیتم‌ها پخش می‌کند.",
    ":focus حالت کنترل دارای تمرکز را انتخاب می‌کند.",
    "max-width سقف پهنای قابل‌نمایش را تعیین می‌کند.",
    "ویژگی width در media query عرض viewport را می‌سنجد.",
    "translateX() جابه‌جایی افقی transform است.",
    "@keyframes مراحل animation را تعریف می‌کند.",
    "transition-duration مدت تغییر نرم را تعیین می‌کند.",
    "rem به root و em به اندازهٔ فونت زمینه وابسته است.",
    "vh درصدی از ارتفاع viewport است.",
    "absolute نسبت به نزدیک‌ترین ancestor موقعیت‌دار قرار می‌گیرد.",
    "display:grid یک شبکهٔ دو‌بعدی می‌سازد.",
    "align-items روی محور cross، که در row پیش‌فرض عمودی است، اثر می‌گذارد.",
    "flex-wrap اجازهٔ شکستن آیتم‌ها به خط بعد را می‌دهد.",
    "1fr سهمی از فضای آزاد grid است و repeat آن را تکرار می‌کند.",
    ":checked وضعیت انتخاب‌شدهٔ checkbox و radio را هدف می‌گیرد.",
    "::placeholder متن hint کنترل فرم را استایل می‌دهد.",
    "max-width در media query برای دستگاه‌های کوچک‌تر کاربرد دارد.",
    "transition-property نام ویژگی‌های transition‌پذیر را مشخص می‌کند.",
    "scale() اندازهٔ transform را تغییر می‌دهد.",
    "transform-origin نقطهٔ مرجع چرخش، scale و دیگر transformهاست.",
    "animation-name نام keyframes متصل به عنصر است.",
    "infinite animation را بدون پایان تکرار می‌کند."
  ],
  [true, false, true, true, true, true, true, false, true, true],
  [
    "rem از اندازهٔ فونت root استفاده می‌کند.",
    "top و left روی position: static اثری ندارند.",
    "فرزندان مستقیم flex container به flex item تبدیل می‌شوند.",
    "justify-content روی محور اصلی اثر دارد.",
    "Grid برای مدیریت هم‌زمان ردیف و ستون طراحی شده است.",
    ":focus برای بازخورد تمرکز ورودی‌ها مناسب است.",
    "max-width محدودیت بالای عرض است و به طراحی واکنش‌گرا کمک می‌کند.",
    "media query برای viewport، چاپ و شرایط رسانه‌ای دیگر نیز به‌کار می‌رود.",
    "transition میان مقادیر یک property تغییر تدریجی می‌سازد.",
    "animation CSS با نام‌دادن به keyframes اجرا می‌شود."
  ]
);

export const cssAnswerKeys = {
  "css-part-1": cssPart1AnswerKey,
  "css-part-2": cssPart2AnswerKey
} as const;

import type { PublicQuestion } from "@/types/exam";

const six = (...labels: string[]) => labels.map((label, index) => ({ id: String.fromCharCode(97 + index), label }));
const four = (...labels: string[]) => six(...labels);
const booleanChoices = [
  { id: "true", label: "درست" },
  { id: "false", label: "نادرست" }
] as const;
const choiceAnswerIds = ["c", "a", "d", "b", "e", "f", "b", "d", "a", "c", "d", "b", "a", "c", "b", "d", "a", "c", "b", "d", "a", "b", "c", "d", "a"] as const;

type RawQuestion = readonly [string, string, (readonly string[])?];

function makeQuestions(prefix: string, groups: {
  descriptive: readonly RawQuestion[];
  dropdown: readonly RawQuestion[];
  multiple: readonly RawQuestion[];
  boolean: readonly RawQuestion[];
}): readonly PublicQuestion[] {
  const choicesWithCorrectAt = (labels: readonly string[], answerId: string) => {
    const values = [...labels.slice(1)];
    values.splice(answerId.charCodeAt(0) - 97, 0, labels[0]);
    return values;
  };
  const withId = (type: PublicQuestion["type"], items: readonly RawQuestion[], start: number) =>
    items.map(([text, placeholder, choices], index) => ({
      id: `${prefix}-${String(start + index).padStart(2, "0")}`,
      type,
      text,
      ...(type === "descriptive" ? { placeholder } : {}),
      ...(type === "dropdown" ? { choices: six(...choicesWithCorrectAt(choices ?? [], choiceAnswerIds[index])) } : {}),
      ...(type === "multiple-choice" ? { choices: four(...choicesWithCorrectAt(choices ?? [], choiceAnswerIds[index + 10])) } : {}),
      ...(type === "true-false" ? { choices: booleanChoices } : {})
    }));

  return [
    ...withId("descriptive", groups.descriptive, 1),
    ...withId("dropdown", groups.dropdown, 6),
    ...withId("multiple-choice", groups.multiple, 16),
    ...withId("true-false", groups.boolean, 31)
  ];
}

export const cssPart1Questions = makeQuestions("css-1", {
  descriptive: [
    ["برای انتخاب عنصری با class برابر card، انتخاب‌کنندهٔ CSS را بنویسید.", ".card"],
    ["برای انتخاب عنصر دارای id برابر header، انتخاب‌کنندهٔ CSS را بنویسید.", "#header"],
    ["نام ویژگی CSS مربوط به فاصلهٔ داخلی جعبه را بنویسید.", "padding"],
    ["برای اعلام یک فونت محلی با فایل woff2، نام قانون at-rule را بنویسید.", "@font-face"],
    ["نام ویژگی CSS برای تعیین خانوادهٔ فونت را بنویسید.", "font-family"]
  ],
  dropdown: [
    ["کدام روش برای نگه‌داشتن استایل در فایل جداگانه به‌کار می‌رود؟", "", ["تگ link با rel=stylesheet", "تگ script", "ویژگی action", "تگ meta", "تگ iframe", "ویژگی alt"]],
    ["کدام انتخاب‌کننده همهٔ عناصر p داخل .article را انتخاب می‌کند؟", "", [".article p", ".article + p", "p.article > *", "#article p", "article::p", "p, .article"]],
    ["در box model، کدام بخش بیرون از border قرار دارد؟", "", ["margin", "padding", "content", "outline", "width", "height"]],
    ["کدام مقدار background-size تصویر را طوری بزرگ می‌کند که کل ظرف پوشانده شود؟", "", ["cover", "contain", "repeat", "fixed", "center", "auto-fill"]],
    ["کدام ویژگی از تکرار تصویر پس‌زمینه جلوگیری می‌کند؟", "", ["background-repeat", "background-image", "background-color", "background-origin", "filter", "object-fit"]],
    ["برای تغییر رنگ متن از کدام ویژگی استفاده می‌شود؟", "", ["color", "font-color", "text-color", "foreground", "fill", "background"]],
    ["کدام generic font family انتخاب امنی برای متن sans-serif است؟", "", ["sans-serif", "system-font", "regular", "normal", "serif-only", "web-font"]],
    ["کدام pseudo-class هنگام قرارگرفتن نشانگر روی لینک فعال می‌شود؟", "", [":hover", "::before", ":visited-by", ":targeted", "@hover", ":focus-within-only"]],
    ["کدام selector فقط inputهایی با type=email را انتخاب می‌کند؟", "", ["input[type=\"email\"]", "input.email", "input::email", "input(email)", "#email input", "input[type-email]"]],
    ["برای ایجاد گرادیان خطی در background-image کدام تابع مناسب است؟", "", ["linear-gradient()", "radial-color()", "gradient-line()", "color-linear()", "background-gradient()", "fade()"]]
  ],
  multiple: [
    ["کدام نگارش یک comment معتبر CSS است؟", "", ["/* توضیح */", "<!-- توضیح -->", "// توضیح", "# توضیح"]],
    ["تفاوت اصلی class و id در انتخاب‌کننده‌ها چیست؟", "", ["id برای یک عنصر یکتا و class قابل‌تکرار است", "class همیشه اولویت بیشتری دارد", "id فقط در HTML کاربرد دارد", "class با # نوشته می‌شود"]],
    ["کدام selector فرزند مستقیم li از ul را انتخاب می‌کند؟", "", ["ul > li", "ul li", "ul + li", "ul ~ li"]],
    ["کدام ویژگی هر چهار سمت border را در یک اعلان تنظیم می‌کند؟", "", ["border", "border-all", "border-box", "outline"]],
    ["با box-sizing: border-box، width اعلام‌شده چه چیزی را شامل می‌شود؟", "", ["content، padding و border", "فقط content", "فقط margin", "content و margin"]],
    ["کدام ویژگی فاصلهٔ بیرونی عناصر مجاور را تعیین می‌کند؟", "", ["margin", "padding", "gap", "line-height"]],
    ["برای قراردادن تصویر در پس‌زمینه کدام ویژگی استفاده می‌شود؟", "", ["background-image", "image-source", "src", "background-src"]],
    ["کدام گزینه چند پس‌زمینه را به‌درستی جدا می‌کند؟", "", ["با کاما در background-image", "با + در background-image", "با دو تگ style", "ممکن نیست"]],
    ["وظیفهٔ filter: grayscale(100%) روی تصویر چیست؟", "", ["سیاه‌وسفید کردن تصویر", "شفاف‌کردن کامل", "بزرگ‌کردن تصویر", "گردکردن گوشه‌ها"]],
    ["کدام مقدار font-weight معمولاً متن ضخیم‌تر می‌سازد؟", "", ["700", "100", "0", "inherit-only"]],
    ["کدام ویژگی فاصلهٔ میان خطوط متن را کنترل می‌کند؟", "", ["line-height", "letter-spacing", "text-indent", "word-break"]],
    ["برای زیرخط‌برداشتن از لینک کدام ویژگی مناسب است؟", "", ["text-decoration", "font-style", "text-transform", "white-space"]],
    ["کدام pseudo-element محتوایی پیش از محتوای عنصر ایجاد می‌کند؟", "", ["::before", ":before-after", ":first", "::prepend"]],
    ["کدام selector، لینک‌هایی با href شروع‌شونده با https را انتخاب می‌کند؟", "", ["a[href^=\"https\"]", "a[href*=\"https\"]", "a[href$=\"https\"]", "a[href=\"https\"]"]],
    ["ترتیب صحیح بخش‌های اصلی box model از داخل به خارج چیست؟", "", ["content، padding، border، margin", "padding، content، margin، border", "content، border، padding، margin", "margin، border، padding، content"]]
  ],
  boolean: [
    ["CSS یک زبان برنامه‌نویسی عمومی نیست و برای استایل‌دهی صفحه به‌کار می‌رود.", ""],
    ["انتخاب‌کنندهٔ #menu همهٔ عناصر با class برابر menu را انتخاب می‌کند.", ""],
    ["padding بخشی از فضای داخلی میان content و border است.", ""],
    ["background-repeat: no-repeat از تکرار تصویر پس‌زمینه جلوگیری می‌کند.", ""],
    ["font-family می‌تواند فهرستی از فونت‌های جایگزین داشته باشد.", ""],
    ["رنگ متن با ویژگی background-color تعیین می‌شود.", ""],
    ["pseudo-class :hover می‌تواند برای حالت تعامل کاربر استفاده شود.", ""],
    ["margin به‌صورت پیش‌فرض داخل border عنصر قرار می‌گیرد.", ""],
    ["@font-face برای معرفی فونت سفارشی استفاده می‌شود.", ""],
    ["linear-gradient یک تصویر CSS است و می‌تواند مقدار background-image باشد.", ""]
  ]
});

export const cssPart2Questions = makeQuestions("css-2", {
  descriptive: [
    ["واحد نسبی وابسته به اندازهٔ فونت ریشه را بنویسید.", "rem"],
    ["برای ساخت یک flex container، نام ویژگی و مقدار لازم را بنویسید.", "display: flex"],
    ["نام ویژگی CSS برای تعیین ستون‌های Grid را بنویسید.", "grid-template-columns"],
    ["برای انتخاب placeholder یک input، pseudo-element را بنویسید.", "::placeholder"],
    ["نام قانون at-rule برای نوشتن media query را بنویسید.", "@media"]
  ],
  dropdown: [
    ["کدام واحد نسبت به عرض viewport محاسبه می‌شود؟", "", ["vw", "em", "rem", "px", "pt", "cm"]],
    ["کدام مقدار position عنصر را نسبت به محل عادی خود جابه‌جا می‌کند؟", "", ["relative", "static", "inherit", "visible", "block", "normal"]],
    ["در flexbox، کدام ویژگی محور اصلی را تعیین می‌کند؟", "", ["flex-direction", "align-items", "flex-wrap", "gap", "order", "z-index"]],
    ["کدام مقدار justify-content آیتم‌ها را در دو لبه پخش می‌کند؟", "", ["space-between", "stretch", "baseline", "column", "relative", "auto"]],
    ["برای فعال‌شدن استایل input هنگام تمرکز کاربر کدام pseudo-class به‌کار می‌رود؟", "", [":focus", ":hover", "::placeholder", ":checked", ":root", "@focus"]],
    ["کدام ویژگی بیشترین عرض مجاز عنصر را تعیین می‌کند؟", "", ["max-width", "width-max", "limit-width", "largest-width", "fit-width", "max-size"]],
    ["کدام media feature عرض viewport را می‌سنجد؟", "", ["width", "screen-width", "device", "resolution-only", "orientation-only", "layout"]],
    ["کدام تابع transform عنصر را در راستای x جابه‌جا می‌کند؟", "", ["translateX()", "moveX()", "positionX()", "shiftX()", "offsetX()", "slideX()"]],
    ["برای تعریف فریم‌های یک animation کدام at-rule استفاده می‌شود؟", "", ["@keyframes", "@frames", "@animate", "@transition", "@motion", "@steps"]],
    ["کدام ویژگی مدت اجرای transition را تعیین می‌کند؟", "", ["transition-duration", "animation-delay", "transform-time", "transition-name", "timing-duration", "duration"]]
  ],
  multiple: [
    ["تفاوت اصلی em و rem چیست؟", "", ["rem به اندازهٔ فونت ریشه و em به اندازهٔ فونت زمینه وابسته است", "هر دو همیشه بر اساس viewport هستند", "em مطلق و rem پیکسلی است", "هیچ تفاوتی ندارند"]],
    ["کدام واحد برای ارتفاع برابر با ارتفاع viewport مناسب است؟", "", ["vh", "vw", "rem", "%", "px"]],
    ["position: absolute معمولاً نسبت به چه چیزی موقعیت می‌گیرد؟", "", ["نزدیک‌ترین ancestor موقعیت‌دار", "همیشه body", "همیشه viewport", "عنصر قبلی"]],
    ["کدام مقدار display برای ساخت شبکهٔ دو‌بعدی مناسب است؟", "", ["grid", "inline", "block", "contents"]],
    ["برای هم‌تراز کردن آیتم‌های flex در محور عمودی پیش‌فرض از چه ویژگی استفاده می‌شود؟", "", ["align-items", "justify-content", "flex-grow", "order"]],
    ["کدام ویژگی اجازهٔ رفتن آیتم‌های flex به خط بعد را می‌دهد؟", "", ["flex-wrap", "flex-flow-only", "align-content", "white-space"]],
    ["در Grid، repeat(3, 1fr) چه مفهومی دارد؟", "", ["سه ستون با سهم برابر", "سه ردیف پیکسلی", "سه آیتم ثابت", "یک ستون سه‌برابری"]],
    ["کدام selector برای input تیک‌خورده مناسب است؟", "", ["input:checked", "input::check", "input[selected]", "input:focus"]],
    ["کدام pseudo-element متن راهنمای placeholder را هدف می‌گیرد؟", "", ["::placeholder", ":placeholder", "::input", ":hint"]],
    ["کدام شرط، قواعد را در viewportهای 768px و کمتر اجرا می‌کند؟", "", ["@media (max-width: 768px)", "@media width < 768", "@screen 768px", "@media (min-width: 768px)"]],
    ["کدام ویژگی تعیین می‌کند تغییر کدام خصوصیت transition داشته باشد؟", "", ["transition-property", "transition-delay", "animation-name", "transform-origin"]],
    ["کدام تابع transform عنصر را با ضریب 1.2 بزرگ می‌کند؟", "", ["scale(1.2)", "grow(1.2)", "size(1.2)", "zoom(1.2)"]],
    ["transform-origin چه چیزی را مشخص می‌کند؟", "", ["نقطهٔ مرجع transform", "مدت animation", "ترتیب لایه‌ها", "محور flex"]],
    ["کدام ویژگی نام animation تعریف‌شده در @keyframes را به عنصر متصل می‌کند؟", "", ["animation-name", "transition-name", "keyframes-name", "animation-key"]],
    ["کدام مقدار animation-iteration-count باعث تکرار بی‌پایان می‌شود؟", "", ["infinite", "forever", "repeat", "auto"]]
  ],
  boolean: [
    ["واحد rem به اندازهٔ فونت عنصر ریشه وابسته است.", ""],
    ["position: static به top و left پاسخ می‌دهد.", ""],
    ["display: flex فرزندان مستقیم عنصر را flex item می‌کند.", ""],
    ["justify-content در flexbox پیش‌فرض روی محور اصلی اثر می‌گذارد.", ""],
    ["CSS Grid برای چیدمان دو‌بعدی ردیف و ستون مناسب است.", ""],
    ["pseudo-class :focus می‌تواند برای نشان‌دادن کنترل فعال فرم استفاده شود.", ""],
    ["max-width می‌تواند از پهن‌شدن بیش از حد محتوا جلوگیری کند.", ""],
    ["media query فقط برای چاپ کاربرد دارد.", ""],
    ["transition برای تغییر نرم میان مقادیر یک ویژگی کاربرد دارد.", ""],
    ["برای animationهای CSS باید @keyframes تعریف شود.", ""]
  ]
});

export const cssQuestionSets = {
  "css-part-1": cssPart1Questions,
  "css-part-2": cssPart2Questions
} as const;

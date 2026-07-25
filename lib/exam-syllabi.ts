export interface ExamSyllabus {
  title: string;
  items: readonly string[];
}

export const htmlSyllabus: ExamSyllabus = {
  title: "سرفصل‌های آزمون HTML",
  items: [
    "ساختار استاندارد سند، head و متادیتا",
    "متن، عنوان‌ها، لینک‌ها، فهرست‌ها و تصویر",
    "جدول‌ها و عناصر چندرسانه‌ای",
    "فرم‌ها، کنترل‌های ورودی و اعتبارسنجی اولیه",
    "عناصر معنایی و دسترس‌پذیری محتوا",
    "iframe و سازمان‌دهی درست محتوای صفحه"
  ]
};

export const cssPart1Syllabus: ExamSyllabus = {
  title: "سرفصل‌های آزمون CSS — بخش ۱",
  items: [
    "معرفی CSS و راه‌اندازی فایل‌های استایل",
    "انتخاب‌کننده‌ها، class و id، attribute و pseudo",
    "Box Model، padding، margin، border و inheritance",
    "پس‌زمینه، رنگ، گرادیان، تصویر و filter",
    "فونت سفارشی، @font-face و font shorthand",
    "استایل متن، فاصله‌گذاری و text decoration"
  ]
};

export const cssPart2Syllabus: ExamSyllabus = {
  title: "سرفصل‌های آزمون CSS — بخش ۲",
  items: [
    "واحدهای مطلق و نسبی، em، rem، vw و vh",
    "display، Flexbox، Grid و position",
    "استایل فرم‌ها، placeholder، focus و validation",
    "طراحی واکنش‌گرا، min/max-width و media query",
    "Transform، rotate، scale و transform-origin",
    "Transition، timing و animation با @keyframes"
  ]
};

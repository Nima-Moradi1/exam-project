const examCardThemes = ["coral", "ocean", "violet", "gold", "mint", "plum"] as const;

export const difficultyLabels = {
  BEGINNER: "مقدماتی",
  ELEMENTARY: "پایه",
  INTERMEDIATE: "متوسط",
  UPPER_INTERMEDIATE: "بالاتر از متوسط",
  ADVANCED: "پیشرفته",
  EXPERT: "تخصصی"
} as const;

export const languageLabels: Record<string, string> = {
  fa: "فارسی",
  "fa-IR": "فارسی",
  en: "انگلیسی",
  "en-US": "انگلیسی",
  "en-GB": "انگلیسی"
};

export const examStatusLabels = {
  DRAFT: "پیش‌نویس",
  IN_REVIEW: "در حال بررسی",
  APPROVED: "تأییدشده",
  PUBLISHED: "منتشرشده",
  ARCHIVED: "بایگانی‌شده"
} as const;

export const questionTypeLabels = {
  SINGLE_CHOICE: "تک‌گزینه‌ای",
  MULTIPLE_CHOICE: "چندگزینه‌ای",
  TRUE_FALSE: "درست یا نادرست",
  DROPDOWN: "فهرست انتخاب",
  SHORT_TEXT: "پاسخ کوتاه",
  LONG_TEXT: "پاسخ تشریحی",
  NUMERIC: "عددی",
  ORDERING: "مرتب‌سازی",
  MATCHING: "تطبیقی"
} as const;

export const reviewStateLabels = {
  AUTOMATIC: "تصحیح خودکار",
  MANUAL: "بررسی دستی",
  AI_ASSISTED: "بررسی با کمک هوش مصنوعی"
} as const;

const faNumber = new Intl.NumberFormat("fa-IR");

export function formatNumber(value: number) {
  return faNumber.format(value);
}

export function formatDuration(durationSeconds: number) {
  const minutes = Math.ceil(durationSeconds / 60);
  return `${formatNumber(minutes)} دقیقه`;
}

export function formatPercent(value: number) {
  return `${formatNumber(value)}٪`;
}

export function getDifficultyLabel(value: string) {
  return difficultyLabels[value as keyof typeof difficultyLabels] ?? "تعیین‌نشده";
}

export function getLanguageLabel(value: string) {
  return languageLabels[value] ?? value;
}

export type ExamCardTheme = typeof examCardThemes[number];

function hash(value: string) {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function getExamCardTheme(slug: string, difficulty: string): ExamCardTheme {
  const ieltsThemes: Record<string, ExamCardTheme> = {
    BEGINNER: "mint",
    ELEMENTARY: "ocean",
    INTERMEDIATE: "coral",
    UPPER_INTERMEDIATE: "violet",
    ADVANCED: "gold",
    EXPERT: "plum"
  };
  return slug.startsWith("ielts-") ? ieltsThemes[difficulty] ?? "ocean" : examCardThemes[hash(slug) % examCardThemes.length] ?? "coral";
}

export function getCatalogCardTheme(slug: string): ExamCardTheme {
  return examCardThemes[hash(slug) % examCardThemes.length] ?? "coral";
}

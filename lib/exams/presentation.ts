const examCardThemes = ["coral", "ocean", "violet", "gold", "mint", "plum"] as const;

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

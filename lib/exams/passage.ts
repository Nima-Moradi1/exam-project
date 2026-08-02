export type QuestionPassage = {
  title: string;
  text: string;
};

const libraryPassage: QuestionPassage = {
  title: "Community library services",
  text: "The Riverside public library is a shared place where local people can access information, borrow materials, and study. Library membership is free, and visitors do not need to borrow a printed book to use the study spaces or digital resources.\n\nThe library has an online catalogue so users can locate materials before visiting. It also offers a quiet study room, screen-reader compatible computers, and evening workshops. The workshops were introduced because many adult learners are unavailable during the day. A new outreach service was designed to expand access for rural learners.\n\nLibrarians encourage visitors to compare reliable sources when researching a topic. This helps people make informed choices rather than relying on only one source."
};

function textSetting(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * `settings.passage` is the author-managed source of truth. The fallback keeps
 * the established seeded library-reading questions coherent for existing,
 * immutable attempt snapshots created before passages were introduced.
 */
export function getQuestionPassage(question: { prompt: string; settings: Record<string, unknown> }): QuestionPassage | null {
  const text = textSetting(question.settings, "passage");
  if (text) return { title: textSetting(question.settings, "passageTitle") ?? "متن مرتبط با پرسش", text };
  const prompt = question.prompt.toLowerCase();
  const librarySignals = ["public library", "library visitor", "rural learners", "study room", "evening workshops", "online catalogues", "library membership", "visual impairments", "reliable sources"];
  return librarySignals.some((signal) => prompt.includes(signal)) ? libraryPassage : null;
}

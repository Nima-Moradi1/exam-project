import { isEmptyAnswer, normalizeTextAnswer, toFiniteNumber } from "./normalization";
import type { AnswerStatus, AttemptGrade, GradeItem, GradingSnapshot } from "./types";

function sameSet(actual: string[], expected: string[]) {
  return actual.length === expected.length && new Set(actual).size === actual.length && actual.every((item) => expected.includes(item));
}

function matchedPairs(value: unknown, expected: Array<{ leftId: string; rightId: string }>) {
  const pairs = Array.isArray(value) ? value : [];
  const normalized = pairs.filter((pair): pair is { leftId: string; rightId: string } => Boolean(pair) && typeof pair === "object" && typeof (pair as { leftId?: unknown }).leftId === "string" && typeof (pair as { rightId?: unknown }).rightId === "string");
  return normalized.filter((pair) => expected.some((correct) => correct.leftId === pair.leftId && correct.rightId === pair.rightId)).length;
}

export function gradeQuestion(snapshotId: string, snapshot: GradingSnapshot, value: unknown): GradeItem {
  const maxPoints = snapshot.points;
  if (isEmptyAnswer(value)) return { snapshotId, status: "UNANSWERED", pointsAwarded: 0, maxPoints, normalizedAnswer: value ?? null };
  if (snapshot.type === "LONG_TEXT" || snapshot.gradingMode !== "AUTOMATIC") return { snapshotId, status: "PENDING_REVIEW", pointsAwarded: 0, maxPoints, normalizedAnswer: value };

  let ratio = 0;
  let normalizedAnswer: unknown = value;
  const settings = snapshot.settings;
  if (["SINGLE_CHOICE", "DROPDOWN"].includes(snapshot.type)) {
    ratio = typeof value === "string" && snapshot.correctOptionIds?.includes(value) ? 1 : 0;
  } else if (snapshot.type === "TRUE_FALSE") {
    const answer = value === true || value === "true";
    ratio = snapshot.correctBoolean === answer ? 1 : 0;
    normalizedAnswer = answer;
  } else if (snapshot.type === "MULTIPLE_CHOICE") {
    const answer = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    const correct = snapshot.correctOptionIds ?? [];
    if (sameSet(answer, correct)) ratio = 1;
    else if (settings.partialCredit === true && answer.length && new Set(answer).size === answer.length) {
      const correctSelections = answer.filter((item) => correct.includes(item)).length;
      const incorrectSelections = answer.length - correctSelections;
      ratio = Math.max(0, (correctSelections - incorrectSelections) / correct.length);
    }
    normalizedAnswer = answer;
  } else if (snapshot.type === "SHORT_TEXT") {
    const answer = typeof value === "string" ? normalizeTextAnswer(value, { caseSensitive: settings.caseSensitive === true, normalizePersian: settings.normalizePersian !== false }) : "";
    ratio = snapshot.acceptedAnswers?.some((accepted) => answer === normalizeTextAnswer(accepted, { caseSensitive: settings.caseSensitive === true, normalizePersian: settings.normalizePersian !== false })) ? 1 : 0;
    normalizedAnswer = answer;
  } else if (snapshot.type === "NUMERIC") {
    const answer = toFiniteNumber(value);
    const tolerance = typeof settings.tolerance === "number" ? settings.tolerance : 0;
    ratio = answer !== null && typeof snapshot.numericTarget === "number" && Math.abs(answer - snapshot.numericTarget) <= tolerance ? 1 : 0;
    normalizedAnswer = answer;
  } else if (snapshot.type === "ORDERING") {
    const answer = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    const expected = snapshot.ordering ?? [];
    if (sameSet(answer, expected) && answer.every((item, index) => item === expected[index])) ratio = 1;
    else if (settings.partialCredit === true && answer.length === expected.length) ratio = answer.filter((item, index) => item === expected[index]).length / expected.length;
    normalizedAnswer = answer;
  } else if (snapshot.type === "MATCHING") {
    const expected = snapshot.matchingPairs ?? [];
    const matches = matchedPairs(value, expected);
    ratio = matches === expected.length ? 1 : settings.partialCredit === true && expected.length ? matches / expected.length : 0;
    normalizedAnswer = value;
  }
  const pointsAwarded = Math.round(maxPoints * ratio);
  const status: AnswerStatus = ratio === 1 ? "CORRECT" : ratio > 0 ? "PARTIALLY_CORRECT" : "INCORRECT";
  return { snapshotId, status, pointsAwarded, maxPoints, normalizedAnswer };
}

export function gradeAttempt(items: Array<{ snapshotId: string; snapshot: GradingSnapshot; value: unknown }>): AttemptGrade {
  const graded = items.map((item) => gradeQuestion(item.snapshotId, item.snapshot, item.value));
  const automatic = graded.filter((item, index) => items[index]?.snapshot.gradingMode === "AUTOMATIC");
  const count = (status: AnswerStatus) => graded.filter((item) => item.status === status).length;
  const awardedPoints = automatic.reduce((total, item) => total + item.pointsAwarded, 0);
  const maxPoints = automatic.reduce((total, item) => total + item.maxPoints, 0);
  return {
    items: graded,
    awardedPoints,
    maxPoints,
    scorePercent: maxPoints ? Math.round((awardedPoints / maxPoints) * 10_000) / 100 : 0,
    correctCount: count("CORRECT"),
    incorrectCount: count("INCORRECT"),
    partialCount: count("PARTIALLY_CORRECT"),
    unansweredCount: count("UNANSWERED"),
    pendingReviewCount: count("PENDING_REVIEW")
  };
}

export function deterministicResultMessage(scorePercent: number, locale: string) {
  const messages = locale.startsWith("fa")
    ? ["به مرور بیشتری نیاز دارید؛ از پیشنهادهای آموزشی شروع کنید.", "پایهٔ خوبی دارید؛ نقاط ضعیف را هدف بگیرید.", "عملکرد بسیار خوب بود؛ برای تثبیت، پاسخ‌نامه را مرور کنید."]
    : ["You have a clear starting point; begin with the recommended resources.", "You have a solid foundation; focus on the weaker topics.", "Excellent work. Review the answer sheet to reinforce your learning."];
  return messages[scorePercent >= 80 ? 2 : scorePercent >= 50 ? 1 : 0];
}

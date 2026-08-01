import { describe, expect, it } from "vitest";

import { passwordHasRequiredStrength, normalizeEmail, normalizeUsername, signupSchema } from "@/lib/auth/schemas";
import { hasPermission } from "@/lib/auth/permissions";
import { canTransitionAttempt } from "@/lib/attempts/status";
import { resolveDirection } from "@/lib/exams/types";
import { gradeAttempt, gradeQuestion } from "@/lib/grading/grade-attempt";
import { normalizeTextAnswer } from "@/lib/grading/normalization";
import { selectDeterministicResources } from "@/lib/recommendations/deterministic";

describe("platform domain rules", () => {
  it("normalizes credentials and enforces strong signup passwords", () => {
    expect(normalizeUsername("  Nima_User ")).toBe("nima_user");
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
    expect(passwordHasRequiredStrength("Password1!")).toBe(true);
    expect(signupSchema.safeParse({ username: "nima_user", email: "person@example.com", password: "Password1!", confirmPassword: "Password1!", acceptedTerms: true }).success).toBe(true);
    expect(signupSchema.safeParse({ username: "Bad Name", email: "person@example.com", password: "weak", confirmPassword: "weak", acceptedTerms: true }).success).toBe(false);
  });

  it("keeps permissions centralized", () => {
    expect(hasPermission("USER", "exam:publish")).toBe(false);
    expect(hasPermission("CONTENT_MANAGER", "exam:publish")).toBe(true);
    expect(hasPermission("ADMIN", "audit:read")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "settings:manage")).toBe(true);
  });

  it("resolves direction by explicit choice and locale", () => {
    expect(resolveDirection("AUTO", "fa")).toBe("rtl");
    expect(resolveDirection("AUTO", "en")).toBe("ltr");
    expect(resolveDirection("RTL", "en")).toBe("rtl");
  });

  it("normalizes Persian text and grades choice, partial multi-choice, numeric and manual answers", () => {
    expect(normalizeTextAnswer(" يكي   از  كدها ")).toBe("یکی از کدها");
    const multi = gradeQuestion("one", { version: 1, type: "MULTIPLE_CHOICE", points: 4, negativePoints: 0, gradingMode: "AUTOMATIC", settings: { partialCredit: true }, correctOptionIds: ["a", "b"] }, ["a"]);
    expect(multi).toMatchObject({ status: "PARTIALLY_CORRECT", pointsAwarded: 2 });
    const numeric = gradeQuestion("two", { version: 1, type: "NUMERIC", points: 2, negativePoints: 0, gradingMode: "AUTOMATIC", settings: { tolerance: 0.1 }, numericTarget: 42 }, "42.05");
    expect(numeric.status).toBe("CORRECT");
    const result = gradeAttempt([{ snapshotId: "three", snapshot: { version: 1, type: "LONG_TEXT", points: 5, negativePoints: 0, gradingMode: "MANUAL", settings: {} }, value: "A thoughtful response" }]);
    expect(result.pendingReviewCount).toBe(1);
  });

  it("permits only documented attempt transitions", () => {
    expect(canTransitionAttempt("IN_PROGRESS", "ABANDONED")).toBe(true);
    expect(canTransitionAttempt("COMPLETED", "IN_PROGRESS")).toBe(false);
  });

  it("selects diverse curated resources for weak topics", () => {
    const resources = selectDeterministicResources([
      { id: "1", title: "Read", description: "", type: "ARTICLE", url: "https://example.com/read", locale: "en", topicIds: ["html"] },
      { id: "2", title: "Watch", description: "", type: "VIDEO", url: "https://example.com/watch", locale: "en", topicIds: ["html"] }
    ], [{ topicId: "html", incorrectCount: 2, unansweredCount: 1, availablePoints: 3, awardedPoints: 0 }], "en");
    expect(resources.map((resource) => resource.id)).toEqual(["1", "2"]);
  });

  it("falls back to locale-matching curated resources when an attempt has no tagged weak topics", () => {
    const resources = selectDeterministicResources([
      { id: "1", title: "English video", description: "", type: "VIDEO", url: "https://example.com/video", locale: "en", topicIds: [] },
      { id: "2", title: "Persian article", description: "", type: "ARTICLE", url: "https://example.com/article", locale: "fa", topicIds: [] }
    ], [], "fa");
    expect(resources.map((resource) => resource.id)).toEqual(["1", "2"]);
  });
});

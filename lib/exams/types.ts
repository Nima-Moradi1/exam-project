export type Direction = "AUTO" | "LTR" | "RTL";

export function resolveDirection(direction: Direction | null | undefined, locale: string | null | undefined, fallback: "ltr" | "rtl" = "rtl") {
  if (direction === "LTR") return "ltr";
  if (direction === "RTL") return "rtl";
  if (locale?.toLowerCase().startsWith("fa") || locale?.toLowerCase().startsWith("ar")) return "rtl";
  if (locale) return "ltr";
  return fallback;
}

export type PublicQuestionDto = {
  id: string;
  position: number;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "DROPDOWN" | "SHORT_TEXT" | "LONG_TEXT" | "NUMERIC" | "ORDERING" | "MATCHING";
  prompt: string;
  description: string | null;
  locale: string;
  direction: "ltr" | "rtl";
  points: number;
  isRequired: boolean;
  settings: Record<string, unknown>;
  options: Array<{ id: string; label: string; value: string }>;
};

export type PublicAttemptDto = {
  id: string;
  exam: { id: string; title: string; locale: string; direction: "ltr" | "rtl"; antiCheatMode: "OFF" | "WARN" | "STRICT" };
  status: "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "EXPIRED" | "ABANDONED" | "PENDING_REVIEW" | "CANCELLED";
  startedAt: string;
  expiresAt: string;
  warningCount: number;
  questions: PublicQuestionDto[];
  answers: Array<{ snapshotId: string; value: unknown; clientRevision: number }>;
};

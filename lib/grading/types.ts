export type SnapshotQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "DROPDOWN" | "SHORT_TEXT" | "LONG_TEXT" | "NUMERIC" | "ORDERING" | "MATCHING";
export type AnswerStatus = "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT" | "UNANSWERED" | "PENDING_REVIEW";

export type GradingSnapshot = {
  version: 1;
  type: SnapshotQuestionType;
  points: number;
  negativePoints: number;
  gradingMode: "AUTOMATIC" | "MANUAL" | "AI_ASSISTED";
  settings: Record<string, unknown>;
  correctOptionIds?: string[];
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  numericTarget?: number;
  ordering?: string[];
  matchingPairs?: Array<{ leftId: string; rightId: string }>;
  explanation?: string | null;
  modelAnswer?: string | null;
  topicIds?: string[];
};

export type GradeItem = {
  snapshotId: string;
  status: AnswerStatus;
  pointsAwarded: number;
  maxPoints: number;
  normalizedAnswer: unknown;
};

export type AttemptGrade = {
  items: GradeItem[];
  awardedPoints: number;
  maxPoints: number;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  unansweredCount: number;
  pendingReviewCount: number;
};

export type QuestionType =
  | "descriptive"
  | "dropdown"
  | "multiple-choice"
  | "true-false";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Choice {
  id: string;
  label: string;
}

export interface PublicQuestion {
  id: string;
  text: string;
  type: QuestionType;
  choices?: readonly Choice[];
  placeholder?: string;
}

export type AnswerValue = string | boolean | null;

export interface SubmittedAnswer {
  id: string;
  value: AnswerValue;
}

export interface ReviewItem {
  id: string;
  number: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  status: "correct" | "incorrect" | "unanswered";
  explanation?: string;
}

export interface GradeResult {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  message: string;
  review: ReviewItem[];
}

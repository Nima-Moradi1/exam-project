import { examAttempts } from "@/lib/db/schema";

type AttemptStatus = typeof examAttempts.$inferSelect["status"];

const transitions: Record<AttemptStatus, readonly AttemptStatus[]> = {
  IN_PROGRESS: ["SUBMITTED", "EXPIRED", "ABANDONED", "CANCELLED"],
  SUBMITTED: ["COMPLETED", "PENDING_REVIEW"],
  PENDING_REVIEW: ["COMPLETED"],
  COMPLETED: [],
  EXPIRED: [],
  ABANDONED: [],
  CANCELLED: []
};

export function canTransitionAttempt(from: AttemptStatus, to: AttemptStatus) {
  return transitions[from].includes(to);
}

export function assertAttemptTransition(from: AttemptStatus, to: AttemptStatus) {
  if (!canTransitionAttempt(from, to)) throw new Error(`Invalid attempt status transition: ${from} -> ${to}`);
}

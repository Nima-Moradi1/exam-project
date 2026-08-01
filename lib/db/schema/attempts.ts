import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { answerStatus, attemptStatus } from "./enums";
import { exams } from "./exams";
import { users } from "./users";

export const examAttempts = pgTable("exam_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "restrict" }),
  status: attemptStatus("status").notNull().default("IN_PROGRESS"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
  scorePoints: integer("score_points"),
  maxPoints: integer("max_points").notNull(),
  scorePercent: integer("score_percent"),
  correctCount: integer("correct_count").notNull().default(0),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  partialCount: integer("partial_count").notNull().default(0),
  unansweredCount: integer("unanswered_count").notNull().default(0),
  pendingReviewCount: integer("pending_review_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  durationUsedSeconds: integer("duration_used_seconds"),
  questionOrder: jsonb("question_order").notNull().$type<string[]>().default([]),
  optionOrder: jsonb("option_order").notNull().$type<Record<string, string[]>>().default({}),
  resultMessage: text("result_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("attempts_user_created_idx").on(table.userId, table.createdAt),
  index("attempts_user_status_idx").on(table.userId, table.status),
  index("attempts_exam_status_idx").on(table.examId, table.status),
  index("attempts_exam_created_idx").on(table.examId, table.createdAt),
  index("attempts_status_expires_idx").on(table.status, table.expiresAt)
]);

export const attemptQuestionSnapshots = pgTable("attempt_question_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "restrict" }),
  sourceQuestionId: uuid("source_question_id"),
  position: integer("position").notNull(),
  publicSnapshot: jsonb("public_snapshot").notNull().$type<Record<string, unknown>>(),
  gradingSnapshot: jsonb("grading_snapshot").notNull().$type<Record<string, unknown>>(),
  maxPoints: integer("max_points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("attempt_snapshots_attempt_position_unique").on(table.attemptId, table.position),
  index("attempt_snapshots_attempt_idx").on(table.attemptId)
]);

export const attemptAnswers = pgTable("attempt_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "restrict" }),
  snapshotId: uuid("snapshot_id").notNull().references(() => attemptQuestionSnapshots.id, { onDelete: "restrict" }),
  answer: jsonb("answer").notNull().$type<unknown>(),
  clientRevision: integer("client_revision").notNull().default(0),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  status: answerStatus("status"),
  pointsAwarded: integer("points_awarded"),
  graderNote: text("grader_note"),
  gradedByUserId: uuid("graded_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("attempt_answers_attempt_snapshot_unique").on(table.attemptId, table.snapshotId),
  index("attempt_answers_snapshot_idx").on(table.snapshotId)
]);

export const attemptTopicPerformance = pgTable("attempt_topic_performance", {
  attemptId: uuid("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "restrict" }),
  topicId: uuid("topic_id").notNull(),
  availablePoints: integer("available_points").notNull(),
  awardedPoints: integer("awarded_points").notNull(),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  unansweredCount: integer("unanswered_count").notNull().default(0)
}, (table) => [primaryKey({ columns: [table.attemptId, table.topicId] })]);

export const attemptWarningEvents = pgTable("attempt_warning_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "restrict" }),
  kind: varchar("kind", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("attempt_warnings_attempt_idx").on(table.attemptId, table.createdAt)]);

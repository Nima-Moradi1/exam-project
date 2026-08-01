import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { examDirection, gradingMode, questionType } from "./enums";
import { exams } from "./exams";
import { mediaAssets } from "./media";

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "restrict" }),
  type: questionType("type").notNull(),
  gradingMode: gradingMode("grading_mode").notNull().default("AUTOMATIC"),
  prompt: text("prompt").notNull(),
  description: text("description"),
  locale: varchar("locale", { length: 16 }),
  direction: examDirection("direction").notNull().default("AUTO"),
  points: integer("points").notNull().default(1),
  negativePoints: integer("negative_points").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  explanation: text("explanation"),
  modelAnswer: text("model_answer"),
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  settings: jsonb("settings").notNull().$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (table) => [index("questions_exam_sort_idx").on(table.examId, table.sortOrder)]);

export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: varchar("value", { length: 300 }).notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("question_options_question_value_unique").on(table.questionId, table.value),
  index("question_options_question_sort_idx").on(table.questionId, table.sortOrder)
]);

export const questionAcceptedAnswers = pgTable("question_accepted_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  answerNormalized: text("answer_normalized").notNull(),
  sortOrder: integer("sort_order").notNull().default(0)
}, (table) => [index("accepted_answers_question_sort_idx").on(table.questionId, table.sortOrder)]);

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  locale: varchar("locale", { length: 16 }).notNull().default("en"),
  parentId: uuid("parent_id").references((): AnyPgColumn => topics.id, { onDelete: "restrict" })
});

export const questionTopics = pgTable("question_topics", {
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  weight: real("weight").notNull().default(1)
}, (table) => [primaryKey({ columns: [table.questionId, table.topicId] })]);

export const examTopics = pgTable("exam_topics", {
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  weight: real("weight").notNull().default(1)
}, (table) => [primaryKey({ columns: [table.examId, table.topicId] })]);

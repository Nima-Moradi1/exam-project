import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { categories } from "./categories";
import { antiCheatMode, examDifficulty, examDirection, examStatus } from "./enums";
import { mediaAssets } from "./media";
import { users } from "./users";

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  title: varchar("title", { length: 220 }).notNull(),
  shortDescription: varchar("short_description", { length: 500 }).notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  learningObjectives: jsonb("learning_objectives").notNull().$type<string[]>().default([]),
  locale: varchar("locale", { length: 16 }).notNull().default("fa"),
  direction: examDirection("direction").notNull().default("AUTO"),
  difficulty: examDifficulty("difficulty").notNull().default("INTERMEDIATE"),
  status: examStatus("status").notNull().default("DRAFT"),
  durationSeconds: integer("duration_seconds").notNull(),
  passingScorePercent: integer("passing_score_percent").notNull().default(60),
  maxAttempts: integer("max_attempts"),
  retryCooldownMinutes: integer("retry_cooldown_minutes"),
  randomizeQuestionOrder: boolean("randomize_question_order").notNull().default(false),
  randomizeOptionOrder: boolean("randomize_option_order").notNull().default(false),
  showResultsImmediately: boolean("show_results_immediately").notNull().default(true),
  antiCheatMode: antiCheatMode("anti_cheat_mode").notNull().default("WARN"),
  coverAssetId: uuid("cover_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (table) => [
  index("exams_category_status_idx").on(table.categoryId, table.status),
  index("exams_status_published_idx").on(table.status, table.publishedAt)
]);

export const examOutlineItems = pgTable("exam_outline_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): AnyPgColumn => examOutlineItems.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("outline_exam_parent_sort_idx").on(table.examId, table.parentId, table.sortOrder)]);

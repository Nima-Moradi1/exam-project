import { boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { recommendationSource, resourceType } from "./enums";
import { mediaAssets } from "./media";
import { topics } from "./questions";
import { examAttempts } from "./attempts";
import { users } from "./users";

export const learningResources = pgTable("learning_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description").notNull(),
  type: resourceType("type").notNull(),
  url: text("url").notNull(),
  locale: varchar("locale", { length: 16 }).notNull().default("en"),
  minimumLevel: varchar("minimum_level", { length: 40 }),
  maximumLevel: varchar("maximum_level", { length: 40 }),
  imageAssetId: uuid("image_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("learning_resources_active_locale_idx").on(table.isActive, table.locale)]);

export const resourceTopics = pgTable("resource_topics", {
  resourceId: uuid("resource_id").notNull().references(() => learningResources.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  weight: real("weight").notNull().default(1)
}, (table) => [primaryKey({ columns: [table.resourceId, table.topicId] })]);

export const attemptRecommendations = pgTable("attempt_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "restrict" }),
  source: recommendationSource("source").notNull(),
  provider: varchar("provider", { length: 40 }),
  model: varchar("model", { length: 160 }),
  recommendationJson: jsonb("recommendation_json").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("attempt_recommendations_attempt_idx").on(table.attemptId, table.createdAt)]);

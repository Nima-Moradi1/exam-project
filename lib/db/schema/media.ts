import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { assetKind } from "./enums";
import { users } from "./users";

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: assetKind("kind").notNull(),
  storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
  storageKey: text("storage_key").notNull().unique(),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: integer("duration_seconds"),
  altText: text("alt_text").notNull(),
  uploadedByUserId: uuid("uploaded_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (table) => [index("media_assets_uploaded_by_idx").on(table.uploadedByUserId)]);

import { type AnyPgColumn, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { categoryStatus, examDirection } from "./enums";
import { mediaAssets } from "./media";
import { users } from "./users";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  description: text("description"),
  locale: varchar("locale", { length: 16 }).notNull().default("fa"),
  direction: examDirection("direction").notNull().default("AUTO"),
  status: categoryStatus("status").notNull().default("ACTIVE"),
  sortOrder: integer("sort_order").notNull().default(0),
  imageAssetId: uuid("image_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (table) => [
  uniqueIndex("categories_parent_slug_unique").on(table.parentId, table.slug),
  index("categories_parent_sort_idx").on(table.parentId, table.sortOrder),
  index("categories_status_idx").on(table.status)
]);

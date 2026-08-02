import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { examRequestStatus } from "./enums";
import { users } from "./users";

export const examRequests = pgTable("exam_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 180 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  level: varchar("level", { length: 80 }),
  description: text("description").notNull(),
  status: examRequestStatus("status").notNull().default("PENDING"),
  adminNote: text("admin_note"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("exam_requests_user_created_idx").on(table.userId, table.createdAt), index("exam_requests_status_created_idx").on(table.status, table.createdAt)]);

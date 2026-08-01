import { sql } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { userRole, userStatus } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  displayName: varchar("display_name", { length: 120 }),
  username: varchar("username", { length: 30 }),
  usernameNormalized: varchar("username_normalized", { length: 30 }),
  email: varchar("email", { length: 320 }).notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("USER"),
  status: userStatus("status").notNull().default("ACTIVE"),
  bio: text("bio"),
  preferredLocale: varchar("preferred_locale", { length: 16 }).notNull().default("fa"),
  timezone: varchar("timezone", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true })
}, (table) => [
  uniqueIndex("users_username_normalized_unique").on(table.usernameNormalized),
  uniqueIndex("users_email_normalized_unique").on(sql`lower(${table.email})`),
  index("users_status_idx").on(table.status),
  index("users_role_idx").on(table.role)
]);

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state")
}, (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] }), index("accounts_user_id_idx").on(table.userId)]);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull()
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull()
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

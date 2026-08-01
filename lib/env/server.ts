import "server-only";

import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalSecret = z.string().min(1).optional().or(z.literal(""));

export const aiProviderSchema = z.enum(["none", "openai", "google", "xai"]);

const serverEnvironmentSchema = z.object({
  DATABASE_URL: optionalUrl,
  DATABASE_URL_UNPOOLED: optionalUrl,
  DATABASE_URL_TEST: optionalUrl,
  AUTH_SECRET: optionalSecret,
  AUTH_GOOGLE_ID: optionalSecret,
  AUTH_GOOGLE_SECRET: optionalSecret,
  BLOB_READ_WRITE_TOKEN: optionalSecret,
  AI_PROVIDER: aiProviderSchema.default("none"),
  AI_MODEL: optionalSecret,
  OPENAI_API_KEY: optionalSecret,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalSecret,
  XAI_API_KEY: optionalSecret,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalSecret
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

/** Reads values lazily so static pages can build without external integrations. */
export function getServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    DATABASE_URL_TEST: process.env.DATABASE_URL_TEST,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    AI_PROVIDER: process.env.AI_PROVIDER ?? "none",
    AI_MODEL: process.env.AI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
  });
}

export function requireDatabaseUrl() {
  const url = getServerEnvironment().DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for database operations.");
  return url;
}

export function requireAuthSecret() {
  const secret = getServerEnvironment().AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required when authentication is used.");
  return secret;
}

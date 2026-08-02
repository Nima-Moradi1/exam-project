import { z } from "zod";

export const CANONICAL_HOSTNAME = "full-exam-project.vercel.app";
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOSTNAME}`;

const originSchema = z.string().url().transform((value) => new URL(value).origin);

/**
 * The single source of truth for absolute application URLs. Local development
 * may opt into its own origin; production always resolves to the canonical host
 * so preview and internal Vercel URLs cannot leak into metadata or share links.
 */
export function getAppOrigin() {
  if (process.env.VERCEL_ENV === "production") return CANONICAL_ORIGIN;
  const parsed = originSchema.safeParse(process.env.NEXT_PUBLIC_APP_URL);
  return parsed.success ? parsed.data : "http://localhost:3000";
}

export function appUrl(pathname = "/") {
  return new URL(pathname, `${getAppOrigin()}/`).toString();
}

export function isProductionIndexingEnabled() {
  return process.env.VERCEL_ENV === "production" && getAppOrigin() === CANONICAL_ORIGIN;
}

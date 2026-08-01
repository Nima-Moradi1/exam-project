import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { requireDatabaseUrl } from "@/lib/env/server";
import * as schema from "./schema";

export function getDb() {
  return drizzle({ client: neon(requireDatabaseUrl()), schema });
}

export type Database = ReturnType<typeof getDb>;

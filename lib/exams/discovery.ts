import { z } from "zod";

export const DISCOVERY_PAGE_SIZE = 12;

const value = z.string().trim().min(1).max(180);
const paramsSchema = z.object({
  q: value.optional(),
  path: z.union([value, z.array(value)]).optional(),
  level: z.union([value, z.array(value)]).optional(),
  topic: z.union([value, z.array(value)]).optional(),
  difficulty: z.union([value, z.array(value)]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  sort: z.enum(["newest", "title"]).catch("newest"),
  view: z.enum(["grid", "list"]).catch("grid")
});

export type DiscoveryFilters = {
  q: string;
  paths: string[];
  levels: string[];
  topics: string[];
  difficulties: string[];
  page: number;
  sort: "newest" | "title";
  view: "grid" | "list";
};

function list(input: string | string[] | undefined) {
  return [...new Set(input === undefined ? [] : Array.isArray(input) ? input : [input])];
}

export function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFKC")
    .replaceAll("ي", "ی")
    .replaceAll("ى", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDiscoveryParams(input: Record<string, string | string[] | undefined>): DiscoveryFilters {
  const parsed = paramsSchema.parse(input);
  return {
    q: normalizeSearchTerm(parsed.q ?? ""),
    paths: list(parsed.path),
    levels: list(parsed.level),
    topics: list(parsed.topic),
    difficulties: list(parsed.difficulty),
    page: parsed.page,
    sort: parsed.sort,
    view: parsed.view
  };
}

export function discoveryQuery(filters: DiscoveryFilters, overrides: Partial<DiscoveryFilters> = {}) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  for (const item of next.paths) params.append("path", item);
  for (const item of next.levels) params.append("level", item);
  for (const item of next.topics) params.append("topic", item);
  for (const item of next.difficulties) params.append("difficulty", item);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.view !== "grid") params.set("view", next.view);
  return params.toString();
}

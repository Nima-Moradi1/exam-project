const arabicToPersian: Record<string, string> = { "ي": "ی", "ك": "ک", "ى": "ی", "ة": "ه" };

export function normalizeTextAnswer(value: string, { caseSensitive = false, normalizePersian = true }: { caseSensitive?: boolean; normalizePersian?: boolean } = {}) {
  let normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (normalizePersian) normalized = normalized.replace(/[يك ىة]/g, (character) => arabicToPersian[character] ?? character).replace(/\s+/g, " ");
  return caseSensitive ? normalized : normalized.toLocaleLowerCase("en-US");
}

export function toFiniteNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isEmptyAnswer(value: unknown) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && !Array.isArray(value) && value !== null && Object.keys(value).length === 0);
}

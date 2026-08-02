import { getTableColumns, getTableName } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { CANONICAL_ORIGIN, appUrl, getAppOrigin, isProductionIndexingEnabled } from "@/lib/config/app-url";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { discoveryQuery, normalizeSearchTerm, parseDiscoveryParams } from "@/lib/exams/discovery";
import { inspectExamContent } from "@/lib/exams/content-quality";
import { formatDuration, formatNumber, getDifficultyLabel, getLanguageLabel } from "@/lib/exams/presentation";

const previousVercelEnvironment = process.env.VERCEL_ENV;
const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.VERCEL_ENV = previousVercelEnvironment;
  process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
});

describe("UX audit foundations", () => {
  it("normalizes Persian variants while preserving Latin technical terms", () => {
    expect(normalizeSearchTerm("  يک  Next.js  ")).toBe("یک Next.js");
    expect(normalizeSearchTerm("CI/CD")).toBe("CI/CD");
  });

  it("validates URL-backed discovery filters and reproduces them", () => {
    const filters = parseDiscoveryParams({ q: " HTML ", path: ["web", "web"], difficulty: "INTERMEDIATE", page: "2", sort: "title" });
    expect(filters).toMatchObject({ q: "HTML", paths: ["web"], difficulties: ["INTERMEDIATE"], page: 2, sort: "title" });
    expect(discoveryQuery(filters)).toBe("q=HTML&path=web&difficulty=INTERMEDIATE&page=2&sort=title");
    expect(parseDiscoveryParams({ page: "invalid", sort: "unknown" })).toMatchObject({ page: 1, sort: "newest" });
  });

  it("localizes every public enum and number format", () => {
    expect(getDifficultyLabel("UPPER_INTERMEDIATE")).toBe("بالاتر از متوسط");
    expect(getLanguageLabel("fa")).toBe("فارسی");
    expect(formatDuration(3_001)).toBe("۵۱ دقیقه");
    expect(formatNumber(1234)).toContain("۱");
  });

  it("rejects placeholder editorial content before review or publication", () => {
    const issues = inspectExamContent({ title: "html comprehensive exam", shortDescription: "توضیحات آزمون", description: "توضیحات آزمون", instructions: "", learningObjectives: [], durationSeconds: 30, passingScorePercent: 60, locale: "fa", categoryId: "category" });
    expect(issues.length).toBeGreaterThanOrEqual(5);
    expect(inspectExamContent({ title: "ارزیابی ساختار معنایی HTML", shortDescription: "توانایی انتخاب ساختار معنایی درست برای صفحه‌های واقعی را ارزیابی می‌کند.", description: "این آزمون سناریوهای ساختار سند، دسترس‌پذیری و فرم را با پرسش‌های متمایز پوشش می‌دهد.", instructions: "پیش از شروع اتصال خود را بررسی کنید.", learningObjectives: ["تشخیص عنصر معنایی مناسب"], durationSeconds: 1_800, passingScorePercent: 70, locale: "fa", categoryId: "category" })).toEqual([]);
  });

  it("uses one canonical production origin and safe local origins", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.example.com";
    expect(getAppOrigin()).toBe(CANONICAL_ORIGIN);
    expect(appUrl("/exams/html")).toBe(`${CANONICAL_ORIGIN}/exams/html`);
    expect(isProductionIndexingEnabled()).toBe(true);
    process.env.VERCEL_ENV = "preview";
    expect(getAppOrigin()).toBe("https://preview.example.com");
    expect(isProductionIndexingEnabled()).toBe(false);
  });

  it("maps Auth.js to the committed plural relations and expected adapter fields", () => {
    expect([users, accounts, sessions, verificationTokens].map(getTableName)).toEqual(["users", "accounts", "sessions", "verification_tokens"]);
    expect(Object.keys(getTableColumns(accounts))).toEqual(expect.arrayContaining(["userId", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at"]));
  });
});

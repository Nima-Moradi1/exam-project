import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function expectNoSeriousViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
}

test("خانه، landmark و skip link", async ({ page, browserName }) => {
  await page.goto("/");
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: "پرش به محتوای اصلی" })).toBeFocused();
  await expectNoSeriousViolations(page);
});

test("dialog فیلتر موبایل نام، فوکوس و بستن امن دارد", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile") && testInfo.project.name !== "narrow-chrome");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /^فیلترها/ });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoSeriousViolations(page);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("اعتبارسنجی فرم ورود نام‌ها و وضعیت قابل‌خواندن دارد", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/نام کاربری/)).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expectNoSeriousViolations(page);
});

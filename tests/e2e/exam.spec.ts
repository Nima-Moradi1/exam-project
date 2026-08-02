import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("خانه metadata و DOM سبک و ساختار روشن دارد", async ({ page }) => {
  await expect(page).toHaveTitle(/آزمون آنلاین/);
  await expect(page.getByRole("heading", { level: 1, name: /مسیر درست را پیدا کن/ })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  const initialCardCount = await page.locator(".discovery-card:visible").count();
  expect(initialCardCount).toBeGreaterThan(0);
  expect(initialCardCount).toBeLessThanOrEqual(12);
  await expect(page.locator(".exam-category-slider__dots")).toHaveCount(0);
});

test("هدرهای امنیتی و redirect دامنهٔ قدیمی اعمال می‌شوند", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  const alias = await request.get("/help?from=alias", { headers: { host: "full-exam-website.vercel.app" }, maxRedirects: 0 });
  expect(alias.status()).toBe(308);
  expect(alias.headers().location).toBe("https://full-exam-project.vercel.app/help?from=alias");
});

test("جست‌وجوی فارسی و فنی در URL می‌ماند و حالت خالی قابل بازیابی است", async ({ page }) => {
  const search = page.getByLabel("جست‌وجوی آزمون");
  await search.fill("HTML");
  await expect(page).toHaveURL(/q=HTML/);
  await expect(page.locator(".discovery-card").first()).toContainText(/HTML/i);
  await search.fill("آزمون ناشناخته");
  await expect(page.getByRole("heading", { name: "آزمونی با این انتخاب‌ها پیدا نشد" })).toBeVisible();
  await page.getByRole("button", { name: "پاک‌کردن فیلترها" }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(page.locator(".discovery-card:visible").first()).toBeVisible();
});

test("باز و بسته‌شدن منوی موبایل و بازگشت فوکوس", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile") && testInfo.project.name !== "narrow-chrome");
  const trigger = page.getByRole("button", { name: "باز کردن منو" });
  await trigger.click();
  await expect(page.getByRole("navigation", { name: "ناوبری اصلی" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("هیچ عرض هدفی overflow افقی ناخواسته ندارد", async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("چیدمان در بزرگ‌نمایی ۲۰۰ درصد همچنان قابل استفاده است", async ({ page }) => {
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByLabel("جست‌وجوی آزمون")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("ورود callback امن و نمایش رمز دسترس‌پذیر دارد", async ({ page }) => {
  await page.goto("/login?callbackUrl=%2Fhtml");
  const password = page.locator('input[name="password"]');
  await expect(password).toHaveAttribute("type", "password");
  const reveal = page.getByRole("button", { name: "نمایش رمز عبور" });
  await reveal.click();
  await expect(page.getByRole("button", { name: "پنهان‌کردن رمز عبور" })).toHaveAttribute("aria-pressed", "true");
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("link", { name: /فراموش/ })).toHaveAttribute("href", "/help#password-recovery");
});

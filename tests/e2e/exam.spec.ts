import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-attempt-ready")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-attempt-ready", "true");
    }
  });
  await page.goto("/");
});

test("شروع آزمون و پیمایش قبلی و بعدی", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /یک قدم تا تسلط بیشتر/ })).toBeVisible();
  await page.getByRole("button", { name: "شروع آزمون" }).click();
  await expect(page.getByRole("heading", { name: /بزرگ‌ترین عنوان/ })).toBeVisible();

  await page.getByRole("button", { name: "پرسش بعدی" }).click();
  await expect(page.getByRole("heading", { name: /متن جایگزین تصویر/ })).toBeVisible();

  await page.getByRole("button", { name: "پرسش قبلی" }).click();
  await expect(page.getByRole("heading", { name: /بزرگ‌ترین عنوان/ })).toBeVisible();
});

test("پاسخ‌دادن به هر چهار نوع پرسش", async ({ page }) => {
  await page.getByRole("button", { name: "شروع آزمون" }).click();

  await page.getByLabel("پاسخ شما").fill("<h1>");
  await expect(page.getByRole("button", { name: /پرسش ۱، پاسخ‌داده‌شده/ })).toBeVisible();

  await page.getByRole("button", { name: /پرسش ۴، بی‌پاسخ/ }).click();
  await page.getByLabel("پاسخ خود را انتخاب کنید").selectOption("a");
  await expect(page.getByRole("button", { name: /پرسش ۴، پاسخ‌داده‌شده/ })).toBeVisible();

  await page.getByRole("button", { name: /پرسش ۱۴، بی‌پاسخ/ }).click();
  await page.getByLabel("<!doctype html><html>…</html>").check();
  await expect(page.getByRole("button", { name: /پرسش ۱۴، پاسخ‌داده‌شده/ })).toBeVisible();

  await page.getByRole("button", { name: /پرسش ۲۶، بی‌پاسخ/ }).click();
  await page.getByRole("radio", { name: "درست", exact: true }).check();
  await expect(page.getByRole("button", { name: /پرسش ۲۶، پاسخ‌داده‌شده/ })).toBeVisible();
});

test("پاسخ و جایگاه فعلی پس از تازه‌سازی حفظ می‌شود", async ({ page }) => {
  await page.getByRole("button", { name: "شروع آزمون" }).click();
  await page.getByLabel("پاسخ شما").fill("<h1>");
  await page.getByRole("button", { name: /پرسش ۴، بی‌پاسخ/ }).click();
  await page.getByLabel("پاسخ خود را انتخاب کنید").selectOption("a");

  await page.reload();

  await expect(page.getByRole("heading", { name: /نقش اصلی HTML/ })).toBeVisible();
  await expect(page.getByLabel("پاسخ خود را انتخاب کنید")).toHaveValue("a");
  await page.getByRole("button", { name: /پرسش ۱، پاسخ‌داده‌شده/ }).click();
  await expect(page.getByLabel("پاسخ شما")).toHaveValue("<h1>");
});

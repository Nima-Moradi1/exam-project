import { expect, test } from "@playwright/test";

test("رگرسیون تصویری خانه در تم روشن", async ({ page }, testInfo) => {
  test.skip(!["chromium", "mobile-chrome"].includes(testInfo.project.name));
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page).toHaveScreenshot("home-light.png", { fullPage: true, animations: "disabled" });
});

test("رگرسیون تصویری خانه در تم تیره", async ({ page }, testInfo) => {
  test.skip(!["chromium", "mobile-chrome"].includes(testInfo.project.name));
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveScreenshot("home-dark.png", { fullPage: true, animations: "disabled" });
});

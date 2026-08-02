import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2048, height: 720 }, locale: "fa-IR" });
await page.goto("http://127.0.0.1:3004", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo({ top: 260, behavior: "instant" }));
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/exam-home-scrolled.png" });
await browser.close();

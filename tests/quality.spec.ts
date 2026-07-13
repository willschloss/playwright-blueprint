import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/site.config";

/**
 * Baseline page-quality signals that apply to any site: page load stays
 * within a soft budget, no uncaught JS errors fire, and no first-party
 * network request comes back 4xx/5xx during a normal page load. These catch
 * silent regressions (a broken bundle, a missing asset, a thrown exception)
 * that a purely functional test wouldn't necessarily notice.
 */
test.describe("Page quality", () => {
  test.skip(siteConfig.smokeRoutes.length === 0, "No routes configured in site.config.ts");

  for (const path of siteConfig.smokeRoutes) {
    test(`${path} loads within budget with no console errors or failed requests`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));
      page.on("response", (response) => {
        const sameOrigin = new URL(response.url()).origin === new URL(siteConfig.baseURL).origin;
        if (sameOrigin && response.status() >= 400) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      });

      const start = await test.step(`Navigate to ${path}`, async () => {
        const t0 = Date.now();
        await page.goto(path, { waitUntil: "load" });
        return t0;
      });

      await test.step(`Page loads within ${siteConfig.performance.loadBudgetMs}ms`, async () => {
        const elapsed = Date.now() - start;
        expect(elapsed, `page took ${elapsed}ms to load`).toBeLessThanOrEqual(siteConfig.performance.loadBudgetMs);
      });

      await test.step("No first-party requests failed", async () => {
        expect(failedRequests, failedRequests.join("\n")).toHaveLength(0);
      });

      await test.step("No uncaught console/page errors fired", async () => {
        expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
      });
    });
  }
});

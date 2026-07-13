import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/site.config";

/**
 * Baseline "is the site up" check. Every route in `siteConfig.smokeRoutes`
 * must respond successfully and render a non-empty title — the cheapest
 * possible signal that the page didn't 500 or return a blank shell. Run this
 * suite first; a failure here means downstream suites will fail for the same
 * reason and can be triaged as one incident.
 */
test.describe("Smoke", () => {
  for (const route of siteConfig.smokeRoutes) {
    test(`${route} responds and renders a page title`, async ({ page }) => {
      const response = await test.step(`Navigate to ${route}`, async () => {
        return page.goto(route);
      });

      await test.step("Response is successful", async () => {
        expect(response?.status(), `${route} returned an error status`).toBeLessThan(400);
      });

      await test.step("Document has a non-empty title", async () => {
        await expect(page).toHaveTitle(/.+/);
      });
    });
  }
});

import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/site.config";

/** Common breakpoints worth checking regardless of the site's own design system. */
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

/**
 * Layout-quality checks that apply to any responsive site: no horizontal
 * overflow (the most common "broken on mobile" symptom) at common
 * breakpoints, on every page configured for SEO/smoke checks so we get broad
 * coverage without a separate page list to maintain.
 */
test.describe("Responsive layout", () => {
  const pages = siteConfig.smokeRoutes.length > 0 ? siteConfig.smokeRoutes : siteConfig.seo.pagesToCheck;
  test.skip(pages.length === 0, "No pages configured in site.config.ts");

  for (const path of pages) {
    for (const viewport of VIEWPORTS) {
      test(`${path} has no horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await test.step(`Set viewport to ${viewport.name}`, async () => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
        });

        await test.step(`Navigate to ${path}`, async () => {
          await page.goto(path);
        });

        await test.step("Document width does not exceed the viewport width", async () => {
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(scrollWidth, "scrollWidth should not exceed clientWidth (no horizontal overflow)").toBeLessThanOrEqual(
            clientWidth + 1, // 1px tolerance for sub-pixel rounding
          );
        });
      });
    }
  }
});

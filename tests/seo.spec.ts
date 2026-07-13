import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/site.config";

/**
 * Baseline on-page SEO checks that apply to essentially any indexable page:
 * a present and reasonably sized <title>, a meta description, a viewport
 * meta tag (mobile indexing signal), a canonical link, and exactly one <h1>.
 * These read document head/meta tags directly rather than through a page
 * object, since they're a site-wide infrastructure check rather than a
 * feature interaction.
 */
test.describe("SEO basics", () => {
  test.skip(siteConfig.seo.pagesToCheck.length === 0, "No pages configured in site.config.ts");

  for (const path of siteConfig.seo.pagesToCheck) {
    test(`${path} has the expected meta tags and heading structure`, async ({ page }) => {
      await test.step(`Navigate to ${path}`, async () => {
        await page.goto(path);
      });

      await test.step("Title is present and under the configured length", async () => {
        const title = await page.title();
        expect.soft(title.length, "title is non-empty").toBeGreaterThan(0);
        expect.soft(title.length, `title under ${siteConfig.seo.maxTitleLength} chars`).toBeLessThanOrEqual(
          siteConfig.seo.maxTitleLength,
        );
      });

      await test.step("Meta description is present and non-empty", async () => {
        const description = page.locator('meta[name="description"]');
        // Check existence via count() first — count() never waits, whereas
        // getAttribute() on a tag that doesn't exist retries for the full
        // test timeout hoping it'll appear, turning a real "it's missing"
        // finding into a 30s hang instead of a fast, readable failure.
        const tagCount = await description.count();
        expect.soft(tagCount, "meta description tag present").toBeGreaterThan(0);
        if (tagCount > 0) {
          const content = await description.first().getAttribute("content");
          expect.soft(content?.trim().length ?? 0, "meta description non-empty").toBeGreaterThan(0);
        }
      });

      await test.step("Viewport meta tag is present (mobile indexing signal)", async () => {
        await expect.soft(page.locator('meta[name="viewport"]')).toHaveCount(1);
      });

      await test.step("Canonical link is present", async () => {
        await expect.soft(page.locator('link[rel="canonical"]')).toHaveCount(1);
      });

      await test.step("Exactly one <h1> on the page", async () => {
        await expect.soft(page.locator("h1")).toHaveCount(1);
      });
    });
  }
});

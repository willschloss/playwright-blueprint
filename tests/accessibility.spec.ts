import { test, expect } from "../fixtures/axeFixture";
import { siteConfig } from "../config/site.config";

/**
 * Automated accessibility sweep via axe-core. Tagged @a11y so CI can run it
 * on its own cadence if the full scan is too slow for every push. Any known,
 * accepted violation should be added to `config/site.config.ts`'s
 * `allowedViolations` with a comment explaining why, rather than silenced here.
 */
test.describe("Accessibility", () => {
  test.skip(siteConfig.accessibility.pagesToCheck.length === 0, "No pages configured in site.config.ts");

  for (const path of siteConfig.accessibility.pagesToCheck) {
    test(`${path} has no unresolved axe violations @a11y`, async ({ page, checkAccessibility }) => {
      await test.step(`Navigate to ${path}`, async () => {
        await page.goto(path);
      });

      await test.step("Run the axe accessibility scan", async () => {
        await checkAccessibility({
          testName: path,
          allowedViolations: siteConfig.accessibility.allowedViolations,
        });
      });
    });
  }
});

import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/site.config";
import { collectLinks, isLinkAlive } from "../helpers/linkChecker";

/**
 * Crawls the links actually rendered on each configured page and checks two
 * things any site cares about: no link points at a broken (4xx/5xx) URL, and
 * external links that open a new tab carry `rel="noopener"` so the opened
 * page can't reach back into this one (a common security/perf lint). This
 * intentionally reads the DOM directly rather than through a page object —
 * it's a site-wide infrastructure check, not a single feature interaction.
 */
test.describe("Links", () => {
  test.skip(siteConfig.linkCheck.pagesToCrawl.length === 0, "No pages configured in site.config.ts");

  for (const path of siteConfig.linkCheck.pagesToCrawl) {
    test(`${path} has no broken links`, async ({ page, request }) => {
      const links = await test.step(`Collect links on ${path}`, async () => {
        await page.goto(path);
        return collectLinks(page, siteConfig.linkCheck.ignorePatterns);
      });

      await test.step("Every collected link responds without a 4xx/5xx status", async () => {
        const broken: string[] = [];
        for (const link of links) {
          const { ok, status } = await isLinkAlive(request, link.href);
          if (!ok) broken.push(`${link.href} (${status || "no response"}) — text: "${link.text}"`);
        }
        expect(broken, broken.join("\n")).toHaveLength(0);
      });
    });

    test(`${path} external links that open a new tab use rel="noopener"`, async ({ page }) => {
      const links = await test.step(`Collect links on ${path}`, async () => {
        await page.goto(path);
        return collectLinks(page, siteConfig.linkCheck.ignorePatterns);
      });

      await test.step("External, new-tab links declare noopener", async () => {
        const unsafe = links
          .filter((l) => l.isExternal && l.opensNewTab && !l.rel.includes("noopener"))
          .map((l) => `${l.href} — text: "${l.text}"`);
        expect(unsafe, unsafe.join("\n")).toHaveLength(0);
      });
    });
  }
});

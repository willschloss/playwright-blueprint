import { test, expect } from "@playwright/test";
import { HeaderPage } from "../pages/headerPage";
import { siteConfig } from "../config/site.config";

/**
 * Exercises the primary header navigation: each configured nav item is
 * visible and routes correctly, and the header collapses into a hamburger
 * menu on narrow viewports and restores on wide ones. Configure the items to
 * check (and the two viewports) in `config/site.config.ts` — add entries
 * there as new nav links ship, no test code changes needed.
 */
test.describe("Header navigation", () => {
  test.skip(siteConfig.nav.items.length === 0, "No nav items configured in site.config.ts");

  for (const item of siteConfig.nav.items) {
    test(`"${item.label}" nav link navigates to a URL containing "${item.path}"`, async ({ page }) => {
      const header = new HeaderPage(page);

      await test.step("Open the home page", async () => {
        await header.goto("/");
      });

      await test.step(`Click the "${item.label}" nav link`, async () => {
        await header.openNav(item.label);
      });

      await test.step("URL reflects the expected route", async () => {
        await expect(page).toHaveURL(new RegExp(item.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      });
    });
  }

  test("Navigation collapses to a hamburger menu on narrow viewports and restores on wide ones", async ({
    page,
  }) => {
    const header = new HeaderPage(page);
    const { desktopViewport, mobileViewport } = siteConfig.nav;

    await test.step("Desktop viewport — full nav visible, toggle hidden", async () => {
      await page.setViewportSize(desktopViewport);
      await header.goto("/");
      await expect(header.nav).toBeVisible();
      await expect(header.mobileMenuToggle).not.toBeVisible();
    });

    await test.step("Mobile viewport — hamburger toggle appears", async () => {
      await page.setViewportSize(mobileViewport);
      await expect(header.mobileMenuToggle).toBeVisible();
    });

    await test.step("Tapping the toggle reveals the nav", async () => {
      await header.openMobileMenu();
      await expect(header.nav).toBeVisible();
    });

    await test.step("Resizing back to desktop restores the full nav", async () => {
      await page.setViewportSize(desktopViewport);
      await expect(header.nav).toBeVisible();
      await expect(header.mobileMenuToggle).not.toBeVisible();
    });
  });
});

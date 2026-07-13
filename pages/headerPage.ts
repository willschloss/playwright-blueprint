import { Locator, Page } from "@playwright/test";

/**
 * Generic site header / primary navigation.
 *
 * Scoped to the `banner` landmark, which holds for the large majority of
 * marketing and app sites. Nav links are looked up directly off the header
 * rather than a `navigation` landmark — many real sites (triad.tech
 * included) render primary nav links as plain links in a wrapper `<div>`
 * with no `role="navigation"` ancestor, so requiring one made every lookup
 * silently match zero elements. If a target site doesn't expose `banner`
 * either, narrow `header` here — every test and other page object keeps
 * working unchanged.
 */
export class HeaderPage {
  constructor(private readonly page: Page) {}

  readonly header = this.page.getByRole("banner");
  /** The site logo/home link — assumed to be the first link in the header. */
  readonly logo = this.header.getByRole("link").first();
  /** The collapsed-nav toggle shown on narrow viewports. Matches common naming: "menu", "nav", "hamburger", "toggle". */
  readonly mobileMenuToggle = this.header.getByRole("button", { name: /menu|nav|hamburger|toggle/i });

  /** Returns the primary nav link with the given accessible name. */
  navLink(label: string): Locator {
    return this.header.getByRole("link", { name: label });
  }

  /** Navigates to a route and waits for the header to render. */
  async goto(path = "/") {
    await this.page.goto(path);
    await this.header.waitFor({ state: "visible" });
  }

  /**
   * Clicks a primary nav link by its accessible name. Opens the mobile menu
   * first if the link isn't currently visible (collapsed/narrow viewport).
   */
  async openNav(label: string) {
    const link = this.navLink(label);
    if (!(await link.isVisible())) {
      await this.mobileMenuToggle.click();
    }
    await link.click();
  }

  /** Opens the collapsed mobile navigation menu. */
  async openMobileMenu() {
    await this.mobileMenuToggle.click();
  }
}

import { Page } from "@playwright/test";

/**
 * Generic site footer.
 *
 * Scoped to the `contentinfo` landmark, which is the standard ARIA role for
 * a page footer across virtually any site.
 */
export class FooterPage {
  constructor(private readonly page: Page) {}

  readonly footer = this.page.getByRole("contentinfo");
  readonly links = this.footer.getByRole("link");

  async scrollIntoView() {
    await this.footer.scrollIntoViewIfNeeded();
  }

  /** Returns how many links the footer currently exposes. */
  async linkCount(): Promise<number> {
    return this.links.count();
  }
}

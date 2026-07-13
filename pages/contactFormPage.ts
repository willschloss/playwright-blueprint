import { Locator, Page } from "@playwright/test";
import { FormField } from "../config/site.config";

/**
 * Generic lead/contact form.
 *
 * Field lookups go through `getByLabel`, so this works against any form
 * whose inputs have proper `<label>`/`aria-label` associations — which is
 * both the most common markup and the accessible baseline every form should
 * meet. Field values and the submit button's accessible name are supplied by
 * `config/site.config.ts`, so this class never hardcodes site copy.
 */
export class ContactFormPage {
  constructor(private readonly page: Page) {}

  readonly form = this.page.locator("form").first();

  /** Returns the input for a given field label. */
  field(label: string): Locator {
    return this.form.getByLabel(label);
  }

  submitButton(name: string): Locator {
    return this.form.getByRole("button", { name });
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.form.waitFor({ state: "visible" });
  }

  /** Fills every configured field, leaving submission to the caller. */
  async fill(fields: FormField[]) {
    for (const { label, value } of fields) {
      await this.field(label).fill(value);
    }
  }

  async submit(submitButtonName: string) {
    await this.submitButton(submitButtonName).click();
  }
}

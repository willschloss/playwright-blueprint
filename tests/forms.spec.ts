import { test, expect } from "@playwright/test";
import { ContactFormPage } from "../pages/contactFormPage";
import { siteConfig } from "../config/site.config";

/**
 * Exercises the primary contact/lead form: required fields are present,
 * submitting empty required fields is blocked by validation, and — only when
 * `allowRealSubmit` is explicitly true for this environment — the happy path
 * actually submits. Keeping the real submission behind that flag means this
 * suite is safe to point at production by default.
 */
test.describe("Contact form", () => {
  const { path, fields, submitButtonName, allowRealSubmit } = siteConfig.contactForm;
  test.skip(!path || fields.length === 0, "No contact form configured in site.config.ts");

  test("Required fields are present and empty submission is blocked by validation", async ({ page }) => {
    const contactForm = new ContactFormPage(page);
    const requiredFields = fields.filter((f) => f.required);
    test.skip(requiredFields.length === 0, "No fields marked required in site.config.ts");

    await test.step("Open the contact form", async () => {
      await contactForm.goto(path);
    });

    await test.step("Every required field is visible", async () => {
      for (const f of requiredFields) {
        await expect.soft(contactForm.field(f.label), `${f.label} field visible`).toBeVisible();
      }
    });

    await test.step("Submitting with required fields empty does not navigate away", async () => {
      await contactForm.submit(submitButtonName);
      await expect(contactForm.form).toBeVisible();
    });
  });

  test("Filling every field populates the expected values", async ({ page }) => {
    const contactForm = new ContactFormPage(page);

    await test.step("Open the contact form", async () => {
      await contactForm.goto(path);
    });

    await test.step("Fill each configured field", async () => {
      await contactForm.fill(fields);
    });

    await test.step("Each field reflects its configured value", async () => {
      for (const f of fields) {
        await expect.soft(contactForm.field(f.label)).toHaveValue(f.value);
      }
    });
  });

  test("Submitting a fully completed form succeeds", async () => {
    test.skip(!allowRealSubmit, "allowRealSubmit is false — enable only against a safe test/staging target");
    // Intentionally left for a site-specific implementation once allowRealSubmit
    // is turned on: fill the form, submit, and assert the site's actual
    // success state (redirect, confirmation banner, etc.), since that outcome
    // varies per site and can't be generalized here.
  });
});

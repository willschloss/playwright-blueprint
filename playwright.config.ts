import { defineConfig, devices } from "@playwright/test";

try {
  // Optional — a fresh clone of this blueprint may not have a .env yet.
  process.loadEnvFile(".env");
} catch {
  // No .env present; PW_BASE_URL can still be set directly in the shell/CI.
}

/**
 * Playwright config for the test blueprint.
 *
 * Set PW_BASE_URL to point this at whichever site the blueprint has been
 * copied into. The rest of the per-site knobs (routes, nav items, form
 * fields, SEO/accessibility pages, ...) live in config/site.config.ts.
 */
const BASE_URL = process.env.PW_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  // Fail the build on CI if test.only is left in the source.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "Desktop Chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"] } },
    // If this site requires auth, add a "Setup" project that runs a
    // *.setup.ts file to log in and save storageState, then reference
    // storageState + dependencies: ["Setup"] on the projects above.
    // See triadtest's setup/auth.setup.ts for the reference pattern.
  ],
});

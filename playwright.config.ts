import { defineConfig, devices } from "@playwright/test";
import { siteConfig } from "./config/site.config";

try {
  // Optional — a fresh clone of this blueprint may not have a .env yet.
  process.loadEnvFile(".env");
} catch {
  // No .env present; PW_BASE_URL can still be set directly in the shell/CI.
}

/**
 * Playwright config for the test blueprint.
 *
 * baseURL comes from config/site.config.ts (which itself falls back to
 * PW_BASE_URL, then a hardcoded default) — that file is the single source of
 * truth for which site this suite targets. Don't hardcode a URL here too;
 * a second default here is exactly what caused baseURL to silently drift
 * back to localhost once PW_BASE_URL was unset.
 */
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
    baseURL: siteConfig.baseURL,
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

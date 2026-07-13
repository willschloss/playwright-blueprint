/**
 * Picks which site's settings are active for this test run, out of the
 * per-site files in config/sites/. Everything else in this repo — every page
 * object, fixture, and spec — imports `siteConfig` from *this* file and
 * never needs to know which real site it's pointed at.
 *
 * Switch sites with the SITE environment variable:
 *
 *   SITE=sunshine npm test      # test sunshinetechserv.com
 *   npm test                    # SITE unset -> defaults to "triad"
 *
 * or use the matching npm script (npm run test:triad / npm run test:sunshine).
 *
 * To add a new site, run:
 *
 *   npm run add-site -- --name <shortname> --url https://example.com
 *
 * which scaffolds config/sites/<name>.ts, registers it in the `sites` map
 * below, and adds a matching npm script — see README.md's "Testing multiple
 * sites" section for the full walkthrough.
 */

import { siteConfig as triad } from "./sites/triad";
import { siteConfig as sunshine } from "./sites/sunshine";

export * from "./sites/types";

const sites = { triad, sunshine };

const requested = process.env.SITE ?? "triad";

if (!(requested in sites)) {
  throw new Error(
    `Unknown SITE "${requested}" — available: ${Object.keys(sites).join(", ")}. ` +
      `Set SITE to one of those, or add config/sites/${requested}.ts and register it in config/site.config.ts.`,
  );
}

export const siteConfig = sites[requested as keyof typeof sites];

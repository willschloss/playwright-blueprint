# playwright-blueprint

A reusable, config-driven [Playwright](https://playwright.dev) test suite. It checks
things that show up on almost any website — header nav, footer, contact form, meta
tags, accessibility, responsive layout, broken links, console/network errors — so a
new Triad project can start with a working test suite on day one instead of writing
one from scratch.

Nothing in here hardcodes a specific site's copy, routes, or nav links — every test
reads its expectations from a config file (see "How it works" below), so pointing
this at a different site is a config change, not a rewrite.

Companion to [triadtest](../triadtest), a sibling repo that applies these same
conventions to one specific site in full — including an authenticated-flow setup
this generic blueprint doesn't ship by default (see step 4 under "Adding a new
site").

## Quick start

```bash
npm install
npx playwright install   # download the browser binaries (first time only)
npm run test:triad       # runs the full suite against triad.tech
```

`triad.tech` and `sunshinetechserv.com` are already configured (see `config/sites/`),
so there's nothing else to set up to see this run for real. `npm run report` opens
the HTML report from the last run.

## How it works

Every spec reads its expectations from **`config/site.config.ts`**, which picks one
file out of `config/sites/` based on the `SITE` environment variable:

```bash
npm run test:triad       # SITE=triad, tests triad.tech
npm run test:sunshine    # SITE=sunshine, tests sunshinetechserv.com
npm test                 # SITE unset -> defaults to "triad"
```

Each `config/sites/<name>.ts` holds one site's nav items, form fields, pages to check
for SEO/accessibility, link-crawl targets, and performance budget. Leave a section
empty and the corresponding suite `test.skip()`s itself with a reason instead of
failing — so a half-configured site still runs whatever suites *do* have config.

No page object, fixture, or spec in this repo hardcodes a site — they all import
`siteConfig` from `config/site.config.ts` and never know which real site is behind
it.

Each site's `baseURL` is a real URL baked into its config file, so no extra setup is
needed to test either site above. Only set `PW_BASE_URL` — copy `.env.example` to
`.env` and fill it in, or export it directly — when you need to override that
default, e.g. pointing CI at a staging environment instead of production.

## Adding a new site

```bash
npm run add-site <shortname> https://example.com
```

This scaffolds `config/sites/<name>.ts` with a `TODO` on every field, registers it in
the `sites` map in `config/site.config.ts`, and adds a matching `test:<name>` npm
script — the three mechanical steps that are easy to get subtly wrong by hand and
don't need a human to do at all. It deliberately does *not* guess at the site's real
nav links, form fields, or pages to check.

From there:

1. Open the new `config/sites/<name>.ts` and fill in every `TODO` by actually looking
   at the live site: `baseURL`, `smokeRoutes`, `nav.items`, `contactForm`,
   `seo.pagesToCheck`, `accessibility.pagesToCheck`, `linkCheck.pagesToCrawl`, and
   `performance.loadBudgetMs`. (Or ask an AI session with browser access to do it —
   this is how triad.tech and Sunshine's configs were filled in.)
2. Run it with `npm run test:<name>` (or `SITE=<name> npm test`) — the suites that
   now have config will run; the rest stay skipped.
3. If the header/footer/contact form markup doesn't match the generic ARIA-role
   assumptions in `pages/headerPage.ts`, `pages/footerPage.ts`, or
   `pages/contactFormPage.ts`, adjust the locator there — every spec that uses it
   updates automatically, for every site.
4. If the site needs authenticated tests, add a `setup/*.setup.ts` that logs in and
   saves `storageState`, then wire `dependencies: ["Setup"]` into the relevant
   projects in `playwright.config.ts`. See `triadtest/setup/auth.setup.ts` for the
   reference implementation.
5. As the site grows its own unique flows (checkout, dashboards, whatever isn't
   "generic"), add page objects and specs the normal way — this blueprint is a
   starting floor, not a ceiling.

## Running tests

```bash
npm test              # run all tests headless, both projects
npm run test:headed   # run with a visible browser
npm run test:ui       # interactive UI mode
npm run test:debug    # step through with the inspector
npm run test:a11y     # accessibility suite only
npm run report        # open the last HTML report
```

```bash
npx playwright test --project="Desktop Chrome"
npx playwright test tests/smoke.spec.ts
```

## Layout

```
config/site.config.ts   # picks the active site (via SITE env var) from config/sites/
config/sites/
  types.ts               # the SiteConfig shape every site file follows
  triad.ts                # triad.tech's settings
  sunshine.ts             # sunshinetechserv.com's settings
playwright.config.ts    # baseURL, browser matrix, reporters
pages/                   # generic, reusable page objects
  headerPage.ts          # nav landmark, logo, mobile toggle
  footerPage.ts           # contentinfo landmark, links
  contactFormPage.ts      # generic form fill/submit by label
fixtures/
  axeFixture.ts          # checkAccessibility fixture (axe-core)
helpers/
  linkChecker.ts         # link-collection + liveness check used by links.spec.ts
tests/
  smoke.spec.ts           # configured routes respond + render a title
  navigation.spec.ts      # desktop + mobile nav
  links.spec.ts           # broken-link crawl + safe external links
  forms.spec.ts           # contact form fields, validation, optional real submit
  seo.spec.ts             # title/description/canonical/viewport/H1
  accessibility.spec.ts   # axe scan, tagged @a11y
  responsive.spec.ts      # no horizontal overflow at common breakpoints
  quality.spec.ts         # load budget, console errors, failed requests
```

### Page Object conventions

Same rules as `triadtest`: one `Page`-suffixed class per file, all UI handles are
`readonly` Locators, a selector hierarchy of **role → label/text → test-id → CSS**,
assertions live in tests (not page objects), and a `goto()` that waits for a real
readiness signal. The `.claude/skills/` in this repo encode these rules for anyone
(or any Claude session) adding new page objects or specs later.

The SEO, accessibility, links, responsive, and quality suites are the deliberate
exception — they read the DOM/meta tags/network directly, because they're
site-wide infrastructure checks rather than single-feature interactions.

## CI

`.github/workflows/playwright.yml` runs the suite on push/PR and on a daily
schedule. Set the `PW_BASE_URL` repository/workflow variable to the environment
you want CI to target.

See [TESTS.md](TESTS.md) for what each suite checks and why, and
[FINDINGS.md](FINDINGS.md) for the latest run's results against the live site.
# playwright-blueprint

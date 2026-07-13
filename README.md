# playwright-blueprint

A reusable, config-driven [Playwright](https://playwright.dev) test blueprint. Every
suite in here tests something that shows up on almost any website — a header nav,
a footer, a contact form, meta tags, accessibility, responsive layout, broken links,
console/network errors — so a new Triad project can start with a working test suite
on day one instead of writing one from scratch.

Companion to [triadtest](../triadtest), which is the fully-built-out example of these
same conventions applied to one specific site.

## How this is different from a normal test repo

Nothing here hardcodes a site's copy or routes. Every spec reads its expectations
from **`config/site.config.ts`** — nav items, form fields, pages to check for SEO/a11y,
link-crawl targets, performance budget. Point that one file at a new site and the
suites that apply light up; leave a section empty and the corresponding suite
`test.skip()`s itself with a reason instead of failing.

## Setup

```bash
npm install
npx playwright install   # download the browser binaries (first time only)
cp .env.example .env     # then set PW_BASE_URL
```

## Adapting this to a new site

1. Edit **`config/site.config.ts`**: set `baseURL`, `smokeRoutes`, `nav.items`,
   `contactForm`, `seo.pagesToCheck`, `accessibility.pagesToCheck`, and
   `linkCheck.pagesToCrawl` to match the real site.
2. Run `npm test` — the suites that now have config will run; the rest stay skipped.
3. If the header/footer/contact form markup doesn't match the generic ARIA-role
   assumptions in `pages/headerPage.ts`, `pages/footerPage.ts`, or
   `pages/contactFormPage.ts`, adjust the locator there — every spec that uses it
   updates automatically.
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
config/site.config.ts   # the per-site knobs every suite reads from
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

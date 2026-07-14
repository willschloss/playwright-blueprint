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

## Testing multiple sites

`config/site.config.ts` no longer holds a site's settings directly — it picks
one out of `config/sites/` based on the `SITE` environment variable, so you
can keep more than one site's settings around instead of overwriting one every
time you point this at somewhere new:

```bash
npm run test:triad       # SITE=triad, tests triad.tech
npm run test:sunshine    # SITE=sunshine, tests sunshinetechserv.com
npm test                 # SITE unset -> defaults to "triad"
```

To add another site, run:

```bash
npm run add-site -- --name <shortname> --url https://example.com
```

This scaffolds `config/sites/<name>.ts` with a `TODO` on every field, wires it
into the `sites` map in `config/site.config.ts`, and adds a `test:<name>` npm
script — the three mechanical steps that are easy to get subtly wrong by hand
and don't need a human to do at all. It deliberately does *not* guess at the
site's real nav links, form fields, or pages to check — open the scaffolded
file and fill those in by actually looking at the live site (or ask an AI
session with browser access to do it, the way triad.tech and Sunshine's
configs were filled in). Nothing else in the repo — no page object, fixture,
or spec — needs to change; they all still just import `siteConfig` from
`config/site.config.ts` and never know which real site is behind it.

## Adapting this to a new site

1. Add a **`config/sites/<name>.ts`** (see above): set `baseURL`, `smokeRoutes`,
   `nav.items`, `contactForm`, `seo.pagesToCheck`, `accessibility.pagesToCheck`,
   and `linkCheck.pagesToCrawl` to match the real site.
2. Run it with `SITE=<name> npm test` — the suites that now have config will run; the rest stay skipped.
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

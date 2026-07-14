# What each test suite does

This project runs eight separate suites of automated checks (in `tests/`) against
whichever site is currently configured in `config/site.config.ts`. Each suite has
a different job. This document explains what each one checks, why it exists, and
what a failure in it actually means.

For a specific run's results, see [FINDINGS.md](FINDINGS.md).

## `smoke.spec.ts` — Smoke

**What it checks:** Every route listed in `siteConfig.smokeRoutes` loads
successfully (no server error) and the page has a non-empty `<title>`.

**Why it matters:** This is the cheapest, fastest possible "is the site up"
signal — the equivalent of checking a store's lights are on before checking
anything else. It's designed to run first: if a page is completely down, every
other suite will fail on that same page for the same underlying reason, so a
smoke failure lets you diagnose one incident instead of chasing a dozen
unrelated-looking failures.

## `navigation.spec.ts` — Header navigation

**What it checks:** Each link configured in `siteConfig.nav.items` is visible on
the home page and clicking it lands on the expected URL. Separately, it checks
that the header collapses into a hamburger/mobile menu on narrow screens and
restores the full menu on wide screens.

**Why it matters:** The main navigation is how visitors get anywhere on the
site. A broken nav link or a hamburger menu that doesn't open is a
site-breaking bug for real visitors, especially on mobile.

## `seo.spec.ts` — SEO basics

**What it checks**, per page in `siteConfig.seo.pagesToCheck`:
- A non-empty `<title>` under a configured max length
- A non-empty `<meta name="description">` tag
- A `<meta name="viewport">` tag (a signal to search engines that the page is
  mobile-friendly)
- A canonical `<link rel="canonical">` tag
- Exactly one `<h1>` heading on the page

**Why it matters:** These are baseline signals search engines use to understand
and rank a page. Missing them doesn't crash anything for a visitor, but it can
mean the page ranks worse in search results, shows a poor preview when shared,
or gets flagged for duplicate/thin content. These checks use "soft" assertions,
meaning a page missing three of the five things reports all three in one
failure instead of stopping at the first.

## `accessibility.spec.ts` — Accessibility

**What it checks:** Runs an automated accessibility scanner (axe-core, an
industry-standard tool) against each page in
`siteConfig.accessibility.pagesToCheck`, tagged `@a11y` so it can be run on its
own schedule if the full suite is too slow to run on every push.

**Why it matters:** Flags things like missing landmark regions (e.g. no
`<main>`), missing heading structure, and insufficient color contrast — issues
that make a site hard or impossible to use for people relying on screen readers
or with low vision. Known, accepted exceptions get added to
`allowedViolations` in `config/site.config.ts` with a comment explaining why,
rather than being silently ignored.

## `links.spec.ts` — Links

**What it checks:** Crawls every link actually rendered on each page in
`siteConfig.linkCheck.pagesToCrawl` and checks two things: no link points to a
broken (4xx/5xx) URL, and any external link that opens in a new tab carries
`rel="noopener"`.

**Why it matters:** Broken links are a direct, visible bad experience for
visitors and a negative SEO signal. Missing `rel="noopener"` on new-tab
external links is a small but real security gap — without it, the page you
link to can, in some browsers, manipulate the tab you linked *from*.

## `forms.spec.ts` — Contact form

**What it checks:** That every field marked `required` in
`siteConfig.contactForm` is visible, that submitting the form with required
fields empty is blocked by validation (doesn't navigate away), and that filling
every configured field reflects the expected values. A real, end-to-end
submission only runs if `allowRealSubmit` is explicitly turned on for that
site — off by default so this suite is safe to run against a live production
site without spamming it with test leads.

**Why it matters:** For a marketing site, the contact/lead form is often the
entire point of the page existing. A broken form directly costs the business
leads, and this suite skips itself cleanly (with a clear reason) if the form
hasn't been configured yet in `site.config.ts`.

## `responsive.spec.ts` — Responsive layout

**What it checks:** At three common screen sizes (mobile 375×812, tablet
768×1024, desktop 1280×800), each page confirms its content doesn't spill
wider than the viewport (no horizontal scrollbar).

**Why it matters:** Horizontal overflow is the most common symptom of a page
that "looks broken on mobile" — text or images pushing past the edge of the
screen, forcing visitors to scroll sideways to read anything.

## `quality.spec.ts` — Page quality

**What it checks:** For each route in `siteConfig.smokeRoutes`: the page loads
within a configured time budget, no first-party network request comes back
4xx/5xx during a normal load, and no uncaught JavaScript error fires in the
browser console.

**Why it matters:** These catch silent regressions a purely functional test
wouldn't notice — a broken JS bundle, a missing image or script, a thrown
exception that doesn't visibly break the page but indicates something is wrong
under the hood. Third-party scripts (ads, embedded widgets, analytics) can
occasionally throw errors outside the site's own control — see
[FINDINGS.md](FINDINGS.md) for a real example of this on the contact page.

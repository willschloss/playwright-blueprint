# Findings — triad.tech, 2026-07-14

This is a plain-language writeup of what the CI pipeline (see [README.md](README.md#ci))
found when it ran the full suite against `https://triad.tech` on 2026-07-14, in
GitHub Actions run [`b807b9f`](https://github.com/willschloss/playwright-blueprint/actions).
Each item below traces back to the test suite that caught it — see
[TESTS.md](TESTS.md) for what each suite is generally checking and why.

**Result: 97 passed, 12 failed, 1 flaky, 6 skipped.** Every failure is a real,
reproducible issue on the live site — nothing here is a bug in the test code
itself. Pages checked: `/`, `/services`, `/contact` (both desktop and mobile
viewports).

## SEO findings — `seo.spec.ts`

All three checked pages (`/`, `/services`, `/contact`) are missing the same
three things:

| Check | Result |
|---|---|
| `<title>` present and reasonable length | ✅ Pass |
| `<meta name="description">` present | ❌ Missing on all 3 pages |
| `<meta name="viewport">` present | ✅ Pass |
| Canonical `<link rel="canonical">` present | ❌ Missing on all 3 pages |
| Exactly one `<h1>` on the page | ❌ Missing on all 3 pages (zero found, not just miscounted) |

**Why this matters:** A meta description is the snippet of text search engines
show under the page title in results — without one, Google generates its own
(often an awkward auto-selected chunk of text), and social shares/link
previews may show nothing useful. A canonical link tells search engines which
URL is the "real" one when a page is reachable multiple ways, preventing
duplicate-content penalties. A missing `<h1>` means there's no clear single
heading marking what the page is actually about, both for search engines and
for screen reader users who navigate by heading structure.

## Accessibility findings — `accessibility.spec.ts`

Run via axe-core (industry-standard automated accessibility scanner) on the
same three pages, desktop and mobile. Recurring issues, all rated
**moderate** severity except color contrast:

- **No `<main>` landmark** (`landmark-one-main`) — the page has no element
  marking where its main content begins, which matters for screen-reader
  users who jump straight to content via a "skip to main" shortcut.
- **No `<h1>`** (`page-has-heading-one`) — same missing heading as the SEO
  finding above; it's a double hit because it affects both rankings and
  accessibility.
- **Content not wrapped in landmark regions** (`region`) — between 6 and 11
  sections of content per page fall outside any semantic landmark (`<main>`,
  `<nav>`, `<header>`, `<footer>`, etc.), meaning assistive tech has no way
  to let a user jump between sections of the page.
- **Heading levels skip a step** (`heading-order`, found on `/services`) — an
  `<h3>` appears without a preceding `<h2>` in that section, which breaks the
  logical outline screen reader users rely on.
- **Insufficient color contrast** (`color-contrast`, **serious**, found on
  mobile viewports) — light gray text (`#c5c5c5`) on a white background
  measured a contrast ratio of **1.72:1** against a required minimum of
  **3:1–4.5:1** depending on text size. This affects a large heading, a
  testimonial name, and a testimonial title/role — practically invisible for
  many low-vision users.

None of these are one-off flukes — they repeated consistently across retries
and both viewports, and none are in `config/site.config.ts`'s
`allowedViolations` list (the place accepted, understood exceptions belong).

## Everything else

- **Navigation, links, forms, responsive layout, page-load quality:** all
  passed cleanly. No broken links, no dead nav routes, no horizontal
  scroll-overflow on mobile/tablet/desktop, no first-party 4xx/5xx requests,
  no page exceeding the load-time budget.
- **One flaky (not a real bug):** `/contact` occasionally logs a CORS error
  from Pipedrive's own CDN (`cdn.was-1.pipedriveassets.com`) — a third-party
  script issue outside this site's control. It passed on retry; CI's built-in
  retry logic already absorbs this correctly, and it isn't something worth
  chasing further.

## Bottom line

The CI pipeline is doing its job: `triad.tech` is missing a meta description,
canonical link, and `<h1>` on every page checked, and has several
accessibility gaps (no landmark structure, one skipped heading level, and low
color contrast on some mobile text). These are content/markup fixes on the
live site itself, not anything wrong with this test repo. CI will keep
reporting these as failures — an accurate, honest signal — until they're
addressed on `triad.tech`.

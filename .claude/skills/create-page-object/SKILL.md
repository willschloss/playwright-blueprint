---
name: create-page-object
description: Generate a Playwright page object class from a live URL by automatically capturing the page's ARIA snapshot, then writing a class that follows strict best practices (semantic locators, parent-scoped chaining, verb-named action methods, assertions left in tests). Use this whenever the user wants to create, scaffold, or write a Playwright page object, POM, or page-object-model class for a page, screen, panel, dialog, table, or component — especially when they give a URL. Trigger even if the user just says "make a page object for this page" or "turn <url> into a POM" without naming the conventions.
---

# Create Page Object

Generate a single Playwright page object class from a **live URL**. The skill captures the
page's ARIA snapshot itself (roles + accessible names + structure), then writes a class that
conforms to the project's page-object best practices, so tests can speak the language of the
application instead of the DOM.

The full rubric lives in `references/page-object-best-practices.md`. **Read it before
generating** — it is the source of truth for naming, locator preference order, chaining,
nested-object grouping, action methods, base classes, and the assertions boundary.

## What the user provides

The primary argument is a **URL**. Everything else is optional and can be inferred or asked
for once the snapshot is in hand:

- **`url` (required)** — the page to capture (the app `baseURL` + path).
- **scope/name** — what unit this is (page, panel, dialog, table, component). Sets the class
  name (`PascalCase` + `Page`), file name (`camelCase`), and base-class choice. Inferable from
  the heading/route if not given.
- **workflows** — what users _do_ on the page ("fill the general tab, submit for approval").
  Action methods are intent and **cannot be inferred from DOM** — ask for these if absent.
- **conventions** — a sibling page object or base class to match, and the path-alias scheme.
- **auth** — path to a `storageState` JSON if the page requires login.

## Step 1 — Capture the ARIA snapshot automatically

Run the bundled capture script against the URL. It launches Playwright, navigates, and prints
the ARIA tree (role + accessible name, nested) — which maps almost 1:1 onto `getByRole`,
`getByLabel`, and `getByTestId` locators in the rubric's preferred order.

```bash
node scripts/capture-aria.mjs --url "<url>" --html
```

Useful flags:

- `--selector "<root>"` — scope to a component root (CSS or `role=table`) instead of the whole
  page. **Prefer this** for a single component — it keeps the snapshot focused and gives clean
  parent-scoped chaining.
- `--storage <path>` — authenticated session via a saved `storageState` JSON.
- `--wait "<selector>"` — wait for a readiness signal before capturing.
- `--reveal 'role=tab[name="Details"]; text=Show more'` — **click steps run before the
  snapshot** to expose interaction-dependent content. This matters: `ariaSnapshot()` only sees
  currently rendered, visible nodes, so tabs, dialogs, menus, and lazy rows are invisible
  unless revealed. Use this to capture the dynamic/indexed elements the rubric's §7 covers.
- `--html` — also dump the scoped root's `outerHTML`, giving exact nesting and the test-id
  scheme for chaining.

Prerequisites: the project must have `@playwright/test` installed; if browsers are missing,
run `npx playwright install chromium`. If the script can't reach the URL (network/auth), say
so and fall back to asking the user to paste an ARIA snapshot, codegen output, or HTML.

### One snapshot is rarely the whole page

A single page-load snapshot captures the base state only. Before generating, decide whether
the page has interaction-dependent regions (tabs, dialogs, expandable rows, menus). If so,
either re-run capture with `--reveal` steps for each, or note them explicitly as gaps for the
user. Don't invent locators for elements you never saw rendered.

## Step 2 — Generate the class

From the captured snapshot(s), produce one `.ts` file: one class, one export, named per the
rubric. **Never invent selectors** — if the snapshot doesn't reveal a stable role, label, or
test-id for an element, flag it rather than guessing. Apply, in priority order, the practices
in `references/page-object-best-practices.md`:

- Inject `page` as `private readonly` via the constructor; no fixtures, globals, or singletons.
- Declare elements as `readonly` lazy locators named for _what they are_, not how they're found.
- Use the locator preference order (role → label/placeholder → text → test-id → CSS last). The
  ARIA snapshot gives roles and names directly; map them straight to `getByRole({ name })`.
- Chain child locators off their parent region (the snapshot's nesting shows you the parents);
  group related locators into nested objects.
- Expose dynamic/indexed/row-dependent elements via methods that take parameters with defaults.
- Encapsulate multi-step workflows as verb-named `async` action methods (`select*`, `fill*`,
  `goto*`); compose larger flows from smaller ones.
- **Keep assertions in tests**, except a true action-invariant (e.g. a navigation helper
  verifying it landed on the right record).
- Type the public surface with literal unions for "pick one of these" parameters; default
  optionals.
- For shared UI, choose composition or an abstract base class per the rubric; don't have one
  feature page object reference another.
- Prefer built-in auto-waiting; isolate any unavoidable bounded retry inside the method.
- Generate a `goto()` using the relative path (derived from the URL minus baseURL) that waits
  for a real readiness signal seen in the snapshot.
- Comment only what naming can't carry.

## Step 3 — Report assumptions and gaps

After the file, add a short note covering:

- **Assumptions** — scope/naming/convention choices inferred from the snapshot.
- **DOM gaps** — elements with no stable semantic locator, and the fallback used (a test-id you
  recommend adding, or a CSS selector flagged as last-resort).
- **Unrevealed regions** — interaction-dependent elements not captured (suggest the `--reveal`
  steps to capture them).
- **Missing action methods** — workflows you couldn't write because intent wasn't provided.

## Validation checklist

One class/one export/per file; `page` injected `private readonly`; elements are `readonly`
lazy locators named for what they are; locators prefer role/label/text/test-id over CSS; child
locators chained from parents; related locators grouped, dynamic via methods; action methods
verb-named; assertions in tests; `goto()` relative + waits for readiness; parameters typed with
unions and defaulted; shared UI via shared object or base class; no cross-feature dependency.

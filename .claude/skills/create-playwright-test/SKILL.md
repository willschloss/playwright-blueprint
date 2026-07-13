---
name: create-playwright-test
description: Write a Playwright test (spec) file that follows a strict set of best practices — drives the UI only through page objects, structures the flow with test.step(), uses web-first auto-retrying assertions, generates fresh faker data, arranges state via API and acts via the UI. Use this whenever the user wants to create, scaffold, or write a Playwright test, spec, e2e test, or test suite for a feature, screen, or user flow — especially when they describe the behavior to verify and which page object(s) the flow touches. Trigger even if the user just says "write a test for this flow" or "add a spec covering X" without naming the conventions.
---

# Create Playwright Test

Write a Playwright spec that reads like a description of user behavior and expected outcomes,
with every selector hidden behind a page object. The central rule: **tests speak the language
of the application; page objects speak the language of the DOM.** A test must contain no raw
selectors — all element access goes through page object properties and methods.

The full rubric lives in `references/testing-best-practices.md`, with the companion
`references/page-object-best-practices.md` describing the page objects this test will drive.
**Read the testing rubric before generating** — it defines suite structure, hooks, fixtures,
auth, assertions, data, network synchronization, and the API-arrange/UI-act pattern.

## Prerequisite: the test needs page objects

A test is only as good as the page objects it drives. Before writing, confirm which page
object(s) exist and expose the locators and action methods this flow needs. If a needed page
object (or method) is missing, surface that — the `create-page-object` skill produces them.
Don't paper over a missing page object by writing raw selectors in the test; that violates the
single most important rule.

## Step 1 — Gather context

Behavior, not DOM, drives a test. Collect these; ask for what's missing before generating.

1. **The user journey to verify (required).** The flow in plain language, as the sequence of
   things the user does and the outcomes that should follow. This becomes the `test.step()`
   structure and the title.

2. **Page object(s) the flow crosses (required).** Which page object classes the flow touches
   and their import paths/aliases. A flow that crosses screens instantiates multiple page
   objects in one test.

3. **Expected outcomes / assertions (required).** What must be true at each point — enabled/
   disabled states, visible elements, text content, counts, API response fields. Assertions
   are the documented intent of the test and live in the spec.

4. **Data strategy.** Which values should be fresh/random (faker), which are fixed
   business-meaningful constants, and whether a data factory exists to build the structured
   fixture.

5. **State setup.** Preconditions the test needs. Prefer arranging them via API data factories
   and acting only on the behavior under test through the UI. Note any entity IDs to capture
   from API responses for later assertions.

6. **Network synchronization points.** Actions that trigger an API call whose result the next
   step depends on, so the test can wait on that specific response rather than sleeping.

7. **Special handling.** Tags (`@a11y` etc.), `skip` conditions with reasons, per-test timeout
   overrides for genuinely long flows, a non-default identity, or whether to mock responses
   (UI-only test) vs. make real calls (true e2e).

If you have the journey, the page object, and the outcomes, that's enough to write a solid
first draft; the rest refines it.

## Step 2 — Generate the spec

Produce one `.spec.ts` file applying, per `references/testing-best-practices.md`:

- **No raw selectors.** Every element access goes through page object properties/methods.
- One top-level `test.describe()` named for the feature; intent-revealing behavioral test
  titles (not "test 1").
- Instantiate page objects per-test with `new PageClass(page)`; instantiate multiple when the
  flow crosses screens.
- Structure each test into named `test.step()` blocks that mirror the business flow; steps may
  return values into the enclosing scope.
- Use the right hook: `beforeEach` for fresh per-test data; `beforeAll` only for safe one-time
  work; `afterEach`/`afterAll` sparingly (prefer cleanup through the app's own delete flow,
  which doubles as coverage).
- Authenticate via shared stored state, not per-test login (unless the test specifically needs
  a different identity, contained to that test).
- Assert with web-first auto-retrying `expect(locator)` matchers (`toBeVisible`, `toBeEnabled`,
  `toHaveText`, `toHaveCount`, ...); use `expect.soft()` for multi-check sweeps.
- Generate unique faker data; express fixed domain values as named constants; pick randomly
  from option sets when any valid value works.
- Synchronize on the specific network response/event, never a fixed sleep; use `Promise.all`
  to arm a listener before the action fires.
- Arrange state via API factories, act through the UI; capture IDs from responses to assert on.
- Reserve custom fixtures for cross-cutting concerns (e.g. accessibility); don't fixture
  ordinary page objects.
- Mock responses only for UI-only tests; use real calls for true e2e.
- Organize imports by responsibility via path aliases.
- Comment intent (a block comment for non-obvious coverage), not mechanics.

## Step 3 — Report assumptions and gaps

After the file, add a short note covering:

- **Assumptions** — inferred data strategy, auth, or which page-object method maps to a step.
- **Missing page-object surface** — any locator or action method the test needs that the page
  object doesn't expose yet (so it can be added rather than worked around with a raw selector).
- **Open choices** — anything the user should confirm (mock vs. real, timeout, tags).

## Validation checklist

Before returning, confirm against the rubric's checklist: no raw selectors; page objects
instantiated per-test; one feature `describe` with behavioral titles; `test.step()` structure;
correct hook scope; auth via shared storage state; web-first auto-retrying assertions; unique
faker data with named constants; network-based synchronization (no sleeps); mock vs. real used
deliberately; tags/skip/timeout intentional; imports aliased by responsibility; state arranged
via API and acted through the UI.

# Playwright Testing Best Practices

These practices govern the *test* (spec) layer: how to structure suites, drive the application
through page objects, manage data, and assert outcomes. They assume a companion set of page
objects (see *Playwright Page Object Best Practices*) and are written to apply to any codebase.

The central rule that ties everything together: **tests speak the language of the application,
page objects speak the language of the DOM.** A test should read like a description of user
behavior and expected outcomes, with every selector hidden behind a page object.

---

## 1. Drive the UI through page objects — never raw selectors in tests

This is the most important practice. A test must not contain `page.locator('.btn')`,
`page.getByRole(...)`, or any other selector. All element access goes through page object
properties and methods.

```typescript
// Good — reads as intent; selectors are encapsulated.
await meetingPage.caseId.fill(caseId);
await meetingPage.selectLocationCode(locationCode);

// Avoid — a raw selector leaking into the test.
// await page.locator('[data-testid="case-id"]').fill(caseId);
```

The payoff: when markup changes, you fix one locator in one page object, not dozens of tests.

---

## 2. Instantiate page objects inside each test

Create page objects per-test with `new PageClass(page)`, using the `page` fixture Playwright
injects. Keep the instance local to the test. Instantiate **multiple** page objects in one test
when the flow crosses screens.

```typescript
test("Verify reports page info", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.reportsSideMenu.click();

  const reportsPage = new ReportsPage(page); // new screen → new page object
  await expect(reportsPage.resetButton).toBeEnabled();
});
```

- Per-test instantiation keeps tests isolated — no shared mutable state between tests.
- Don't reach for fixture-injected page objects by default; explicit construction keeps each
  test's dependencies visible. (Fixtures are reserved for cross-cutting concerns — see §6.)

---

## 3. One descriptive `describe` per feature; intent-revealing test titles

- Wrap each spec file in a single top-level `test.describe()` named for the feature or screen
  under test. Nest further only when a file genuinely covers sub-flows.
- Write test titles as specific behavioral statements, not vague labels.

```typescript
test.describe("Initial Meeting", () => {
  test("Validate review page when no staff, child, parent, or attendee info is provided", async ({ page }) => {
    /* ... */
  });
});
```

Prefer titles like *"Create an initial meeting with minimum required fields"* over
*"meeting test 1"*. The title is the first thing read when a test fails.

---

## 4. Structure every test with `test.step()`

Break each test into named steps that mirror the business flow. Steps produce readable trace
output, make failures pinpoint a phase, and can return values into the enclosing scope.

```typescript
const meetingId = await test.step("Review tab", async () => {
  await expect(meetingPage.meetingTabs.meetingInfoTab).toBeEnabled();
  const info = await clickAndGetAPIData(
    page, 201, "api/action/tdm-meeting-list/complete",
    meetingPage.saveAndCompleteButton.click(),
  );
  return info.request.data?.id;
});
```

- Name steps for what the user is doing ("Fill general tab", "Submit for approval").
- Steps may nest and may return values used by later steps.

---

## 5. Use the right hook for the right scope

- `beforeEach` — generate **fresh test data** for each test so tests never share state. This
  is the most common hook.
- `beforeAll` — one-time work that is safe to share: suite-level reference data fetches, or
  validating an API contract once.
- `afterEach` / `afterAll` — used sparingly. Often cleanup is done explicitly within the test
  via the application's own delete flow, which also exercises that path.

```typescript
test.beforeEach(async () => {
  meetingUIInfo = meetingData(); // unique data per test
  caseId = meetingUIInfo.caseId;
  caseName = meetingUIInfo.caseName;
});

test.beforeAll(async () => {
  const all = await advancedSearchListAssessments();
  schemaCheck(all.assessments, searchAssessmentsRequiredParameters, []); // contract check once
});
```

---

## 6. Reserve custom fixtures for cross-cutting concerns

Don't build fixtures for ordinary page objects. Do use `test.extend()` for capabilities that
many tests share and that benefit from setup/teardown — accessibility scanning is the canonical
example.

```typescript
import { test, expect } from "@fixtures/axe-fixture";

test("Check Accessibility of HomePage @a11y", async ({ page, checkAccessibility }) => {
  await page.goto(process.env.E2E_BASE_URL!);
  await checkAccessibility({
    testName: "Side Nav component",
    allowedViolations: [{ ruleId: "aria-progressbar-name", maxCount: 1 }],
  });
});
```

The built-in `page`, `browser`, and `context` fixtures cover most needs. Pull a fresh
`context`/`page` from `browser` when a test needs an unauthenticated or isolated session.

---

## 7. Authenticate once via stored state, not per test

Log in one time in a setup project, persist the storage state, and have every test inherit it
through configuration. Individual tests should not contain login steps.

```typescript
// playwright.config.ts
{
  name: "SDM-Arkansas",
  testDir: "sdm/arkansas/tests",
  use: { storageState: ".auth/storageState.admin.json", ...devices["Desktop Chrome"] },
  dependencies: ["setup"],
}
```

For the rare test that needs a different identity (e.g. verifying a logout), explicitly build a
fresh context with `storageState: undefined` and drive the login page object — keeping that
exception contained to the one test that needs it.

---

## 8. Assert with auto-retrying, web-first expectations

Use Playwright's `expect(locator)` assertions, which poll until they pass or time out — no
manual waiting or sleeping. Assert on **state and content**, and target the locators exposed by
page objects.

```typescript
await expect(meetingPage.resetButton).toBeEnabled();
await expect(meetingPage.meetingTabs.meetingInfoTab).toBeDisabled();
await expect(meetingPage.pageText).toHaveText(
  "Meeting Info\nParticipant Info\nReview\nAction Plan",
  { useInnerText: true },
);
```

- Favor specific matchers (`toBeVisible`, `toBeEnabled`, `toHaveValue`, `toHaveCount`,
  `toHaveText`) over manually reading values and comparing.
- Use `expect.soft()` when you want to collect multiple failures in one run (e.g. sweeping an
  accessibility or content check) instead of stopping at the first.
- Keep assertions in the test, where the expectation is part of the test's documented intent.

---

## 9. Generate fresh, realistic data; keep fixed values as named constants

- Use a faker library for unique, realistic values so tests don't collide and don't depend on
  pre-existing records.
- Centralize structured test data behind helper factories returning a typed object.
- Express known, business-meaningful enum-like values as named constants for readability.
- Pick from option sets randomly when any valid value should work, to widen coverage over runs.

```typescript
caseName = faker.person.lastName("male");
caseNumber = faker.string.alphanumeric(10);

const meetingUIInfo = meetingData(); // factory returns a full structured fixture

const recommendationForCustody = "Maintain child own home, no court involvement"; // named constant

attendeeDetail = getRandomItemFromArray(["Foster home", "Group home", "Relative"]);
```

---

## 10. Synchronize on the network, not on time

When an action triggers an API call whose result the next step depends on, wait for that
specific response rather than guessing with a sleep. Wrap this in a small helper that performs
the action and returns the parsed request/response for assertion.

```typescript
const restricted = await clickAndGetAPIData(
  page, 201, "api/action/tdm-meeting-list/restrict",
  meetingPage.makeRestricted.click(),
);
expect(restricted.response.data.restricted).toBe(true);
```

For concurrent waits (e.g. a click that opens a new tab), use `Promise.all` so the listener is
armed before the action fires:

```typescript
const [reviewPage] = await Promise.all([
  page.context().waitForEvent("page"),
  advancedSearchPage.viewAssessmentButton.click(),
]);
await reviewPage.waitForLoadState("load");
```

---

## 11. Mock external responses when you're testing the UI, not the backend

When a test targets front-end behavior for a known payload shape, intercept the request and
fulfill it with fixture data. This makes the test deterministic and independent of backend
state — but use it deliberately, reserving real API round-trips for true end-to-end coverage.

```typescript
await page.route("api/action/advanced-search/list-assessments", (route) =>
  route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify(advancedSearchMockData),
  }),
);
```

---

## 12. Tag, skip, and time-out intentionally

- **Tag** categories of tests so they can be filtered in CI (e.g. `@a11y`), and configure the
  default run to include or exclude them as appropriate.
- **Skip** with a stated reason when a test is environment- or permission-bound, rather than
  letting it fail or commenting it out.
- **Override timeouts** per test for genuinely long flows instead of inflating the global
  timeout for everyone.

```typescript
test("Check Accessibility of HomePage @a11y", async ({ page, checkAccessibility }) => { /* ... */ });

test.skip(
  process.env.ADMIN_USERNAME !== "au1000@evidentchange.org",
  "Only runnable as the au1000 user due to permissions",
);

test.setTimeout(80_000); // this flow is legitimately long
```

Decide parallelism deliberately in config (`fullyParallel`, project-level serial mode) rather
than ad hoc per test.

---

## 13. Organize imports with path aliases by responsibility

Configure TypeScript path aliases so imports declare *what kind* of dependency they are. This
keeps the top of every spec scannable and decouples tests from physical file layout.

```typescript
import { test, expect } from "@playwright/test";          // or "@fixtures/axe-fixture"
import { HomePage } from "@tdmPages/homePage";             // page objects
import { AdvancedSearch } from "@sdmPages/advancedSearchPage";
import { clickAndGetAPIData } from "@helpers/clickAndGetAPIData"; // utilities
import { createTDMMeeting } from "@dataFactory/tdm/tdmAPI"; // API data factories
import { faker } from "@faker-js/faker";
```

Suggested buckets: page objects, helpers/utilities, data factories, fixtures, domain constants.

---

## 14. Set up state through the API, exercise it through the UI

Creating preconditions by clicking through the UI is slow and brittle. Build the entities a
test needs via API data factories, then drive only the behavior under test through the
interface. Capture identifiers from API responses to assert against later.

```typescript
const meeting = await createTDMMeeting("initial");          // arrange via API
const meetingPage = new TDMMeetingPage(page);
await meetingPage.goto(`tdm-initial/#/meeting-info/general/${meeting.primary_key}`); // act via UI
```

When cleanup matters, performing it through the application's own delete flow doubles as
coverage of that path:

```typescript
const del = await clickAndGetAPIData(
  page, 201, "api/action/tdm-meeting-list/delete-meeting",
  meetingPage.dialogElements.deleteButton.click(),
);
expect(del.response.data.deleted).toBe(true);
```

---

## 15. Comment intent, not mechanics

Let test and step titles do most of the documenting. Add a block comment above a test to
explain *what path it covers and why* when that isn't obvious, and inline comments only for
non-obvious business rules or deliberate workarounds.

```typescript
/**
 * Covers creating a meeting and navigating to the review tab, whose errors (when clicked)
 * redirect the user to the section with missing info; also toggles restricted on/off and
 * checks the API response for both actions.
 */
test("Validate review page when required info is missing", async ({ page }) => {
  // a child younger than 12 doesn't need to attend the meeting
  await expect(meetingPage.participateInTheMeeting.yes).not.toBeVisible();
});
```

---

## Checklist

- [ ] No raw selectors in tests — everything goes through page objects.
- [ ] Page objects instantiated per-test with `new PageClass(page)`.
- [ ] One feature-named `describe`; behavioral, specific test titles.
- [ ] Tests organized into named `test.step()` blocks.
- [ ] `beforeEach` makes fresh data; `beforeAll` only for safe one-time work.
- [ ] Custom fixtures only for cross-cutting concerns (e.g. accessibility).
- [ ] Authentication via shared storage state, not per-test login.
- [ ] Web-first auto-retrying `expect` assertions; `expect.soft()` for sweeps.
- [ ] Unique faker data; named constants for fixed domain values.
- [ ] Synchronize on network responses/events, never fixed sleeps.
- [ ] Mock responses for UI-only tests; real calls for true E2E.
- [ ] Tags, `skip` reasons, and per-test timeouts used intentionally.
- [ ] Imports organized by responsibility via path aliases.
- [ ] Arrange state via API factories; act through the UI.

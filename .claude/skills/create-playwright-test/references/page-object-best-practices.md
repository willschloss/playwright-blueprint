# Playwright Page Object Best Practices

A page object encapsulates *how* to find and interact with the elements of a page or
component. It is the single source of truth for selectors and low-level interactions, so
that tests can be written in the language of the application instead of the language of the
DOM. These practices are derived from a mature Playwright suite and are written to apply to
any codebase.

---

## 1. One class per page or component, one export per file

- Each file exports **exactly one** page object class. Nothing else.
- Name the class in `PascalCase` with a `Page` suffix (`UserManagementPage`); name the file
  in `camelCase` matching the class (`userManagementPage.ts`).
- Scope page objects to a meaningful unit — a route, a screen, a panel, a dialog, or a
  reusable component (e.g. a table). If a "page" grows past a few hundred lines, that is a
  signal to split a sub-component out into its own page object.

---

## 2. Inject the `page`; never create it

Every page object receives the Playwright `Page` through its constructor and stores it as a
`private readonly` field. The page object never launches a browser or owns a context — it is
a thin wrapper over a page handed to it.

```typescript
export class UserManagementPage {
  constructor(private readonly page: Page) {}
}
```

- Use `private readonly page` so the reference can't be reassigned and isn't part of the
  public surface.
- Do **not** use fixtures, global state, or singletons inside a page object. The only
  dependency is the injected `page`. This keeps each instance isolated and trivially testable.

---

## 3. Declare locators as `readonly` fields — don't re-query

Define elements once as class fields built from the injected `page`. Playwright locators are
*lazy* — declaring them does not touch the DOM — so it is both cheap and correct to declare
them at construction time.

```typescript
readonly userManagementHeading = this.page.getByRole("heading", { name: "User Management" });
readonly nextButton = this.page.getByRole("button", { name: "Next", exact: true });
```

- Mark them `readonly` so they can't be accidentally reassigned.
- Leave them public — tests read these locators directly to make assertions (see §9).
- Name a locator for *what it is* (`saveAndCompleteButton`, `restrictedBanner`), not for how
  it's found.

---

## 4. Prefer user-facing, semantic locators

Use the locator strategy that most resembles how a user perceives the element. In rough order
of preference:

1. `getByRole()` — buttons, headings, tabs, checkboxes, options. The default choice.
2. `getByLabel()` / `getByPlaceholder()` — form fields tied to visible labels.
3. `getByText()` — content lookups; pair with `{ exact: true }` to avoid partial matches.
4. `getByTestId()` — for inputs/components that lack a stable accessible name. Use a
   consistent, hierarchical test-id scheme (`generalInfo-familyName-input`).
5. `locator()` with CSS — only as a last resort when nothing semantic exists
   (`#someId_panel`, framework-specific classes).

```typescript
readonly familyName = this.page.getByTestId("generalInfo-familyName-input");
readonly header = this.page.getByText("TDM Meetings", { exact: true });
readonly assessmentCalendarTable = this.page.locator("#generalInfo-assessmentDate-input_panel");
```

The first three options make tests resilient to markup changes and double as accessibility
pressure. Reserve CSS selectors for the cases the semantic API genuinely can't express.

---

## 5. Scope locators by chaining from a parent

When elements live inside a region, dialog, or table, chain the child locator off the parent
rather than writing a long global selector. This narrows the search, removes ambiguity, and
reads top-down like the DOM.

```typescript
readonly sideDrawer = this.page.getByRole("complementary");
readonly closeSideDrawerButton = this.sideDrawer.locator(".p-drawer-close-button");

readonly table = this.page.getByRole("table");
readonly tableBody = this.table.getByRole("rowgroup").nth(1);
readonly tableRow = this.tableBody.getByRole("row");
```

---

## 6. Group related locators into nested objects

When a screen has clusters of related controls (a menu of options, an indexed set of inputs,
a group of comment fields), expose them as a nested `readonly` object. This keeps the public
surface organized and self-documenting.

```typescript
readonly meetingType = {
  initial: this.page.getByRole("menuitem", { name: "Initial TDM Meeting" }),
  placementStability: this.page.getByRole("menuitem", { name: "Placement Stability TDM Meeting" }),
  permanency: this.page.getByRole("menuitem", { name: "Permanency TDM Meeting" }),
};

readonly childrenAssessedInput = {
  first: this.page.getByTestId("generalInfo-childrenAssessed0-input"),
  second: this.page.getByTestId("generalInfo-childrenAssessed1-input"),
};
```

Tests then read like prose: `await page.meetingType.permanency.click()`.

---

## 7. Use methods (or functions returning locators) for dynamic elements

When the element depends on runtime data — an index, a name, a row — expose a **method** that
takes parameters and returns the locator(s), rather than trying to predeclare every variant.

```typescript
// Returns a locator for one specific row
async returnRow(rowIndex = 0) {
  return (await this.tableRow.count()) === 1 ? this.tableRow : this.tableRow.nth(rowIndex);
}

// Returns a small object of related locators for a given index
actionItem(index = 0) {
  return {
    who: this.page.getByTestId(`actionItem-${index}-who`).filter({ visible: true }),
    what: this.page.getByTestId(`actionItem-${index}-what`).filter({ visible: true }),
    when: this.page.getByTestId(`actionItem-${index}-when`).filter({ visible: true }),
  };
}
```

- Give parameters sensible defaults (`rowIndex = 0`) so the common case stays terse.
- Use `.filter({ visible: true })` when duplicate markup exists and you need the one on screen.

---

## 8. Action methods encapsulate multi-step interactions

Single elements are exposed as locators; *workflows* are exposed as `async` methods. An action
method bundles the clicks, fills, and intermediate waits needed to accomplish one task, named
with a verb describing intent.

```typescript
async selectLocationCode(locationCode: string) {
  await this.page.getByTestId("locationCodeId-input").locator("input").fill(locationCode);
  await this.page.locator("ul#locationCodeId-input_list").getByText(locationCode, { exact: true }).click();
}

async selectAssessmentNumber(assessmentNumber: number) {
  await this.assessmentNumberDropdown.click();
  await this.page.getByRole("option", { name: assessmentNumber.toString(), exact: true }).click();
}
```

- Verb-first naming: `select*`, `fill*`, `click*`, `populate*`, `goto*`, `launch*`.
- Compose larger flows from smaller ones (`fillGeneralTab` calls `selectAssessmentDateToday`).
- Keep methods focused on *doing*, not *asserting* (see §9).

---

## 9. Keep assertions in tests, not in page objects

The strong default: page objects expose elements and perform actions; **tests decide what is
correct**. This keeps page objects reusable across tests that have different expectations, and
keeps each test's intent visible in the test file.

```typescript
// In the test — not the page object:
await expect(meetingPage.resetButton).toBeEnabled();
await expect(meetingPage.restrictedBanner).toBeVisible();
```

The pragmatic exception: an assertion that is really an *invariant of an action* (e.g. a
navigation helper that verifies it landed on the right record) may live in the page object,
because every caller needs that guarantee. Treat this as the rare case, not the rule.

```typescript
async goToMeetingURL(meetingType: string, meetingID: string) {
  await this.page.goto(`/${JURISDICTION}/tdm-${meetingType}/#/meeting-info/general/${meetingID}`);
  const res = await (await this.page.waitForResponse("**/api/action/tdm-meeting-list/get")).json();
  expect(res.primary_key).toEqual(meetingID); // an invariant of "did we navigate correctly"
}
```

---

## 10. Navigation helpers use relative URLs and wait for readiness

Provide a `goto()` (and variants) that navigates relative to the configured `baseURL` and then
waits until the page is actually usable — not merely that the URL changed.

```typescript
async gotoTDMHome() {
  await this.page.goto(`/${JURISDICTION}/tdm-home/#/`);
  await this.page.waitForURL("**/tdm-home/**");
  await this.header("Workflows").waitFor({ state: "visible" });
}
```

- Keep URLs relative so the suite can target any environment via `baseURL`.
- Match URLs with glob/regex patterns, not brittle exact strings.
- End navigation by waiting for a real signal of readiness (a key element visible, a network
  response received).

---

## 11. Prefer web-first waiting; isolate the unavoidable workarounds

Lean on Playwright's built-in actionability waits — `click`, `fill`, and `expect` already
auto-wait. Add explicit waits only when synchronizing on something Playwright can't infer:

```typescript
await this.page.waitForURL("**/tdm-home/**");            // navigation
await this.page.waitForSelector('[data-p-today="true"]', { state: "visible" }); // dynamic widget
const res = await this.page.waitForResponse("**/api/.../get"); // API completion
```

When a flaky third-party widget genuinely requires it, contain a bounded retry **inside the
page object method** so tests stay clean — and always cap the attempts:

```typescript
async selectMeetingDate() {
  let attempts = 0;
  do {
    await this.page.getByTestId("meetingDate-input").locator("input").click();
    await this.page.waitForSelector('[data-p-today="true"]', { state: "visible" });
    await this.page.locator('[data-p-today="true"]').click({ delay: 500 });
    attempts++;
    if (attempts > 5) break;
  } while ((await this.page.getByTestId("meetingDate-input").locator("input").inputValue()) === "");
}
```

Avoid fixed `waitForTimeout` sleeps; wait for a *condition*.

---

## 12. Type the public surface precisely

Use TypeScript to constrain inputs to exactly what's valid and to document intent at the call
site. Literal union types are especially valuable for "pick one of these options" parameters.

```typescript
async returnRowChip(rowIndex = 0, columnName: "type" | "status") { /* ... */ }

async selectTimingOfTDM(
  option: "Before child left home" | "After child left home"
        | "Before child left placement" | "After child left placement",
) { /* ... */ }
```

- Use unions to make invalid arguments unrepresentable.
- Use optional parameters with defaults for the long tail (`secondaryChild?: string`).
- Let return types flow naturally — a method may return a `Locator`, an object of locators, or
  `void`.

---

## 13. Share common UI through composition or a base class

Cross-cutting UI (tables, banners, nav, supervisor controls) should be defined once and reused
in one of two ways:

**Standalone shared page objects** for orthogonal, reusable components. Instantiate them
alongside feature page objects in a test.

```typescript
export class SharedTablePage {
  constructor(private readonly page: Page) {}
  readonly table = this.page.getByRole("table");
  async returnRowChip(rowIndex = 0, columnName: "type" | "status") { /* ... */ }
}
```

**An abstract base class** when a family of pages shares behavior and a common shape. Put the
shared locators/methods in the base, mark cross-cutting state `protected`, and declare an
`abstract` method for what each subclass must implement.

```typescript
export abstract class VermontReadingTool {
  constructor(protected readonly page: Page) {}
  readonly overviewTab = this.page.getByTestId("overview-tab");
  abstract goto(caseId: string): Promise<void>;
}

export class SafetyPlanningCaseReadingToolPage extends VermontReadingTool {
  constructor(page: Page) {
    super(page);
  }
}
```

Prefer **composition over cross-references**: page objects generally should not hold references
to *other* feature page objects. Each owns only its `page`; tests wire multiple page objects
together.

---

## 14. Push domain text/data into helpers, keep it out of the page object

When methods need to compare against large or formatted expected text, import that from a
dedicated helper module rather than hardcoding it inline. This keeps the page object about
*interaction* and centralizes the domain content.

```typescript
import { tableText, tooltipText } from "@helpers/reunificationHelper";

async checkTooltipText() {
  for (let i = 1; i <= 2; i++) {
    await this.page.getByTestId(`safetyThreats-safetyThreats${i}-label`).locator("..").locator("i").click();
    await expect.soft(this.tooltipInfo).toHaveText(tooltipText(`safety${i}`), { useInnerText: true });
    await this.closeTooltipInfo.click();
  }
}
```

---

## 15. Document only what naming can't

Let clear names carry the documentation load. Add comments only for:

- Section dividers in long forms (`// REVIEW TAB`).
- JSDoc on methods with several non-obvious parameters.

```typescript
/**
 * Selects a child's date of birth using a calendar date picker UI.
 * @param year  - The year to select (default: "2020").
 * @param month - The month to select (default: "Jan").
 * @param day   - The day to select (default: "1").
 */
async childDOB(year = "2020", month = "Jan", day = "1", child = 0) { /* ... */ }
```

---

## Checklist

- [ ] One class, one export, per file; class `PascalCase`, file `camelCase`.
- [ ] `page` injected as `private readonly` via the constructor.
- [ ] Elements are `readonly` lazy locators, named for what they are.
- [ ] Locators prefer role/label/text/test-id over raw CSS.
- [ ] Child locators are chained from their parent region.
- [ ] Related locators grouped in nested objects; dynamic ones exposed via methods.
- [ ] Action methods are verb-named and encapsulate multi-step flows.
- [ ] Assertions live in tests (rare action-invariant exceptions aside).
- [ ] `goto()` uses relative URLs and waits for real readiness.
- [ ] Built-in auto-waiting preferred; explicit/bounded waits isolated in the page object.
- [ ] Parameters typed with literal unions; optionals have defaults.
- [ ] Shared UI reused via a shared page object or an abstract base class.
- [ ] No page object depends on another feature page object.

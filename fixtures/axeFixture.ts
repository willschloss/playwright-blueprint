import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

interface AllowedViolation {
  ruleId: string;
  /** Number of matching nodes tolerated before the violation still fails the test. */
  maxCount?: number;
}

interface CheckAccessibilityOptions {
  testName?: string;
  allowedViolations?: AllowedViolation[];
}

type AxeFixtures = {
  checkAccessibility: (options?: CheckAccessibilityOptions) => Promise<void>;
};

/**
 * Extends the base test with a `checkAccessibility` fixture that runs an axe-core
 * scan against the current page and fails with a readable report of any
 * violations not explicitly allow-listed. Reserved for this cross-cutting
 * concern per the project's testing conventions — ordinary page objects don't
 * get fixtures.
 */
export const test = base.extend<AxeFixtures>({
  checkAccessibility: async ({ page }, use) => {
    await use(async (options: CheckAccessibilityOptions = {}) => {
      const allowed = options.allowedViolations ?? [];
      const results = await new AxeBuilder({ page }).analyze();

      const unexpected = results.violations.filter((violation) => {
        const rule = allowed.find((a) => a.ruleId === violation.id);
        if (!rule) return true;
        if (rule.maxCount === undefined) return false;
        return violation.nodes.length > rule.maxCount;
      });

      const report = unexpected
        .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))\n  ${v.helpUrl}`)
        .join("\n\n");

      expect(unexpected, report ? `${options.testName ?? "Accessibility"} violations:\n\n${report}` : undefined).toHaveLength(0);
    });
  },
});

export { expect };

/**
 * Shared shape every per-site config file follows. See config/site.config.ts
 * for how a specific site (config/sites/<name>.ts) gets selected at test-run
 * time, and README.md's "Testing multiple sites" section for how to add one.
 */

export interface NavItem {
  /** Accessible name of the nav link, as a screen reader / getByRole would see it. */
  label: string;
  /** Path (or path substring) the link should navigate to. */
  path: string;
}

export interface FormField {
  /** Accessible label text for the field (used with getByLabel). */
  label: string;
  /** Value to fill in during a test run. */
  value: string;
  /** Whether the field is required — drives the empty-submission validation test. */
  required?: boolean;
}

export interface SiteConfig {
  /** Human-readable name, used in test titles/reports. */
  siteName: string;

  /**
   * Base URL tests run against. Overridden by the PW_BASE_URL env var — set
   * this default to whatever "just works" for local development.
   */
  baseURL: string;

  /** Key routes exercised by the smoke suite. Keep this list short and high-value. */
  smokeRoutes: string[];

  nav: {
    /** Primary header nav items to verify. Leave empty to skip navigation.spec.ts checks. */
    items: NavItem[];
    /** Viewport at/below which the site is expected to collapse into a hamburger menu. */
    mobileViewport: { width: number; height: number };
    /** Viewport the "full" desktop nav is expected to render at. */
    desktopViewport: { width: number; height: number };
  };

  contactForm: {
    /** Route to the primary contact/lead form. Leave empty to skip forms.spec.ts. */
    path: string;
    fields: FormField[];
    /** Accessible name of the submit button. */
    submitButtonName: string;
    /**
     * Whether it's safe to actually submit the happy-path form in this
     * environment (i.e. it won't send a real email or create a real record).
     * Keep false against production; flip true only for a test/staging target
     * with a mocked or disposable backend.
     */
    allowRealSubmit: boolean;
  };

  seo: {
    /** Pages to check for title/meta description/canonical/H1/viewport tags. */
    pagesToCheck: string[];
    /** Soft upper bound on title length before a warning-level assertion fires. */
    maxTitleLength: number;
  };

  accessibility: {
    /** Pages to run an automated axe scan against. */
    pagesToCheck: string[];
    /** Known, accepted violations to exclude — use sparingly, with a reason on file. */
    allowedViolations: Array<{ ruleId: string; maxCount?: number }>;
  };

  cookieBanner: {
    enabled: boolean;
    acceptButtonName: string;
  };

  linkCheck: {
    /** Pages to crawl for same-origin links (checked for broken responses). */
    pagesToCrawl: string[];
    /** Path prefixes to ignore (mailto:, tel:, third-party widgets, etc.). */
    ignorePatterns: RegExp[];
  };

  performance: {
    /** Soft page-load budget in milliseconds. */
    loadBudgetMs: number;
  };
}

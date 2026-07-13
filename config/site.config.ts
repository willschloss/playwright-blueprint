/**
 * Per-site configuration for the Playwright test blueprint.
 *
 * This is the one file you edit when dropping this blueprint into a new Triad
 * project. Every generic page object and spec in this repo reads its selectors
 * and expectations from here instead of hardcoding them, so the same test
 * suites keep working as you point them at a different site.
 *
 * Leave a field at its default / empty-array value to skip the checks that
 * depend on it (specs check for this and `test.skip` with a reason).
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

export const siteConfig: SiteConfig = {
  siteName: "Triad",
  // dev.triad.tech requires auth (redirects unauthenticated users to /login);
  // the marketing site at triad.tech is what this generic suite targets.
  baseURL: process.env.PW_BASE_URL ?? "https://triad.tech",

  smokeRoutes: [
    "/",
    "/services",
    "/venture-build",
    "/ai-partner",
    "/team",
    "/resources",
    "/careers",
    "/contact",
  ],

  nav: {
    // Verified against triadtest's page objects (pages/homePage.ts NAV_ROUTES)
    // and a live fetch of triad.tech — same six links on every marketing page.
    items: [
      { label: "Services", path: "/services" },
      { label: "Venture Build", path: "/venture-build" },
      { label: "AI Partner", path: "/ai-partner" },
      { label: "Team", path: "/team" },
      { label: "Resources", path: "/resources" },
      { label: "Careers", path: "/careers" },
    ],
    mobileViewport: { width: 412, height: 915 },
    desktopViewport: { width: 1280, height: 720 },
  },

  contactForm: {
    // NOT YET CONFIGURED. The /contact page's "Start the conversation" form is
    // client-rendered (nothing appears in the static HTML), and browser tools
    // weren't reachable to inspect it live, so its field labels weren't
    // verified — left blank rather than guessed. Open /contact in a browser,
    // check each field's accessible label, and fill these in (see the
    // create-page-object skill's --reveal/--html capture flow for a
    // repeatable way to do this). forms.spec.ts stays skipped until then.
    path: "",
    fields: [],
    submitButtonName: "Send",
    allowRealSubmit: false,
  },

  seo: {
    pagesToCheck: ["/", "/services", "/contact"],
    maxTitleLength: 60,
  },

  accessibility: {
    pagesToCheck: ["/", "/services", "/contact"],
    allowedViolations: [],
  },

  cookieBanner: {
    enabled: false,
    acceptButtonName: "Accept",
  },

  linkCheck: {
    // Home links to every other primary page, so crawling it covers the site.
    pagesToCrawl: ["/"],
    ignorePatterns: [/^mailto:/, /^tel:/],
  },

  performance: {
    loadBudgetMs: 5000,
  },
};

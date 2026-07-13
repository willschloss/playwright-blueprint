import type { SiteConfig } from "./types";

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

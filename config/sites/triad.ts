import type { SiteConfig } from "./types";

// Scaffolded by scripts/add-site.mjs — every TODO below needs someone (or an
// AI session that can browse) to actually look at triad.tech and fill
// in real values. Nothing here is guessed except baseURL and siteName.
export const siteConfig: SiteConfig = {
  siteName: "Triad", // TODO: confirm this reads naturally, e.g. "Sunshine Technology Services"
  baseURL: process.env.PW_BASE_URL ?? "https://triad.tech",

  // TODO: list the site's key pages here (keep it short and high-value).
  smokeRoutes: ["/"],

  nav: {
    // TODO: open the site, find the header nav, and list each link's
    // accessible name + the path it should go to. Leave empty to skip
    // navigation.spec.ts entirely.
    items: [],
    mobileViewport: { width: 412, height: 915 },
    desktopViewport: { width: 1280, height: 720 },
  },

  contactForm: {
    // TODO: path to the real contact/lead form (leave "" to skip forms.spec.ts),
    // and the accessible label + a safe fill-in value for each field.
    path: "",
    fields: [],
    submitButtonName: "Submit",
    allowRealSubmit: false, // leave false unless this is a disposable test backend
  },

  seo: {
    pagesToCheck: ["/"], // TODO: add other pages worth checking
    maxTitleLength: 60,
  },

  accessibility: {
    pagesToCheck: ["/"], // TODO: add other pages worth checking
    allowedViolations: [],
  },

  cookieBanner: {
    enabled: false,
    acceptButtonName: "Accept",
  },

  linkCheck: {
    pagesToCrawl: ["/"],
    ignorePatterns: [/^mailto:/, /^tel:/],
  },

  performance: {
    loadBudgetMs: 5000,
  },
};

import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  siteName: "Sunshine Technology Services",
  // `||` (not `??`) on purpose: GitHub Actions injects an unset repo
  // variable as an empty string, not undefined, so `??` wouldn't fall back.
  baseURL: process.env.PW_BASE_URL || "https://sunshinetechserv.com",

  // A small, mostly single-page marketing site: everything except the news
  // page lives on "/", with the contact form embedded inline (no /contact
  // route — verified live: /contact, /about, /services all 404).
  smokeRoutes: ["/", "/news-insights/"],

  nav: {
    // Verified against a live fetch: "Home" links to "/" itself (not a
    // meaningful nav check), and there's an external LinkedIn link in the
    // menu that isn't a same-site route — both left out on purpose.
    items: [
      { label: "News & Insights", path: "/news-insights/" },
      { label: "Contact", path: "#contact" }, // in-page anchor, not a separate route
    ],
    mobileViewport: { width: 412, height: 915 },
    desktopViewport: { width: 1280, height: 720 },
  },

  contactForm: {
    // The form lives on the homepage itself, just above the footer.
    path: "/",
    fields: [
      { label: "First Name", value: "Jamie", required: true },
      { label: "Last Name", value: "Rivera", required: true },
      { label: "Email Address", value: "jamie.rivera@example.com", required: true },
      { label: "Phone Number", value: "555-123-4567", required: true },
      { label: "Message", value: "Interested in learning more about your data technology solutions.", required: true },
    ],
    submitButtonName: "Submit",
    allowRealSubmit: false,
  },

  seo: {
    pagesToCheck: ["/", "/news-insights/"],
    maxTitleLength: 60,
  },

  accessibility: {
    pagesToCheck: ["/", "/news-insights/"],
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

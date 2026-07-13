import { APIRequestContext, Page } from "@playwright/test";

export interface PageLink {
  href: string;
  text: string;
  isExternal: boolean;
  opensNewTab: boolean;
  rel: string;
}

/**
 * Collects every `<a href>` on the current page, classifying each as
 * same-origin or external and noting `target`/`rel` so callers can check
 * both "is this link alive" and "does this external link open safely".
 * Generic across sites — it reads whatever anchors are actually rendered
 * rather than assuming a markup convention.
 */
export async function collectLinks(page: Page, ignorePatterns: RegExp[] = []): Promise<PageLink[]> {
  const origin = new URL(page.url()).origin;

  const raw = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => ({
      href: a.getAttribute("href") ?? "",
      text: (a.textContent ?? "").trim(),
      target: a.getAttribute("target") ?? "",
      rel: a.getAttribute("rel") ?? "",
    })),
  );

  return raw
    .filter((link) => link.href && !ignorePatterns.some((pattern) => pattern.test(link.href)))
    .map((link) => {
      let resolved: URL;
      try {
        resolved = new URL(link.href, origin);
      } catch {
        resolved = new URL(origin);
      }
      return {
        href: resolved.href,
        text: link.text,
        isExternal: resolved.origin !== origin,
        opensNewTab: link.target === "_blank",
        rel: link.rel,
      };
    });
}

/**
 * Requests a link's URL and returns whether it responded without a
 * client/server error. Uses HEAD first (cheaper), falling back to GET for
 * servers that don't support HEAD.
 */
export async function isLinkAlive(request: APIRequestContext, url: string): Promise<{ ok: boolean; status: number }> {
  try {
    let response = await request.head(url, { failOnStatusCode: false });
    if (response.status() === 405 || response.status() === 501) {
      response = await request.get(url, { failOnStatusCode: false });
    }
    return { ok: response.status() < 400, status: response.status() };
  } catch {
    return { ok: false, status: 0 };
  }
}

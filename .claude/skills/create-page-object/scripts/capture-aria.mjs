#!/usr/bin/env node
/**
 * capture-aria.mjs — Capture a Playwright ARIA snapshot from a live URL.
 *
 * ESM module. Imports `chromium` from @playwright/test (the package a Playwright
 * test suite already has installed). Run from the PROJECT ROOT so Node resolves
 * the project's node_modules:
 *
 *   node .claude/skills/create-page-object/scripts/capture-aria.mjs --url <url> [options]
 *
 * Produces the role/accessible-name tree that the page-object generator turns
 * into getByRole/getByLabel/getByTestId locators, plus optionally the outerHTML
 * of the scoped root (for parent-chaining structure).
 *
 * Options:
 *   --url <url>           Required. Page to capture (app baseURL + path).
 *   --selector <sel>      Root to scope the snapshot to (CSS, or role= shorthand).
 *                         Default: "body" (whole page). Prefer the component root.
 *   --storage <path>      storageState JSON for an authenticated session.
 *   --reveal <steps>      Semicolon-separated clicks run BEFORE snapshotting, to
 *                         expose tab/dialog/lazy content. Each step is a
 *                         role=/text=/testid= expression, e.g.
 *                         'role=tab[name="Details"]; text=Show more'.
 *   --html                Also print outerHTML of the scoped root.
 *   --wait <selector>     Wait for this selector to be visible before capturing.
 *   --timeout <ms>        Per-action timeout (default 15000).
 *   --headed              Run headed (debug).
 *
 * Notes:
 *   - ariaSnapshot() only sees CURRENTLY rendered/visible nodes. Elements behind
 *     tabs, dialogs, menus, or lazy lists won't appear unless you --reveal them.
 *   - If a goto redirects (e.g. unauthenticated root -> /login), the printed
 *     FINAL_URL will differ from the requested url. Check it before generating.
 */

import { chromium } from "@playwright/test";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--html") args.html = true;
    else if (a === "--headed") args.headed = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
  }
  return args;
}

// Turn 'role=tab[name="Details"]', 'text=Save', 'testid=foo' into a locator.
function toLocator(scope, expr) {
  const trimmed = expr.trim();
  const m = trimmed.match(/^role=([a-zA-Z]+)(?:\[name="(.*)"\])?$/);
  if (m) return scope.getByRole(m[1], m[2] ? { name: m[2] } : undefined);
  if (trimmed.startsWith("text=")) return scope.getByText(trimmed.slice(5), { exact: false });
  if (trimmed.startsWith("testid=")) return scope.getByTestId(trimmed.slice(7));
  return scope.locator(trimmed); // fall back to raw CSS/selector
}

const args = parseArgs(process.argv);
if (!args.url) {
  console.error("ERROR: --url is required.");
  process.exit(2);
}
const timeout = Number(args.timeout || 15000);

const browser = await chromium.launch({ headless: !args.headed });
const context = await browser.newContext(
  args.storage ? { storageState: args.storage } : {}
);
const page = await context.newPage();
page.setDefaultTimeout(timeout);

try {
  const resp = await page.goto(args.url, { waitUntil: "domcontentloaded" });
  console.log("STATUS:", resp?.status());
  console.log("REQUESTED_URL:", args.url);
  console.log("FINAL_URL:", page.url());
  if (page.url() !== args.url) {
    console.log("WARN: final URL differs from requested (redirect?) — confirm this is the page you want.");
  }

  if (args.wait) {
    await page.locator(args.wait).first().waitFor({ state: "visible" });
  }

  // Reveal interaction-dependent content before snapshotting.
  if (args.reveal) {
    for (const step of args.reveal.split(";")) {
      if (!step.trim()) continue;
      try {
        await toLocator(page, step).first().click();
        await page.waitForTimeout(250); // let the UI settle
      } catch (e) {
        console.error(`WARN: reveal step failed: "${step.trim()}" — ${e.message}`);
      }
    }
  }

  const rootSelector = args.selector || "body";
  const root = rootSelector.startsWith("role=")
    ? toLocator(page, rootSelector)
    : page.locator(rootSelector);
  await root.first().waitFor({ state: "visible" });

  const snapshot = await root.first().ariaSnapshot();

  console.log("===== ARIA SNAPSHOT =====");
  console.log(`# scope: ${rootSelector}`);
  console.log(snapshot);

  if (args.html) {
    const html = await root.first().evaluate((el) => el.outerHTML);
    console.log("\n===== OUTER HTML (scoped root) =====");
    console.log(html);
  }
  console.log("\n===== END =====");
} catch (err) {
  console.error("CAPTURE FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}

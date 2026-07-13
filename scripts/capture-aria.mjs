#!/usr/bin/env node
/**
 * Capture the ARIA snapshot (and optionally HTML) of a live page.
 * Usage: node scripts/capture-aria.mjs --url <url> [--selector <css>] [--html] [--storage <path>] [--wait <selector>] [--reveal <steps>]
 */
import { chromium } from "@playwright/test";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    url: { type: "string" },
    selector: { type: "string" },
    html: { type: "boolean", default: false },
    storage: { type: "string" },
    wait: { type: "string" },
    reveal: { type: "string" },
  },
});

if (!values.url) {
  console.error("Usage: node scripts/capture-aria.mjs --url <url> [--selector <css>] [--html] [--storage <path>] [--wait <selector>] [--reveal <steps>]");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const contextOptions = {};
if (values.storage) contextOptions.storageState = values.storage;

const context = await browser.newContext(contextOptions);
const page = await context.newPage();

console.error(`Navigating to ${values.url} ...`);
await page.goto(values.url, { waitUntil: "networkidle" });

if (values.wait) {
  console.error(`Waiting for selector: ${values.wait}`);
  await page.waitForSelector(values.wait, { state: "visible", timeout: 15000 });
}

if (values.reveal) {
  const steps = values.reveal.split(";").map(s => s.trim()).filter(Boolean);
  for (const step of steps) {
    console.error(`Reveal step: ${step}`);
    if (step.startsWith("text=")) {
      await page.getByText(step.slice(5).trim()).first().click();
    } else if (step.startsWith("role=")) {
      const m = step.match(/^role=(\w+)(?:\[name="([^"]+)"\])?$/);
      if (m) await page.getByRole(m[1], m[2] ? { name: m[2] } : {}).first().click();
    } else {
      await page.locator(step).first().click();
    }
    await page.waitForTimeout(500);
  }
}

const root = values.selector ? page.locator(values.selector) : page.locator("body");

console.error("Capturing ARIA snapshot...");
const ariaSnapshot = await root.ariaSnapshot();
console.log("=== ARIA SNAPSHOT ===");
console.log(ariaSnapshot);

if (values.html) {
  const html = await root.evaluate(el => el.outerHTML);
  console.log("\n=== HTML ===");
  // Trim to avoid huge output; first 20k chars
  console.log(html.slice(0, 20000));
  if (html.length > 20000) console.log(`\n... (truncated, total ${html.length} chars)`);
}

await browser.close();

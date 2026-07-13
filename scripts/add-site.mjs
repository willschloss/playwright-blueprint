#!/usr/bin/env node
/**
 * Scaffolds everything mechanical involved in adding a new site to the
 * blueprint: a starter config/sites/<name>.ts, its registration in
 * config/site.config.ts, and a matching `npm run test:<name>` script.
 *
 * This does NOT look at the real site — the starter file is full of TODOs
 * for exactly that. Someone (a person, or an AI session with browser/page
 * access) still has to open the real site and fill those in; this script
 * only removes the busywork of wiring a new file into two other files by
 * hand, which is easy to get subtly wrong and doesn't need a human at all.
 *
 * Usage: node scripts/add-site.mjs --name <shortname> --url <https://...>
 */
import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    url: { type: "string" },
  },
});

if (!values.name || !values.url) {
  console.error("Usage: node scripts/add-site.mjs --name <shortname> --url <https://...>");
  process.exit(1);
}

const name = values.name.trim();
if (!/^[a-z][a-z0-9]*$/.test(name)) {
  console.error(`--name "${name}" must be lowercase letters/numbers only, starting with a letter (it becomes a filename and a JS identifier).`);
  process.exit(1);
}

let url;
try {
  url = new URL(values.url);
} catch {
  console.error(`--url "${values.url}" doesn't look like a valid URL (needs the https:// part).`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteFile = join(root, "config", "sites", `${name}.ts`);
const switcherFile = join(root, "config", "site.config.ts");
const packageFile = join(root, "package.json");

if (existsSync(siteFile)) {
  console.error(`config/sites/${name}.ts already exists — pick a different --name, or edit it directly.`);
  process.exit(1);
}

// 1. Guess a human-readable name from the hostname as a starting point —
// flagged TODO because it's a guess, e.g. "sunshinetechserv" isn't going to
// naturally split into "Sunshine Tech Serv" on its own.
const hostGuess = url.hostname.replace(/^www\./, "").split(".")[0];
const siteNameGuess = hostGuess.charAt(0).toUpperCase() + hostGuess.slice(1);

const siteFileContents = `import type { SiteConfig } from "./types";

// Scaffolded by scripts/add-site.mjs — every TODO below needs someone (or an
// AI session that can browse) to actually look at ${url.hostname} and fill
// in real values. Nothing here is guessed except baseURL and siteName.
export const siteConfig: SiteConfig = {
  siteName: "${siteNameGuess}", // TODO: confirm this reads naturally, e.g. "Sunshine Technology Services"
  baseURL: process.env.PW_BASE_URL ?? "${url.origin}",

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
`;

writeFileSync(siteFile, siteFileContents);
console.log(`✓ wrote config/sites/${name}.ts`);

// 2. Register it in the switcher file: add the import, and add the key to
// the `sites` map. Done with targeted regexes rather than a full parser
// because this script only ever edits a file it also wrote the shape of.
let switcher = readFileSync(switcherFile, "utf8");

const importLines = [...switcher.matchAll(/^import \{ siteConfig as \w+ \} from "\.\/sites\/\w+";$/gm)];
if (importLines.length === 0) {
  console.error("Couldn't find the existing site imports in config/site.config.ts — add this one by hand:");
  console.error(`  import { siteConfig as ${name} } from "./sites/${name}";`);
} else {
  const lastImport = importLines[importLines.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;
  switcher = switcher.slice(0, insertAt) + `\nimport { siteConfig as ${name} } from "./sites/${name}";` + switcher.slice(insertAt);
}

switcher = switcher.replace(/const sites = \{([^}]*)\};/, (_, inner) => `const sites = {${inner.trimEnd()}, ${name} };`);

writeFileSync(switcherFile, switcher);
console.log(`✓ registered "${name}" in config/site.config.ts`);

// 3. Add a convenience npm script (parse/modify/write JSON rather than
// regex, since it's just data — safer against formatting surprises).
const pkg = JSON.parse(readFileSync(packageFile, "utf8"));
pkg.scripts[`test:${name}`] = `SITE=${name} playwright test`;
writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✓ added "test:${name}" script to package.json`);

console.log(`
Next: open config/sites/${name}.ts and work through each TODO by looking at
the real site — or just ask an AI session with browser access to do it, the
same way this blueprint's triad.tech and sunshine.ts files were filled in.
Then run: npm run test:${name}
`);

/**
 * Default preview smoke: light-mode full-page screenshots + internal link check.
 *
 * Prerequisites: `npm run build`, then `npm run serve` (port 3000, e.g. 127.0.0.1).
 * Resolves repo root from this file's location — run via:
 *   node .claude/skills/preview/preview-smoke.mjs
 * from the repository root, or with an absolute path from anywhere.
 *
 * Output: `<repo>/.preview/*-light.png` (gitignored). For dark mode or custom PAGES,
 * copy this file or extend the skill (see SKILL.md).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const HOST = "http://127.0.0.1:3000";
const BASE = `${HOST}/texterdocs`;

const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/scenarios", name: "scenarios" },
  { path: "/changelog", name: "changelog" },
  { path: "/docs/intro", name: "docs-intro" },
  { path: "/docs/YAML/Overview", name: "yaml-overview" },
  { path: "/docs/YAML/Adapters/Overview", name: "adapters-overview" },
];

const outDir = path.join(REPO_ROOT, ".preview");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ colorScheme: "light" });
const page = await context.newPage();

for (const p of PAGES) {
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  await page.screenshot({
    path: path.join(outDir, `${p.name}-light.png`),
    fullPage: true,
  });
}

const internalUrls = new Set();
for (const p of PAGES) {
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle", timeout: 120000 });
  const hrefs = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => a.href)
  );
  for (const abs of hrefs) {
    if (!abs.includes(`${HOST}/texterdocs`)) continue;
    internalUrls.add(abs.split("#")[0]);
  }
}

const broken = [];
for (const url of internalUrls) {
  const res = await fetch(url, { redirect: "follow" });
  if (res.status !== 200) {
    broken.push({ url, status: res.status });
  }
}

await context.close();
await browser.close();

console.log(
  JSON.stringify(
    {
      screenshots: PAGES.length,
      internalLinksChecked: internalUrls.size,
      broken,
    },
    null,
    2
  )
);

if (broken.length) process.exit(1);

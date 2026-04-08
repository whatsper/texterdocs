---
name: preview
description: Build and serve the Docusaurus site, then screenshot key pages and crawl internal links to verify rendering and find broken links
---

# Preview the Site

The user wants to visually verify the site renders correctly after changes — typically after editing `src/components/`, `src/pages/`, `src/data/scenarios.ts`, `src/css/custom.css`, or any docs page. The build catches some classes of error (broken doc links throw because of `onBrokenLinks: 'throw'` in `docusaurus.config.ts`), but it cannot catch:

- Visual regressions (layout breakage, overflow, dark-mode contrast)
- Components that throw at render time but pass type-checking
- Scenarios that fail to render in `ScenarioCard` despite valid TypeScript
- Broken external links (build doesn't fetch them)
- Broken `href` links inside React components (only `[md links]` are checked at build)

This skill builds, serves, and screenshots the site for inspection.

The user will say things like "preview the site", "screenshot the scenarios page", or "check the docs render after my changes". They may also:
- Specify which pages to capture
- Ask for both light + dark mode
- Ask for a link crawl only (no screenshots)

---

## What you must do

### 1. Make sure Playwright is available

Check whether Playwright is installed:

```bash
npx --no-install playwright --version 2>/dev/null || echo "missing"
```

If missing, install it (ask the user first — this adds a dev dependency):

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

If the user says no to the install, fall back to **link-crawl-only mode** using `curl` (skip screenshots).

### 2. Build the site

```bash
npm run build
```

This must succeed before serving. Because `onBrokenLinks: 'throw'` is set in `docusaurus.config.ts`, a build failure here is already a useful signal — surface the exact error and stop.

### 3. Serve the built site in the background

```bash
npm run serve
```

`npm run serve` runs Docusaurus's static server. Run it in the background and capture the URL it prints (typically `http://localhost:3000/texterdocs/` — note the **`/texterdocs/` base path** from `docusaurus.config.ts`).

**Important**: every URL on the local site is prefixed with `/texterdocs/`. Do not visit `http://localhost:3000/scenarios` — it's `http://localhost:3000/texterdocs/scenarios`.

Wait for the server to be ready (`curl -s http://localhost:3000/texterdocs/` returns 200). Give it up to 30 seconds.

### 4. Default page set

If the user didn't specify pages, screenshot these by default:

| Path | Why |
|---|---|
| `/texterdocs/` | Homepage |
| `/texterdocs/scenarios` | Scenario Marketplace — the most-changed custom page |
| `/texterdocs/changelog` | Blog/changelog index |
| `/texterdocs/docs/intro` | Docs landing |
| `/texterdocs/docs/YAML/Overview` | YAML overview — anchor for the docs section |
| `/texterdocs/docs/YAML/Adapters/Overview` | Adapters landing — most-touched docs area |

If the user pointed at a specific change (e.g., "I just edited Plando.md"), prepend the corresponding doc URL.

### 5. Take screenshots

For each page, capture **two screenshots**:
- Light mode (default)
- Dark mode (set via the `data-theme="dark"` attribute on `<html>` — Docusaurus's standard theme switcher hook)

Use full-page screenshots (`fullPage: true`). Save to a temp directory like `./.preview/` (gitignored — add to `.gitignore` if not already) with descriptive filenames: `homepage-light.png`, `scenarios-dark.png`, etc.

A minimal Playwright script you can write to a temp file and run via `node`:

```js
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000/texterdocs';
const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/scenarios', name: 'scenarios' },
  { path: '/changelog', name: 'changelog' },
  { path: '/docs/intro', name: 'docs-intro' },
  { path: '/docs/YAML/Overview', name: 'yaml-overview' },
  { path: '/docs/YAML/Adapters/Overview', name: 'adapters-overview' },
];

(async () => {
  fs.mkdirSync('./.preview', { recursive: true });
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: theme });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p.path, { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await page.screenshot({ path: `./.preview/${p.name}-${theme}.png`, fullPage: true });
    }
    await ctx.close();
  }
  await browser.close();
})();
```

You can adapt the `PAGES` array for the user's request.

### 6. Crawl internal links

After screenshots, walk every `<a href>` on each visited page and check that internal links (anything starting with `/texterdocs/`) return HTTP 200. Skip:
- External `https://` URLs (slow, not your responsibility)
- Anchor-only links (`#section`)
- `mailto:`, `tel:`

For each broken link, report:
- The page it appeared on
- The href value
- The status code

### 7. Stop the server

Kill the `npm run serve` background process when you're done. Always do this — even if a step failed earlier. Leaving the server running on port 3000 will block the next invocation.

### 8. Report

```
PREVIEW REPORT
══════════════

Build: ✓ passed (Xs)
Server: ✓ ready at http://localhost:3000/texterdocs/

Screenshots (./.preview/):
  ✓ homepage-light.png  (full-page, 1280×N)
  ✓ homepage-dark.png
  ✓ scenarios-light.png
  ...

Link crawl: 47 internal links, all 200 OK
   or
Link crawl: 47 internal links, 2 broken:
  /texterdocs/docs/YAML/Types/Func/System/Foo (404) — linked from /texterdocs/docs/YAML/Overview
  /texterdocs/docs/Adapters/Hubspot (404) — linked from /scenarios

Notes:
  - <anything else worth flagging>
```

Then point the user at the screenshot directory so they can open the files and inspect.

### 9. Scoping and modes

- **"preview just the scenarios page"** → use only `/texterdocs/scenarios` in PAGES
- **"crawl only, no screenshots"** → skip step 5
- **"after my Plando edit"** → add `/texterdocs/docs/YAML/Adapters/Plando/Plando` to PAGES, prepend to defaults
- **"compare before/after"** → take two passes, save into `./.preview/before/` and `./.preview/after/`. The user is responsible for stashing/restoring their working tree between passes — ask them which order they want.

---

## What NOT to do

- **Do not** commit `.preview/` to git. Add it to `.gitignore` if missing.
- **Do not** install Playwright without asking — it's a real dependency that ends up in `package.json`.
- **Do not** leave `npm run serve` running. Always kill it.
- **Do not** crawl external URLs — the report becomes flaky and slow.
- **Do not** delete old screenshots automatically. The user may want to compare across runs. Overwrite same-named files only.
- **Do not** modify the dev server config or `docusaurus.config.ts` to "make screenshots easier". The page set in step 4 is enough; route the URL into the script.
- **Do not** screenshot every doc page by default — there are 30+ and it's slow. Default to the curated set in step 4 unless asked.

---

## Key file paths

| File | Purpose |
|---|---|
| `docusaurus.config.ts` | Read for `baseUrl`, `onBrokenLinks` setting, and `themeConfig.navbar.items` (which routes exist) |
| `src/pages/scenarios.tsx` | The most likely page to break visually |
| `src/components/ScenarioCard/index.tsx` | The most likely component to break visually |
| `src/css/custom.css` | Site-wide styles — changes here have broad impact |
| `.preview/` | Output directory for screenshots — gitignored |

---

## After the user confirms the preview is useful (or not)

Once the user has reviewed screenshots, update this skill if:

- **A page they wanted previewed wasn't in the default set** — add it to step 4.
- **A page in the default set never matters** — remove it.
- **They want a different default set entirely** (e.g., "always include the changelog index", "skip the YAML overview") — update step 4.
- **A theme they care about (light vs. dark) was missing or wrong** — fix the script in step 5.
- **The link crawl flagged false positives** (e.g., a link the user knows is intentionally external but starts with `/texterdocs/`) — add to the skip list in step 6.
- **The link crawl missed real breakage** — make it stricter (e.g., follow redirects, check anchor targets exist on the page).
- **A new way the build fails** that you should catch before screenshots — add to step 2.
- **A workflow they want supported** ("compare before/after", "screenshot only mobile width", "screenshot at a specific viewport") — add a mode to step 9.
- **Cleanup the user wants automated** (auto-add `.preview/` to `.gitignore` next time, auto-clear old screenshots) — update step 7 or "What NOT to do".

Edit `.claude/skills/preview/SKILL.md` directly. Treat it as a living document. The goal is that after a few runs, the default flow does exactly what the user wants without prompts.

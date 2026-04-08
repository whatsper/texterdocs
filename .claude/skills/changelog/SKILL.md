---
name: changelog
description: Draft a new blog/changelog post in blog/ summarizing recent commits since the last post, using the project's existing format
---

# Generate a Changelog Blog Post

The user wants a new entry in `blog/` that summarizes what's changed since the last post. The site uses Docusaurus's blog plugin to render `blog/*.md` as a chronological changelog.

The user will typically just say "write a changelog" or "new blog post". They may also:
- Specify a title or theme (e.g., "focus on the new HubSpot adapter")
- Specify a date range or commit range
- Ask you to skip certain commits

---

## What you must do

### 1. Read the existing blog format before drafting

Always read at least **two recent posts** under `blog/` first. Good references:
- `blog/2026-04-07-scenario-marketplace.md` — large feature launch (one section, multiple sub-bullets)
- `blog/2026-04-02-plando.md` — adapter + fixes (two sections: `## Added`, `## Fixed`)
- `blog/2026-03-29-senzey-leadim.md` — adapters + improvements (`## Added`, `## Improved`, with sub-bullets)
- `blog/2026-03-22-initial-launch.md` — large initial post (one section, **bold subheaders** grouping bullets)

This locks in tone, section names, bullet style, and tag taxonomy before you write anything.

### 2. Find the cutoff

Run `git log --oneline -n 50` to see recent commits, then:
1. Find the most recent file in `blog/` by filename date (filenames are `YYYY-MM-DD-<slug>.md` and the date in the filename is the source of truth, not the file mtime).
2. Use that date as the cutoff: include only commits **after** the most recent blog post date.
3. If the user specified a different range, use theirs instead.

Run `git log --since=<cutoff-date> --pretty=format:"%h %ad %s" --date=short` to get the relevant commits. If the result is empty or trivial (1–2 small commits), tell the user — don't fabricate a post just to have one.

### 3. Group commits semantically

Don't list commits one-for-one. Group them by area, then within each area decide whether each item is **Added**, **Fixed**, or **Improved**.

**Section choices** (use only the ones that apply, in this order):
- `## Added` — new features, new adapters, new scenarios, new docs pages
- `## Fixed` — bug fixes, broken links, typo fixes, config corrections
- `## Improved` — refactors, clarity passes, restructuring, performance, UI polish

For larger posts (like initial-launch), you can omit the `## Added` heading entirely and instead use **bold subheaders** as grouping (e.g., `**YAML Node Types**`, `**Adapters**`, `**Site**`). Use this style when there are 8+ items spanning multiple unrelated areas.

**Common semantic groups in this repo:**
- New CRM adapter docs → cluster as one bullet ("**HubSpot adapter** — full documentation for `getCustomerDetails`, `newOpportunity`, ...")
- Changes to `src/data/scenarios.ts` → "Scenario Marketplace" or per-scenario bullets
- Changes to `src/components/`, `src/pages/`, `src/css/` → "Site" group
- Changes to `docusaurus.config.ts`, `sidebars.ts`, plugins → "Site" group
- Changes to existing docs in `docs/YAML/Types/Func/` → group by function name or category
- Changes under `.github/workflows/` → usually skip unless user-visible

### 4. Bullet format

Each bullet follows: `- **Name** — short description`. The em-dash (`—`, U+2014) is the separator, not a hyphen. The bold name should be the user-visible thing (a function name in code style, an adapter name as plain text, a feature name as plain text).

Examples drawn from existing posts:
```markdown
- **Plando adapter** — full documentation for `getCustomerDetails`, `newOpportunity`, `openTicket`/`closeTicket`, and out-of-adapter endpoints (`log_activity`, `upload_contact_file`)
- **`log_activity`** — expanded with all supported API fields including contact identification options, record fields, and response handling
- **Send Media** — added dynamic URL tip (workaround for editor validation when using data injection in `doc:`/`media:`) and a line breaks in captions example
```

Sub-bullets are allowed (two spaces of indentation) for nested detail — see `2026-04-07-scenario-marketplace.md` line 14–18 for the pattern.

### 5. Frontmatter

```markdown
---
title: <Short title>
date: <YYYY-MM-DD>
tags: [<tag1>, <tag2>, ...]
---
```

- **`title`**: 3–8 words. No marketing fluff. Use `+` to combine ("Senzey & Lead.IM Adapters + Docs Improvements"), or "X + Y" pattern for multi-topic posts. If single-topic, just name the thing ("Scenario Marketplace", "Plando Adapter + Docs Fixes").
- **`date`**: ISO date matching the filename. Use today's date unless the user specifies otherwise.
- **`tags`**: pick 2–4 from the established taxonomy. **Do not invent new tags** without checking existing posts first.

**Established tag taxonomy** (read every existing blog post's frontmatter to confirm before adding):
- `docs` — documentation changes
- `yaml` — YAML reference / bot config changes
- `adapters` — CRM adapter changes
- `scenarios` — Scenario Marketplace changes
- `automation` — automation features
- `site` — site infrastructure, theme, plugins
- `feedback` — feedback widget changes

If a commit truly doesn't fit any of these, ask the user what tag they want or suggest one — but err on the side of reusing existing tags.

### 6. The intro paragraph and `<!-- truncate -->`

After the frontmatter, write **one short paragraph** (1–2 sentences) summarizing the gist of the post. Then a blank line, then `<!-- truncate -->`, then a blank line, then the sections.

The truncate marker is required — Docusaurus uses it to split the preview shown on the blog index from the full post. Do not omit it.

### 7. Filename and location

Filename: `blog/YYYY-MM-DD-<kebab-slug>.md`

- The slug should mirror the title in lowercase kebab-case (e.g., "Plando Adapter + Docs Fixes" → `2026-04-02-plando.md` — note that the slug is often abbreviated to the most distinctive word/phrase).
- If multiple posts exist on the same day, append `-2`, `-3`, etc. — but check existing files first; this hasn't happened yet in the repo.
- Always `.md`, not `.mdx`, unless the post needs JSX components.

### 8. Show the draft before saving

**Always show the user the full draft first.** They will often want to:
- Adjust the title
- Drop or rephrase bullets
- Change a tag
- Move an item between `Added`/`Fixed`/`Improved`

After they approve, write the file with the Write tool. Then run `npm run build` to confirm the post renders without errors (Docusaurus is strict about MDX/frontmatter).

### 9. What NOT to do

- **Do not** include commit hashes in the post — these are user-facing release notes, not git history.
- **Do not** mention internal-only commits (refactors with no user impact, CI tweaks, dependency bumps unless they fix a real bug, formatting-only commits). When in doubt, err on the side of leaving it out.
- **Do not** invent features. Every bullet must trace back to a real commit, file change, or thing the user told you was added.
- **Do not** copy commit messages verbatim — rewrite them in user-facing language. "fix typo in plando.md" becomes nothing (skip it). "add Plando adapter docs" becomes a real bullet with content extracted from the actual diff.
- **Do not** bump or change the date format. Always `YYYY-MM-DD`.
- **Do not** edit existing blog posts to add new entries. Each release gets its own post.

---

## Key file paths

| File | Purpose |
|---|---|
| `blog/` | All changelog posts — one file per release |
| `blog/2026-04-07-scenario-marketplace.md` | Reference: large feature launch |
| `blog/2026-04-02-plando.md` | Reference: adapter + fixes |
| `blog/2026-03-22-initial-launch.md` | Reference: large multi-area post |
| `docusaurus.config.ts` | Blog plugin config — read if questions about post rendering |

---

## After the user confirms they're happy with the result

Once the user confirms the post looks good, review the conversation for things that should make this skill smarter next time:

- **New tag**: If you used a tag that wasn't in the taxonomy section above, add it.
- **New section name**: If `## Added` / `## Fixed` / `## Improved` weren't enough and you used something different (e.g., `## Removed`, `## Deprecated`, `## Security`), add it to the section choices list with guidance on when to use it.
- **Filename slug rule the user corrected**: e.g., "always use the CRM name only", "include the year if it's the first post of the year". Add to step 7.
- **Grouping rule the user corrected**: e.g., "always put scenario changes in their own group", "site changes go last". Add to step 3.
- **Format detail you got wrong**: em-dash type, indentation depth, code-style for function names vs. plain text. Add a concrete example to step 4.
- **Tone correction**: "less marketing", "more concise", "lead with the user benefit not the implementation". Add to step 1 or step 4.
- **Commit categories you should have skipped**: e.g., "dependency bumps don't go in the changelog", "infra changes don't go in the changelog unless they affect the user". Add to step 9.
- **Things the user wished I asked upfront**: title preference, tone, length cap. Add to the intro section.

If any of the above came up, edit `.claude/skills/changelog/SKILL.md` directly — update the relevant section in place. Do not append a changelog to the skill file; treat it as a living document. The goal is that the next invocation needs fewer corrections than this one.

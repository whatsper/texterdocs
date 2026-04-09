---
name: release
description: Run the full pre-deploy checklist (typecheck, build, validate-scenarios, check-docs, preview screenshots) and prepare a GitHub Actions deploy dispatch — does not actually deploy without confirmation
---

# Pre-Deploy Release Checklist

The user wants to ship the current state of `main` (or another branch) to the live site at `whatsper.github.io/texterdocs`. This skill is the gate that runs every check **before** the deploy is dispatched.

The deploy itself is a manual `workflow_dispatch` defined in `.github/workflows/deploy-github-pages.yml`. **This skill does not run the deploy automatically.** It runs the checks, then prints the exact `gh` command for the user to dispatch — and only dispatches if the user explicitly confirms.

The user will say "release", "ship it", "deploy", or "run the release checklist". They may also:
- Specify a non-default branch
- Ask you to skip a specific gate
- Ask you to actually dispatch the workflow at the end

---

## What you must do

### 1. Check changelog freshness — and offer to run /changelog if needed

The user wants every release to ship with a changelog entry covering the user-facing changes since the last post. Skipping this is a real failure mode — adapters, scenarios, and site features land on production with no public note.

Find the most recent post in `blog/`:
- Glob `blog/*.md` (and `blog/*.mdx`) and read either the filename date (`YYYY-MM-DD-*.md`) or the `date` field in the frontmatter.
- The latest is the "last changelog".

Then check what's happened since:
```bash
git log --since=<last-changelog-date> --oneline
```

Decide whether a new entry is needed. **Only user-facing changes count** — a post on the blog is meant for readers of the docs site, not a git log.

- **Definitely yes** if any commit (or dirty-tree change) since the last post is user-facing: a new adapter doc (new file under `docs/YAML/Adapters/`), a new scenario (new entry in `src/data/scenarios.ts` `SCENARIOS`), a new function doc (new file under `docs/YAML/Types/Func/`), a feature/UI change to `src/components/` or `src/pages/`, a visible bug fix, or anything the user would notice in the rendered site.
- **Probably yes** if there are 5+ user-facing commits since the last post, even if individually small.
- **Probably no / skip** if all commits since the last post are internal-only: `.claude/` skill edits, CLAUDE.md, build-config tweaks, dependency bumps, internal refactors, `_category_.json` reshuffles, docs-only typo fixes. These never get a blog post.
- **Skip** if the most recent post is dated within the last 2 days **and** there have been zero user-facing commits since.

When drafting the entry (whether via `/changelog` or inline), **exclude internal/tooling commits from the summary entirely** — do not mention them even as a footnote. Readers don't care that the skill suite was updated.

If a new entry is needed, ask the user:
> "The last changelog post was `blog/<filename>` (<date>). Since then there have been N commits: <one-line summary of the biggest changes>. Want me to run `/changelog` to draft a new entry before deploying?"

If they say **yes**:
- Invoke the `/changelog` skill. It will draft a new `blog/YYYY-MM-DD-*.md` from the recent commits.
- Show them the draft and let them edit.
- Once accepted, the new file is a dirty/untracked change — step 2 (git state check) will pick it up and offer to commit + push it as part of the standard flow. Do not commit it here.

If they say **no**, note "user declined changelog" in the final summary and proceed.

If no entry is needed (recent post + no meaningful commits), say so in one line and proceed.

**Do not** run `/changelog` automatically without asking — the user may want to bundle multiple deploys into a single changelog post, or hold the announcement for a coordinated reveal.

### 2. Confirm git state — and defer commit + push until after all gates

The deploy workflow checks out the branch tip from **GitHub**, so by dispatch time the working tree must be (a) clean and (b) pushed. The user does **not** need to commit and push manually before running this skill — handle it as part of the flow.

**Critical: commit at the END of the release flow, in a single commit.** Do not commit mid-flow (before gates). Reason: gates (`/validate-scenarios`, `/check-docs`, `/preview`, `/cleanup`) and the release skill itself may produce edits, and the user may ask for fixes after seeing the summary. Committing upfront creates multiple commit/push cycles and noisy history. Instead, in this step just **record** the dirty state, show it to the user, and flag that the commit will happen after all gates pass. Do the actual staging, committing, and pushing in step 6 (right before dispatch).

Run, in parallel:
- `git status --porcelain` — list of uncommitted files (empty = clean)
- `git rev-parse --abbrev-ref HEAD` — the current branch
- `git fetch origin <branch>` then `git rev-list --left-right --count HEAD...origin/<branch>` — to know if local is ahead/behind/synced
- `git log -1 --format="%h %s"` — current commit

Then handle each state:

**If the tree is dirty**, show the user the list of changed files and ask:
> "There are N uncommitted changes. Want me to commit them? If yes, give me a commit message (or say 'use a generated one')."

If they say yes:
- Stage **only the specific files** shown by `git status --porcelain` — never use `git add -A` or `git add .` (could pick up `.env`, `.preview/`, untracked secrets).
- Skip files that look risky: anything matching `.env*`, `*.key`, `*.pem`, `credentials*`, `secret*`, `.preview/`, `build/`, `node_modules/`. If you encounter any, list them and ask explicitly.
- If they asked for a generated commit message, follow the conventions visible in `git log --oneline -20` (this repo uses short imperative messages, often "Add X", "Fix Y", "Update Z" — no Conventional Commits prefix).
- **Never include Claude/AI attribution in the commit message.** No `Co-Authored-By: Claude`, no `🤖 Generated with Claude Code` trailer, no "written with Claude", no "AI-assisted" — nothing that signals the commit wasn't authored by the user. The commit must look like the user wrote it themselves. **Why:** the user maintains this repo under their own name and the public git history should reflect that. **How to apply:** when committing on the user's behalf in this skill (or any skill in this repo), pass the message via heredoc with no attribution trailer. This overrides the default Claude Code commit-message convention.
- Show them the commit hash and message after.

If they say no, **stop** the release — you cannot ship a tree that diverges from what's on GitHub.

**If the local branch is ahead of origin** (committed but not pushed), ask:
> "Your branch is N commits ahead of origin/<branch>. Push them now?"

If yes, run `git push origin <branch>` (never `--force`). If no, stop.

**If the local branch is behind origin**, ask whether to pull first. If yes, `git pull --ff-only origin <branch>`. If the pull is not fast-forward, stop and tell the user — don't try to merge or rebase automatically.

**If on a branch other than `main`**, confirm: "You're on `<branch>`. The deploy workflow defaults to `main`. Are you releasing `<branch>` or did you mean to switch?"

Once all of the above is resolved, the tree is clean **and** in sync with origin. Only then proceed to the gates.

### 3. Run the gates in order

Each gate must pass before the next runs. Stop on the first hard failure and report.

#### Gate A: Typecheck
```bash
npm run typecheck
```
Catches TypeScript errors in `src/`, including in `scenarios.ts`.

#### Gate B: Build
```bash
npm run build
```
Catches:
- Broken internal markdown links (`onBrokenLinks: 'throw'` in `docusaurus.config.ts`)
- MDX parse errors
- Missing assets
- Component render errors that surface during static prerender

This gate is the most important — if it fails, the deploy will fail too.

#### Gate C: Validate scenarios
Invoke the `/validate-scenarios` skill (or its checks inline) — same checks: missing fields, taxonomy violations, undocumented triggers/actions, credential leaks. Hard-fail on errors and credential leaks. Treat warnings as advisory.

#### Gate D: Check docs
Invoke the `/check-docs` skill — same checks: frontmatter, internal links, code blocks, headings, admonitions. Hard-fail on errors. Treat warnings as advisory.

#### Gate E: Preview smoke screenshots
Invoke the `/preview` skill with the **default page set only** (no extras). Capture light-mode screenshots only (skip dark mode by default to keep this fast — the user can ask for both). Crawl internal links from those pages.

**Implementation:** after `npm run build`, run `npm run serve` (static `build/`, typically port 3000), wait until `/texterdocs/` returns 200, then from the repo root: `node .claude/skills/preview/preview-smoke.mjs`. That script lives next to `.claude/skills/preview/SKILL.md` and writes PNGs to `./.preview/`. Kill the server when done.

If `/preview` reports any broken links, hard-fail.

If Playwright isn't installed, **ask** the user whether to install or skip this gate. Do not silently skip.

#### Gate F: Cleanup advisory (non-blocking)
Invoke the `/cleanup` skill in **report-only** mode. This is the only **advisory** gate — its findings are surfaced as warnings, never as failures. The reasoning:

- Cleanup findings (orphan exports, dead CSS, unused deps, stale TODOs) usually don't affect the deployed site.
- Triaging cleanup findings is slow and can produce more changes that need their own commit + push cycle.
- Forcing cleanup before every release would cause people to skip the release skill entirely.

**However**, two cleanup categories are real bugs and should be promoted to **errors** that block the release:
- **Broken references** — `relatedScenarios` pointing to non-existent ids, redirects pointing to deleted docs (cleanup step 2D and 2E)
- **Sidebar position conflicts** — duplicate `position` values that produce unstable ordering (cleanup step 2I)

Surface everything else as a warning the user can address now or defer.

### 4. Summarize warnings

Even if all gates pass, collect warnings from gates C, D, E, and F into a single list and show them. Examples:

- "blog/2026-04-08-foo.md uses tag `bar` not in established set"
- "docs/YAML/Types/Func/System/Foo.md has 3 untagged code blocks"
- "Scenario `xyz` has an empty configuration array"
- "src/components/OldThing/index.tsx is unused (290 lines, candidate for deletion)"
- "static/img/old-logo.png is unreferenced"

The user may want to address these before shipping or accept them. Do not block on warnings.

If the user **does** decide to address cleanup findings before dispatching, they will produce new changes that need to be committed and pushed — at that point, re-run `/release` from the top so the git state, gates, and dispatch all reflect the cleanup commit.

### 5. Show the dispatch plan

If everything is green (or warnings only), print a summary:

```
RELEASE READY
═════════════

Branch:    main
Commit:    abc1234 Add HubSpot adapter docs
Tree:      ✓ clean (committed 2 files in this run)
In sync:   ✓ local matches origin/main (pushed 1 commit in this run)

Gates
─────
✓ typecheck  (1.2s)
✓ build      (24.7s)
✓ scenarios  (28 scenarios, 0 errors, 1 warning)
✓ docs       (47 files, 0 errors, 3 warnings)
✓ preview    (6 pages, all 200, screenshots in ./.preview/)
✓ cleanup    (advisory: 5 findings — see below)

Warnings (review, not blocking)
───────────────────────────────
- blog/2026-04-08-foo.md: tag "bar" not in established set
- docs/.../Foo.md: 3 untagged code blocks
- Scenario "xyz": empty configuration array
- src/components/OldThing/index.tsx: unused (cleanup)
- static/img/old-logo.png: unreferenced (cleanup)

To deploy main → gh-pages:

   gh workflow run deploy-github-pages.yml --ref main -f branch=main

Or via the GitHub UI:
   https://github.com/whatsper/texterdocs/actions/workflows/deploy-github-pages.yml
```

### 6. Commit, push, then dispatch (only with explicit confirmation)

**Before dispatching**, finalize the git state the deferred way (from step 2):

1. Re-run `git status --porcelain` to see the current dirty set (may differ from step 2 if gates or the user made edits).
2. Stage **only the specific files** listed — never `git add -A` / `.` / `-u`. Same exclusions apply: `.env*`, `*.key`, `*.pem`, `credentials*`, `secret*`, `.preview/`, `build/`, `node_modules/`.
3. Commit with a single message that describes the substantive change. Ask the user for the message, or propose one and wait for confirmation. **Omit routine housekeeping from the message** — do not mention `_category_.json` position shifts, `.claude/` skill edits, or other internal noise even when they're part of the staged set. The subject should name only the user-visible substance (e.g. `Add Google Sheet adapter docs`), not the incidental edits bundled alongside.
4. Pass the message via heredoc. **Never** include Claude/AI attribution, `Co-Authored-By`, or "generated with" trailers — see the rule in step 2.
5. Push to the current branch with plain `git push origin <branch>` (never `--force`).

Then print the dispatch command:

```bash
gh workflow run deploy-github-pages.yml --ref <branch> -f branch=<branch>
```

**Default behavior after printing**: stop and wait. The user runs the dispatch themselves.

**Only if the user explicitly says "dispatch it", "ship it now", "run the workflow", or similar**, run:
```bash
gh workflow run deploy-github-pages.yml --ref <branch> -f branch=<branch>
```

After dispatching:
1. Wait ~5 seconds for the run to register
2. `gh run list --workflow=deploy-github-pages.yml --limit 1` to get the run id
3. Print the URL: `https://github.com/whatsper/texterdocs/actions/runs/<id>`
4. Offer to tail the run with `gh run watch <id>` if the user wants

Do **not** wait for completion in the foreground unless asked — the build takes a couple of minutes and you should free the user's terminal.

### 7. Failure recovery

If a gate fails:
- Print the exact failure (error message, file path, line number where applicable)
- Suggest the most likely fix
- Do **not** auto-fix anything that touches code or content — that's the user's call
- Stop the rest of the gates (no point running `/preview` if `npm run build` failed)
- Exit cleanly so the user can fix and re-run

If `npm run build` fails specifically because of `onBrokenLinks: 'throw'`, point at the broken link in the error message and suggest running `/check-docs links` to find related issues.

---

## What NOT to do

- **Do not** dispatch the workflow without explicit user confirmation. Deploys are observable, public, and partially irreversible (the previous build is overwritten on `gh-pages`).
- **Do not** commit or push without confirming with the user first. Step 2 explicitly asks for permission for both — do not skip the prompt even if it feels obvious.
- **Do not** run `/changelog` automatically in step 1 without asking. The user may want to bundle releases or hold the announcement.
- **Do not** use `git add -A`, `git add .`, or `git add -u`. Always stage the specific files listed by `git status --porcelain` so secrets and stray files don't sneak in.
- **Do not** stage anything matching `.env*`, `*.key`, `*.pem`, `credentials*`, `secret*`, `.preview/`, `build/`, or `node_modules/`. If those files appear in the dirty list, surface them and ask explicitly.
- **Do not** run `git push --force`, `git push --force-with-lease`, or push to `gh-pages` directly — ever. Escalate first.
- **Do not** auto-merge or rebase if `git pull --ff-only` fails. Stop and tell the user.
- **Do not** edit code or content to make a gate pass. Report the failure and let the user decide.
- **Do not** skip a gate silently. If you skip, say so and why.
- **Do not** delete `.preview/` or any artifact between gates. The user may want to inspect screenshots after the run.
- **Do not** modify `.github/workflows/deploy-github-pages.yml`. Workflow changes need user review.
- **Do not** treat warnings as blocking. The whole point of the warning vs. error split is that warnings ship.
- **Do not** auto-fix or auto-delete cleanup findings. Cleanup is advisory in this context — the user reviews and decides; addressing them produces a separate commit cycle.

---

## Key file paths

| File | Purpose |
|---|---|
| `.github/workflows/deploy-github-pages.yml` | The deploy workflow — read for branch/inputs, do not edit |
| `package.json` | Confirms `typecheck`, `build`, `serve` scripts exist |
| `docusaurus.config.ts` | `onBrokenLinks: 'throw'` means build catches md link breakage |
| `.preview/` | Output directory for screenshots from `/preview` — gitignored |

---

## After the user confirms the release flow worked (or didn't)

Update this skill if:

- **A gate produced false failures** that blocked a legitimate release — narrow the rule, convert error → warning, or add an opt-out.
- **A gate missed a real problem** that shipped to production — add the check.
- **A new gate the user wants** (e.g., "always run lighthouse on the homepage") — add it as a numbered gate in step 3.
- **A gate the user always skips** — make it opt-in instead of default, or remove.
- **Branch / git rules the user clarified** (e.g., "always release from main", "tag the release with vX.Y.Z first") — add to step 2.
- **Changelog heuristic adjustments** — if the user said "you should have prompted for a changelog and didn't" or "you prompted for one when I didn't need it", tune the "definitely yes / probably yes / probably no / skip" rules in step 1. Record a one-line *why*.
- **Dispatch behavior the user changed** (e.g., "always wait for the run to finish", "always dispatch automatically when green") — update step 6. Be conservative — auto-dispatch is a footgun.
- **Failure messages that confused the user** — improve the wording in step 7.
- **A new way the workflow file changed** (different inputs, different name) — update step 5 and 6 to match.
- **A pattern of warnings the user always wants suppressed** — push the rule down into the underlying skill (`validate-scenarios` or `check-docs`) instead of filtering here.

Edit `.claude/skills/release/SKILL.md` directly. Treat it as a living document. The goal is that over time, the release flow runs cleanly with zero friction for the things you ship most often.

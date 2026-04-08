---
name: polish
description: Read a doc or set of docs and propose small edits — typos, phrasing, conciseness, layout consistency with the rest of the project — as suggestions, not auto-applied
---

# Polish — Small Edits and Phrasing Improvements

The user wants a careful, conservative reading pass over documentation: catch typos, improve awkward phrasing, suggest layout tweaks that bring a page in line with the rest of the docs, and trim verbosity. This is the "second set of eyes" pass before publishing — not a rewrite.

This skill is **suggestion-first**. Almost every change needs the user's approval before it lands, because phrasing is subjective and the docs have a specific voice the user has built up over time.

The user will say "polish this", "review for typos", "tighten this page", or "is this consistent with the rest of the docs". They may also:
- Point at a single file or a folder
- Ask you to skip phrasing and only catch typos
- Ask you to apply the safe ones automatically

---

## What you must do

### 1. Learn the project's voice before suggesting anything

Read at least three reference docs **before** touching the target file. They tell you what "consistent with the rest of the docs" actually means:

- `docs/YAML/Overview.md` — top-level conceptual prose, sets the tone
- `docs/YAML/Adapters/Plando/Plando.md` — gold-standard adapter doc (terse, table-heavy, real examples)
- `docs/YAML/Types/Func/System/Request.md` — gold-standard function doc
- `docs/YAML/Adapters/Overview.md` — the "explainer" tone for conceptual sections

Pay attention to:
- **Voice**: second-person ("you can do X") vs. imperative ("do X") vs. third-person ("the user can do X"). The project mostly uses **second-person and imperative**, not third-person.
- **Sentence length**: short. Many sentences are one clause. Avoid long compound sentences with multiple "and" / "but" joiners.
- **Bullets vs prose**: parameter and option lists use **tables**, not bullet lists with `**bold**: text`. Conceptual lists use bullets.
- **Code style for terms**: `func_id`, `params`, `crmConfig.token` are always in backticks. CRM names ("Plando", "Senzey") are plain text. URLs are in `[markdown links]`.
- **Bold for emphasis**: sparingly. The reference docs use bold mostly inside table cells (`**Yes**`) and to introduce a term (`**`Main idea:`**`).
- **Capitalization**: function names like `getCustomerDetails` keep their camelCase. Section headings use Title Case for nouns ("CRM config", "Adapter functions") not sentence case.
- **Em-dash usage**: project uses real em-dash (`—`, U+2014) as the separator in bullets and table notes, not a hyphen.

If the target file diverges from the reference docs on any of these, that's a **layout/consistency** finding (see step 2D), not a phrasing finding.

### 2. The four review passes

Run all four passes on the target file. Group the findings separately so the user can triage by category.

#### A. Typos and spelling

- Misspelled words
- Typos in code (a typo in `func_id: getCustomerDetial` is critical — flag as **error**, not suggestion)
- Wrong word substitutions ("their"/"there", "its"/"it's", "compliment"/"complement")
- Inconsistent product/CRM name spelling within the file ("Lead.IM" vs "LeadIM" vs "Lead IM" — pick one and flag the rest)

**Do not flag**:
- Hebrew, Arabic, or any non-English text — assume it's intentional production text
- Identifiers in code blocks (variables, keys, values) unless they're clearly typos that won't work at runtime
- The project's domain-specific vocabulary: `crmData`, `filtrex`, `unorderedActions`, `triggerEvents`, `loaders`, `confidentialData` — these are real Texter terms

For typos, suggest the corrected spelling inline with file:line context.

#### B. Grammar

- Subject-verb agreement
- Tense consistency within a paragraph
- Dangling clauses
- Missing articles ("the", "a") or extra articles
- Pronoun antecedent ambiguity ("it" with no clear referent)

Do not "correct" intentional sentence fragments — the docs use them in tables and short bullet leads. Only flag when the meaning is unclear.

#### C. Phrasing and conciseness

- Sentences with redundant words ("in order to" → "to", "make sure that" → "ensure", "is able to" → "can")
- Passive voice that should be active ("the API is called by Texter" → "Texter calls the API")
- Long compound sentences that should be split
- Hedge words that add no value ("basically", "essentially", "simply", "just")
- Marketing tone ("powerful", "seamlessly", "effortlessly", "robust") — the docs are dry and factual; flag any
- "The user can..." → "You can..." (second-person)
- "Click here" → use a descriptive link text instead

For each phrasing suggestion, provide a **before / after** so the user can compare directly. Do not just describe the change — show it.

```
docs/YAML/Adapters/Foo/Foo.md:42

Before:
  In order to make sure that the request is properly authenticated,
  you should make sure that the token is included in the headers.

After:
  To authenticate the request, include the token in the headers.

Why: removed redundancy ("in order to", "make sure that" twice), trimmed
from 22 words to 8.
```

#### D. Layout and structure consistency

Compare the target file to the reference docs from step 1 and look for divergence:

- **Section order**: adapter docs go intro → official API links → `crmConfig` table → adapter functions → out of scope → onboarding. Function docs go intro → syntax table → params table → examples → advanced examples. If a section is missing or out of order, flag.
- **Heading levels**: H1 once, then H2 for top-level sections, H3 for operations. No skipping levels.
- **Table column conventions**: param tables use `Param | Required | Notes` or `Param | Required | Default | Use`. If the target uses different columns, flag and suggest aligning.
- **Code-block language tags**: every YAML example must be ` ```yaml `. Bare ` ``` ` blocks are flagged in `/check-docs` but mention here too if the user is reviewing for layout.
- **Tip callouts**: project uses `:::tip[Title]` for non-obvious gotchas. Consider whether a paragraph in the target file should be promoted to a tip block (or demoted from one).
- **Internal links**: should be relative `/docs/...` paths, not absolute URLs.
- **Examples count**: adapter operations usually have a "Basic" example and 1–2 "Advanced" examples. Function docs usually have 3+ examples. If the target has fewer or more, mention it as something to consider — not a hard finding.

### 3. Report format

Group by file and pass. Severity hierarchy: **Critical** (typo in code that breaks things), **Suggestion** (everything else).

```
POLISH REPORT — docs/YAML/Adapters/Foo/Foo.md
═════════════════════════════════════════════

Reference docs sampled: Plando.md, Senzey.md, Overview.md

CRITICAL
────────
Line 87: typo in code — `func_id: getCustomerDetial` should be `getCustomerDetails`
Line 142: code-fence YAML has invalid indentation (will not parse)

TYPOS / SPELLING
────────────────
Line 12: "Plando is a Israeli CRM" → "an Israeli CRM"
Line 38: "recieves" → "receives"
Line 91: brand name is inconsistent — "Lead.IM" used line 12, "LeadIM" used line 91. Pick one.

GRAMMAR
───────
Line 56: missing article — "Texter calls API" → "Texter calls the API"

PHRASING / CONCISENESS
──────────────────────
Line 23
  Before: "In order to make sure that the request is properly authenticated, you
           should make sure that the token is included in the headers."
  After:  "To authenticate the request, include the token in the headers."
  Why: removed redundancy, 22 → 8 words

Line 71
  Before: "The user can also pass extra params if they want to override defaults."
  After:  "You can pass extra params to override defaults."
  Why: second-person, removed hedge

LAYOUT / CONSISTENCY
────────────────────
Section "Setup" (line 14) — reference docs use "CRM config (`crmConfig`)" as the
heading for this section. Suggest renaming to match.

Param table (line 45) — uses columns "Field | Type | Description". Reference docs
use "Param | Required | Notes". Consider aligning.

Tip block missing — line 102 describes a non-obvious credential rotation gotcha.
Reference docs would put this in a `:::tip[Title]` block.

NOTES (not findings, just things to consider)
──────────────────────────────────────────────
- Only one "Basic" example in `getCustomerDetails`. Plando.md has a "Basic" + an
  "Advanced — lookup by custom phone" variation. Consider adding a second example.
```

End with a one-line summary: `N findings: X critical, Y typos, Z phrasing, W layout.`

### 4. Apply mode

Default behavior: **suggest only**. Show every change as a before/after; do not modify the file.

If the user says "apply", "fix them", or "go ahead":
- **Apply automatically**: clear typos, missing articles, simple grammar fixes, code typos that are 100% certain
- **Confirm one-by-one**: any phrasing change, any rewording, any layout change, any rename of a section heading
- **Never apply**: changes that touch code blocks (the user may have intentional formatting), changes to Hebrew/Arabic text, changes that delete content

After applying, run `npm run build` to confirm nothing broke (broken markdown links throw at build time). Show a final diff summary.

### 5. Scoping

- **"polish this file"** + a path → that file only
- **"polish the new Plando page"** → find the file, that file only
- **"polish the adapters"** → walk every file under `docs/YAML/Adapters/`, but **report per-file** so the user can stop after the first one if it's noisy
- **"typos only"** → run only pass A
- **"phrasing only"** → run only pass C
- **"layout only"** → run only pass D
- **"polish the changelog"** → walk `blog/`, but use a different reference set (other blog posts) since blog tone differs from docs

### 6. Pace yourself — don't overwhelm the user

If a single file produces 30+ findings, the user will be paralyzed. In that case:
- Show the **critical findings first** (typos in code, errors)
- Show the **top 5–10 typos and grammar fixes** next
- Show **the top 3 phrasing suggestions** that have the highest impact
- Show **the top 3 layout findings**
- End with: "Page has more issues — want me to continue, or address these first?"

This is a judgment call. A 50-line page with 8 findings → show all 8. A 300-line page with 50 findings → batch.

---

## What NOT to do

- **Do not** rewrite the file. This is small edits, not a rewrite. If a section needs to be rewritten from scratch, flag it as a layout finding and ask the user.
- **Do not** flag Hebrew or Arabic text. It's intentional production text used as "prime examples" in the project.
- **Do not** modify content inside code blocks, except to fix a critical typo in an identifier that will break at runtime — and even then, confirm first.
- **Do not** change section order or move content around without explicit user approval. That's restructuring, not polish.
- **Do not** suggest "improvements" that conflict with the reference docs. The reference docs are the style. If the target file matches them, leave it alone even if generic style guides would say otherwise.
- **Do not** flag American vs. British spelling unless the project is internally inconsistent. If you can't tell the convention, look at the references.
- **Do not** flag intentional sentence fragments in tables, callout boxes, or short bullet leads.
- **Do not** "fix" the project's domain vocabulary (`crmData`, `filtrex`, `unorderedActions`, etc.). These are real Texter terms.
- **Do not** add comments, TODOs, or annotations to the file. Findings live in the report, not in the file.
- **Do not** auto-apply phrasing changes. Even when the user says "apply", confirm phrasing changes individually unless they say "apply everything".

---

## Key file paths

| File | Purpose |
|---|---|
| `docs/YAML/Overview.md` | Reference: top-level conceptual tone |
| `docs/YAML/Adapters/Plando/Plando.md` | Reference: rich adapter doc, table-heavy |
| `docs/YAML/Adapters/Senzey/Senzey.md` | Reference: minimal adapter doc |
| `docs/YAML/Types/Func/System/Request.md` | Reference: rich function doc |
| `docs/YAML/Adapters/Overview.md` | Reference: explainer-style conceptual tone |
| `blog/2026-04-02-plando.md` | Reference: blog tone (terse, bulleted) |

---

## After the user accepts or rejects suggestions

This skill learns more from rejections than acceptances. Update it if:

- **A phrasing suggestion the user rejected** — learn the preference. If they reject "the user can" → "you can" because they wrote that section deliberately in third-person, note the exception. If they reject "in order to" → "to" because they like the rhythm, lower the priority of that pattern.
- **A specific word the user defends** ("the docs use 'simply' on purpose for tutorials") — add to the "do not flag" list in step 2C.
- **A layout convention the user has that you didn't pick up** (e.g., "every adapter doc starts with a sentence containing 'is a … CRM for …'") — add to step 1's voice notes.
- **A new reference doc** the user points at as the gold standard — add to step 1's reading list.
- **A file or folder the user always wants polished a different way** (blog vs docs vs scenarios.ts comments) — add a scoping mode in step 5 with the right reference set.
- **The user said the report was too noisy** — adjust the threshold in step 6, or de-prioritize a category.
- **The user said the report missed the most important issue** — surface that category higher or add a new pass.
- **Tone the user pushed back on** ("I don't write 'should', I write 'must'", "I don't capitalize headings that way") — record the rule with a one-line *why* so future-you doesn't re-suggest it.
- **The user accepted phrasing changes you weren't sure about** — also a signal. Strengthen the rule that produced them.
- **A typo or error the user caught that you missed** — add the pattern to step 2A.

Edit `.claude/skills/polish/SKILL.md` directly. Treat it as a living document. The most important thing this skill must learn is **this user's voice** — the same suggestion may be wrong in this project and right in another. Record specifics, not generalities.

Over many sessions, the goal is that your suggestions match what the user would have written themselves, and the noise drops to near zero.

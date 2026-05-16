---
name: add-adapter
description: Scaffold a new CRM adapter documentation page under docs/YAML/Adapters/, sourced from the adapter implementation in the sibling `../server` repo (the official, up-to-date CRM code).
---

# Add a CRM Adapter Doc

The user wants to add documentation for a new CRM adapter to the Texter docs site.

They will provide one or more of:
- The CRM name (e.g., "Plando", "Senzey", "Rapid")
- A path or filename inside `../server/src/crm/adapters/` (e.g., `plando.ts`)
- A link to the official CRM API docs
- Notes about which operations matter, special config, edge cases

## Source of truth: `../server`

**Always read the adapter source from the sibling repo at `../server/src/crm/adapters/` — never from `_context/code/adapters/`.** The `../server` checkout is the official server codebase and is kept up to date; `_context/` may be stale. Helpers, types, and shared utilities the adapter imports also live under `../server/src/` — read them there too (e.g. `../server/src/phone/formatter.ts`, `../server/src/crm/csvParser/`, `../server/src/helpers/`).

**If they only give a name**, locate the source file yourself in `../server/src/crm/adapters/` (try `<name>.ts`, `<name lowercase>.ts`, fuzzy match if needed). If you cannot find it, ask the user where it lives — do not guess.

---

## What you must do

### 1. Read the existing pattern before writing anything

Always read these first, in order:
1. **`docs/YAML/Adapters/Overview.md`** — the conceptual frame and the three "common operations" (`getCustomerDetails`, `newOpportunity`, `closeTicket`). Your new doc must be consistent with how these are described.
2. **At least two existing adapter docs** — pick a "rich" one like `docs/YAML/Adapters/Plando/Plando.md` and a "minimal" one like `docs/YAML/Adapters/Senzey/Senzey.md`. Match their tone, table shapes, and section structure.
3. **`docs/YAML/Adapters/_category_.json`** — to confirm this is the right top-level section.

### 2. Read the adapter source

Read the full source file at `../server/src/crm/adapters/<crm>.ts`. This is the **source of truth** for what to document. From it, extract:

- **Every `case '<op>':`** in the main `switch (op)` block — these are the operations to document. Common ones: `getCustomerDetails`, `newOpportunity`, `closeTicket`, `openTicket`, `updateLead`, `customQuery`, `updateRecord`, `newTicket`. Document **all** of them.
- **For each operation:**
  - What URL/endpoint it hits.
  - Which fields from `opParams` (the YAML `params`) it reads, **renames**, **defaults**, or **omits**.
  - Which fields from `crmConfig` it reads.
  - What it puts on `crmData` on success.
  - What conditions cause it to return `{ success: false }` (these become the `on_failure` cases).
  - Any special flags like `usePclient`, `updateContact`, `is_org`.
- **Top-level `crmConfig` reads** — every place `crmConfig.<field>` is read tells you a config field. List them all in the `crmConfig` table.
- **Helpers used** — phone formatting (`formatPhoneNumberForCustomerCountry`), proxy (`getAgentFor`), file sharing (`createToken`), `getLastMessages`. These hint at behaviors worth mentioning ("uses formatted channel phone if omitted", "transcript includes today's messages", etc.).
- **Imported helpers** — when the adapter imports from another path inside `../server/src/` (e.g. `../csvParser/CSVParser`, `../../phone/formatter`, `../../auth/...`), **open and read that file in `../server/` before writing anything about its behavior**. Do not guess.

If the source has comments pointing to vendor docs (`@see documentation here: ...`), capture those URLs for the "Official API docs" links section.

### 3. Decide the folder layout

Each CRM lives in its own folder under `docs/YAML/Adapters/`:

```
docs/YAML/Adapters/
  <CrmName>/
    <CrmName>.md         # the doc
    _category_.json      # { "label": "<CrmName>", "position": <N> }
```

- **Folder name**: PascalCase, no spaces (e.g., `Plando`, `LeadIM`, `Powerlink`).
- **`_category_.json` `position`**: place the new adapter **alphabetically** among existing ones. Read every existing `_category_.json` under `docs/YAML/Adapters/` to find the correct alphabetical slot, then shift every adapter after it up by 1 (update all their `_category_.json` files). Do not collide with another adapter and do not just append at the end.
- **`_category_.json` `label`**: human-readable, can include spaces (e.g., `"Lead.IM"` if the brand uses a dot).
- **`.md` frontmatter**: always `sidebar_position: 1` (each adapter folder has only one file).

### 4. Doc structure

Follow this skeleton **exactly** — sections, order, and headings:

```markdown
---
sidebar_position: 1
---

# <CrmName>

[<CrmName>](<official-site-url>) is a <one-sentence positioning>.

**Official <CrmName> API docs** (for deeper reference):

- [<Doc title>](<url>) — `<op>` (`<endpoint>`)
- [<Doc title>](<url>) — `<op>` (`<endpoint>`)

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `<field>` | **Yes** / No | — / `<default>` | <one-sentence purpose> |

---

## Adapter functions

### `<op>`

<one-sentence what it does>

**When it runs:** <when this op is typically called>

**Basic**

```yaml
  <node_name>:
    type: func
    func_type: crm
    func_id: <op>
    on_complete: <next>
    on_failure: <fallback>
```

| Param | Required | Notes |
|-------|----------|-------|
| `<param>` | Yes / No | <notes, including default behavior if omitted> |

**Result:** <what gets put on crmData, with field-by-field table if non-trivial>

Returns `on_failure` if: <conditions, copied from the source's failure branches>.

**Advanced — <variation name>**

```yaml
  <node_name>:
    ...
```

---

### `<next op>`

...

---

## Out of Adapter Scope

<Only include this section if the user mentioned endpoints not covered by the adapter, OR if the source file has TODO/comment about missing operations. Use the request func pattern from Plando.md as a template.>

---

## <CrmName> Onboarding (for Texter Support)

<Internal-facing setup notes — credential source, who to contact, recommended config defaults. Mirror the "Onboarding" section in Plando.md / Senzey.md. Only include if you have real info; do not invent.>
```

### 5. Writing rules

- **Tone**: factual, terse, no marketing. Match Plando.md and Senzey.md.
- **Two-table pattern for operations**: param table (inputs) and result table (outputs on `crmData`). Skip the result table if the op only sets one or two fields — describe inline.
- **`Required` column values**: `**Yes**`, `No`, `Yes*` (with `*` footnoted), or `One of the three` — match existing patterns.
- **`Default` column**: use `—` for "no default", or the actual default value in backticks.
- **Code blocks**: always `yaml` for YAML, indented with two spaces inside the block (matches `<node_name>:` indentation in existing docs).
- **Data injection syntax**: use `%chat:crmData.id%`, `%state:node.<node_name>.text%`, `%chat:channelInfo.id%`, etc. Never invent new providers.
- **Hebrew text**: if a real Hebrew label/subject appears in the source as a hardcoded string (e.g., Senzey's `תיעוד פניה ואטסאפ עסקי`), keep it verbatim — it's a "prime example" of production behavior.
- **Tip callouts**: use `:::tip[Title]` ... `:::` for non-obvious gotchas you found in the source (auto-defaults, format requirements, file-link expiration, etc.). Match Plando.md's usage.
- **Internal links**: relative `/docs/...` paths, e.g. `[request](/docs/YAML/Types/Func/System/Request)`. Do not link to files that don't exist — verify with `Glob` if unsure.
- **External links**: official vendor docs, real URLs only. If the source comment has a Google Docs link, keep it.
- **Do not invent** params, behaviors, or `crmData` fields. If the source doesn't show it, leave it out — better to omit than to guess.

### 6. Example operation entries to draw from

If you're documenting `getCustomerDetails`, the Plando entry (`docs/YAML/Adapters/Plando/Plando.md` lines 35–107) is the gold standard for a complex one. Senzey's entry (lines 17–55) is the gold standard for a simple one.

For `newOpportunity`, see Plando lines 111–188 (with update-existing variation) and Senzey lines 59–106 (with category labels).

For `closeTicket`/`openTicket`, see Plando lines 192–224 (transcript push with `formal_whatsapp_url`) and Senzey lines 110–129 (auto-content, no params).

### 7. After drafting the file

1. **Verify the build**: run `npm run build` and fix any errors. The Docusaurus build catches broken internal links, MDX parse errors, and frontmatter problems.
2. **Verify the sidebar position is unique** across adapter folders.
3. **Show the user the final file path** and a 1-paragraph summary of which operations you documented and which you skipped (and why).

### 8. What NOT to do

- **Do not** create a sidebar entry in `sidebars.ts` — the sidebar is autogenerated from the folder tree. Just create the folder + `.md` + `_category_.json`.
- **Do not** add the adapter to `docusaurus.config.ts` unless the user explicitly asks for a redirect from an old URL.
- **Do not** edit `docs/YAML/Adapters/Overview.md` to add the new CRM — Overview is conceptual, not a list.
- **Do not** copy the entire source file into the doc as a code block. The doc explains usage, not implementation.
- **Do not** include real customer credentials, real tokens, real org IDs, or real customer-specific values from the source. If a real value appears as a placeholder/example in the source code, replace it with `YOUR_*` or `{{placeholder}}` style in the doc.
- **Do not** invent operations the source doesn't implement. If the user asks about `updateContact` and the source doesn't have a `case 'updateContact':`, say so and ask whether they want it added in code first or documented as "out of adapter scope" using `request`.
- **Do not** suggest `request` as a write-back alternative unless you have verified that the auth required for those write operations is accessible from bot YAML. If the adapter authenticates via server-managed credentials (e.g. OAuth tokens stored in MongoDB, service account keys on disk), those credentials are not available in YAML — `request` will not work and suggesting it misleads the reader. When in doubt, omit the suggestion or say "requires server-side support."

---

## Key file paths

| File | Purpose |
|---|---|
| `docs/YAML/Adapters/Overview.md` | Conceptual frame — read first, do not edit |
| `docs/YAML/Adapters/<CrmName>/<CrmName>.md` | The new doc — what you create |
| `docs/YAML/Adapters/<CrmName>/_category_.json` | Sidebar label + position — what you create |
| `docs/YAML/Adapters/_category_.json` | Parent category config — read but do not edit |
| `../server/src/crm/adapters/<crm>.ts` | **Source of truth** for ops and params — always read this, not `_context/` |
| `../server/src/crm/adapters/helpers/` | Shared helpers (phone formatting, COQL, etc.) — read if the adapter uses them |
| `../server/src/` | Full server codebase — read when the adapter imports helpers from outside `crm/adapters/` (e.g. `../../phone/formatter`, `../csvParser/`, `../../auth/...`). |
| `docs/YAML/Adapters/Plando/Plando.md` | Reference: rich adapter doc |
| `docs/YAML/Adapters/Senzey/Senzey.md` | Reference: minimal adapter doc |

---

## After the user confirms they're happy with the result

Once the user confirms the adapter doc looks good, review the conversation and ask yourself:

- Did I have to ask clarifying questions that a better skill would have answered upfront?
- Did the user correct anything about the doc structure (table columns, section order, tone, callouts)?
- Did a new operation type come up that doesn't fit the `getCustomerDetails` / `newOpportunity` / `closeTicket` pattern, and that I should describe in this skill?
- Did the source-reading step miss something important (a helper, a pattern, a config field)?
- Did I make a mistake I should warn my future self about?

If any of the above are true, update **`.claude/skills/add-adapter/SKILL.md`** directly — edit the relevant section in place. Do not append a changelog; treat it as a living document.

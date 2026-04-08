---
name: validate-scenarios
description: Lint src/data/scenarios.ts for missing fields, taxonomy violations, undocumented trigger/action types, and unsanitized credentials, then run npm run build
---

# Validate the Scenario Marketplace Data

The user wants to verify that `src/data/scenarios.ts` is correct, complete, and safe to publish. This is a **read-mostly** skill — you should not edit `scenarios.ts` unless the user asks you to fix the issues you find.

The user will typically just say "validate scenarios" or "lint the marketplace". They may also:
- Ask you to fix the issues automatically
- Scope to a specific scenario by id

---

## What you must do

### 1. Read the source-of-truth definitions

Start by reading the top of `src/data/scenarios.ts` to get the live values:
- The `Scenario` interface (required vs. optional fields)
- The `ConfigItem` interface
- The `TRIGGER_DISPLAY` map (every supported trigger event)
- The `ACTION_DISPLAY` map (every supported action type)

These are the **live truth**, not the snapshot in this skill. If the user added a new trigger event to `TRIGGER_DISPLAY`, accept it. If they removed one, treat it as removed.

Also read `.claude/skills/add-scenario/SKILL.md` section 4 to get the **tag taxonomy** (trigger tags, action tags, essence tags). The taxonomy lives in that skill, not in `scenarios.ts`.

### 2. Run the checks

For **every scenario** in the `SCENARIOS` array, verify:

#### A. Required fields present
- `id` — non-empty kebab-case string, **unique** across the array
- `name` — non-empty string
- `tags` — non-empty array of strings
- `triggerEvents` — non-empty array of strings
- `description` — non-empty string
- `configuration` — array (may be empty if there's truly nothing to configure, but warn if empty)
- `json` — object with at minimum `version`, `name`, `triggerEvents`, `actions` keys

#### B. Tag taxonomy
For every tag in `tags`:
- Check it appears in the taxonomy in `add-scenario/SKILL.md` section 4 (trigger tags, action tags, essence tags)
- Warn (don't error) if a tag is unknown — the user may have added a new one. Surface it so they can decide to update the taxonomy or rename.

#### C. Trigger events documented
For every event in `triggerEvents`:
- Check it has an entry in `TRIGGER_DISPLAY`
- If missing, that's a hard error — the marketplace UI will render the raw event name instead of a label.

#### D. Action types documented
Walk the `json.actions` array. For every action's `name` field:
- Check it has an entry in `ACTION_DISPLAY`
- If missing, hard error (same UI problem).

Also walk `json.actions[*].params.actions` if present (some actions nest sub-actions) and any `loaders.beforeConditions[*]` for completeness.

#### E. Trigger consistency
- The top-level `triggerEvents` on the Scenario object should match `json.triggerEvents` exactly. If they diverge, warn — the marketplace shows the top-level value but the JSON is what's exported to Texter.

#### F. Configuration item locations
For every `ConfigItem`:
- `field` — non-empty
- `location` — non-empty
- `description` — non-empty
- `required` — boolean (not undefined, not a string)
- If `location` looks like a JSON path (starts with `actions[`, `loaders.`, etc.), do a best-effort check that the path resolves in the `json` object. If not, warn.

#### G. Credential sanitization sweep
This is the most important check. Real values must never leak into the published marketplace. Scan every scenario's `json` (recursively) for:

- **Real email addresses** matching `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` — but allow:
  - `{{yourSmtpEmail}}`, `{{recipientEmail}}`, `{{...}}` placeholders
  - Public Texter/Whatsper emails like `support@whatsper.com` only if the user confirms they're intentional
  - Strings inside `%chat:...%`, `%state:...%`, `%env:...%`, `%message:...%`, `%problem:...%` data injection (these are templates, not real values)
- **Real webhook URLs** matching `https?://(?!(www\.)?(business\.facebook\.com|texterchat\.com|wa\.me|whatsapp\.com|whatsper\.com|webcards\.[a-z]+))` — flag any URL that points to n8n.cloud, make.com, zapier.com, customer-specific subdomains, or anything not in the allowlist of public/structural URLs
- **Real Salesforce org domains** matching `[a-z0-9-]+\.my\.salesforce\.com` or `[a-z0-9-]+\.lightning\.force\.com` (unless `{{yourOrg}}.my.salesforce.com`)
- **Real phone numbers** matching `\+?\d{10,15}` — but allow examples in `to:`, `from:`, `id:` fields if they look like template placeholders
- **Real agent/user IDs** matching MongoDB ObjectId format (`[0-9a-f]{24}`) — flag any unless inside a `{{...}}` placeholder
- **SMTP passwords / app passwords** — any field named `password`, `pass`, `appPassword`, `apiKey`, `token`, `secret`, `authorization` that contains a non-placeholder value

For each match, report:
- The scenario `id`
- The JSON path where the value lives
- The flagged value (truncated if long)
- Why it was flagged

Allowed placeholder patterns (do NOT flag):
- `{{yourWebhookURL}}`, `{{yourAIWebhookURL}}`
- `{{yourSmtpEmail}}`, `{{yourSmtpAppPassword}}`
- `{{recipientEmail}}`
- `{{agentUserId}}`
- `{{yourOrg}}`
- Any `{{...}}` template
- Any data injection: `%chat:...%`, `%state:...%`, `%env:...%`, `%message:...%`, `%problem:...%`
- Structural enums: `"service": "gmail"`, `"method": "post"`, label IDs like `failed_message`
- Hebrew/Arabic message text — these are intentional production examples
- Public URLs: `https://business.facebook.com/...`, `https://texterchat.com/...`, `https://wa.me/...`, `https://whatsper.com/...`

#### H. Build check
Run `npm run build`. This catches:
- TypeScript errors in scenarios.ts
- Anything the React/JSX layer rejects (e.g., scenarios.tsx and ScenarioCard rendering paths)
- Sidebar / route conflicts

If the build fails, surface the exact error message and the scenario id (if derivable from the line number).

### 3. Report format

Group findings by severity:

```
ERRORS (blocking)
─────────────────
[scenario-id] <field>: <what's wrong>
[scenario-id] <field>: <what's wrong>

WARNINGS (review)
─────────────────
[scenario-id] <field>: <what's wrong>

CREDENTIAL LEAKS
────────────────
[scenario-id] <json-path>: "<flagged-value>" — <reason>

BUILD
─────
✓ npm run build passed
   or
✗ npm run build failed:
  <error excerpt>
```

End with a one-line summary: `N scenarios checked, X errors, Y warnings, Z credential flags.`

### 4. Do not auto-fix unless asked

By default, **report only**. Do not edit `scenarios.ts`. The user will decide which findings to act on.

If the user explicitly says "fix it" or "fix the leaks", then:
- Replace credential leaks with the appropriate `{{placeholder}}` (use the table in `add-scenario/SKILL.md` section 2)
- Add missing entries to `TRIGGER_DISPLAY` / `ACTION_DISPLAY` only if you can confidently derive a label — otherwise ask
- Do not "fix" missing fields by inventing data

After any auto-fix, re-run `npm run build` and re-report.

### 5. Scoping

If the user says "validate just `<id>`" or "check the new one", scope all checks to that scenario only. Still run `npm run build` at the end (it's the only way to catch TypeScript errors).

---

## What NOT to do

- **Do not** add a scenario, remove a scenario, or rename one. Use `/add-scenario` for additions.
- **Do not** edit the taxonomy in `add-scenario/SKILL.md` based on what you find here. If a tag is unknown, surface it as a warning and let the user decide whether the tag or the taxonomy is wrong.
- **Do not** flag Hebrew text, public URLs, or data injection patterns as leaks. They're intentional.
- **Do not** rewrite `description` or `name` fields for "clarity" — that's a content decision, not validation.
- **Do not** silently skip scenarios you can't parse. Report parse failures as errors.

---

## Key file paths

| File | Purpose |
|---|---|
| `src/data/scenarios.ts` | The marketplace data — read; only edit if user asks for fixes |
| `src/components/ScenarioCard/index.tsx` | How scenarios render — read if you need to understand which fields are user-visible |
| `src/pages/scenarios.tsx` | The marketplace page — read if questions about filter logic |
| `.claude/skills/add-scenario/SKILL.md` | Tag taxonomy and sanitization rules — source of truth for both |

---

## After the user confirms they're happy with the result

Once the user has triaged your findings, review the conversation and update this skill if:

- **A "leak" you flagged was actually fine** (e.g., a public URL you didn't have in the allowlist, a real email the user wants to keep). Add the value to the allowlist in step 2G with a one-line reason.
- **A real leak you missed** — add the pattern to step 2G.
- **A new field added to the `Scenario` interface** that you should check — add to step 2A.
- **A new tag the user accepted into the taxonomy** — note that the taxonomy lives in `add-scenario/SKILL.md` and update it there, then re-read it on next invocation. Don't duplicate the list here.
- **A new trigger event or action type** — these live in `TRIGGER_DISPLAY` / `ACTION_DISPLAY` in `scenarios.ts` itself. No skill update needed unless the user wants you to suggest the labels.
- **A check the user wished you ran** that you didn't — add it to step 2.
- **A check the user said is too noisy / too strict** — relax the rule or convert from error to warning.
- **A reporting format the user prefers** — update step 3.
- **Auto-fix behavior the user clarified** — update step 4 (e.g., "always offer to fix leaks even when not asked").

Edit `.claude/skills/validate-scenarios/SKILL.md` directly. Treat it as a living document. The goal is fewer false positives and zero false negatives over time.

---
name: add-scenario
description: Add a new scenario to the Texter Scenario Marketplace in src/data/scenarios.ts
---

# Add Scenario to the Marketplace

The user wants to add one or more scenarios to the Texter Scenario Marketplace.

They will provide either:
- A raw JSON file (the scenario export from Texter), plus optional notes
- Or just a JSON with no extra context — derive everything yourself from the JSON

---

## What you must do

### 1. Read the current state of the data file

Always start by reading **`src/data/scenarios.ts`** to understand the existing structure before appending anything.

### 2. Sanitize credentials in the JSON

Scan the JSON for real sensitive values and replace them with `{{placeholder}}` style templates. Replace:

| What to look for | Replace with |
|---|---|
| Real webhook/API URLs (n8n, make.com, etc.) | `{{yourWebhookURL}}` or `{{yourAIWebhookURL}}` |
| Real email addresses in transport/auth | `{{yourSmtpEmail}}` |
| SMTP passwords / app passwords | `{{yourSmtpAppPassword}}` |
| Real agent/user IDs | `{{agentUserId}}` |
| Real Salesforce org domain | `{{yourOrg}}` |
| `to:` email recipients | `{{recipientEmail}}` |

**Do NOT replace:**
- Data injection expressions like `%chat:agent.displayName%`, `%problem:accountId%`, `%env:projectId%`, etc.
- Label IDs like `failed_message`, `waiting_for_customer` — these are config values, not secrets
- Hebrew/production message text — keep as the prime example
- Structural values like `"service": "gmail"`, status strings, filtrex expressions
- URLs that are public (e.g. `https://business.facebook.com/`, `https://texterchat.com/...`, `https://wa.me/...`)

### 3. Build the Scenario object

Append a new entry to the `SCENARIOS` array in **`src/data/scenarios.ts`**, before the closing `];`.

The TypeScript shape is:

```ts
{
  id: string,                    // kebab-case, derived from the name
  name: string,                  // human-readable, from the JSON "name" field
  tags: string[],                // see tag taxonomy below
  triggerEvents: string[],       // copy directly from the JSON
  description: string,           // write a 1-3 sentence plain-English description
  configuration: ConfigItem[],   // see below
  relatedScenarios?: string[],   // ids of related scenarios in the same suite, if any
  json: object,                  // the full sanitized JSON as a JS object literal
}
```

**ConfigItem shape:**
```ts
{
  field: string,       // short label shown in the UI
  location: string,    // dot-notation path in the JSON, or "Nihul → Customer Config"
  description: string, // what to put there, and any constraints
  required: boolean,
}
```

Only create a ConfigItem for fields that actually need to be changed per customer. Do not list structural or static fields.

Scenario **`description`** and each **`configuration[].description`** are rendered as **Markdown** on the marketplace card (`react-markdown` + GFM; single `\n` inside a block is turned into hard line breaks). Use `[label](/docs/...)` for internal doc links, `` `backticks` `` for paths, and `\n` for multi-line snippets (e.g. cron JSON examples). Use a blank line (`\n\n`) between distinct paragraphs if needed.

**Subscription (`(SUB)`) scenarios:** For subscribe-to-events / webhook-forwarding templates in the **Subscription scenarios** section, the marketplace **`name`** and the embedded **`json.name`** must both use the **`(SUB) `** prefix (e.g. `(SUB) Chat Unsubscribed`), matching Postman import templates and the rest of the subscription suite.

### 4. Tag taxonomy

Use only tags from this list. Each scenario can have multiple tags.

**Trigger tags** (what fires the scenario):
- `on-message` — `domain.message.created`
- `on-assign` — `domain.chat.assigned`
- `on-resolve` — `domain.chat.resolved`
- `on-status` — `app.message.statusRequest`
- `on-message-status-change` — same as above, use when the scenario is specifically about message delivery status
- `on-external-bot` — `domain.chat.updated.externalBot` / `app.bot.chat.setExternal`
- `on-channel-event` — `domain.channel.health.problem.resolved`
- `on-unsubscribe` — `domain.chat.unsubscribed`
- `on-subscribe` — `domain.chat.subscribed`
- `scheduled` — `app.scenarios.customTriggers.cron`

**Action tags** (what the scenario does):
- `webhook` — fires an HTTP request (`request` action)
- `send-message` — sends a WhatsApp message (`sendMessage` action)
- `add-label` — adds/removes a label (`chatUpdateLabels` action)
- `assign-chat` — assigns a chat to an agent (`chatAssign` action)
- `run-bot` — resumes a Texter bot (`runBot` action)
- `send-email` — sends an email (`sendEmail` action)
- `crm-update` — updates a CRM record via API

**Essence/integration tags**:
- `subscription` — a "(SUB)" subscribe-to-events forwarding scenario
- `ai-bot` — part of the Q-AI AI handoff suite
- `salesforce` — integrates with Salesforce CRM
- `failed-message` — specifically handles failed/undelivered message cases
- `auto-resolve` — chat auto-resolve / idle-label suite (mark idle, resolve, clear idle on activity); see docs/API/Chat Auto-Resolve.md

If a trigger event or action name is not in `TRIGGER_DISPLAY` or `ACTION_DISPLAY` in the file, add it to the appropriate map at the top of the file.

### 4b. Trigger and action icons (required)

The Scenario Marketplace card shows an icon per trigger and per action. **Whenever you add or change a `TRIGGER_DISPLAY` entry, you must add or update the matching icon** in **`src/components/ScenarioCard/index.tsx`** inside `TRIGGER_ICONS`. The object key must be the **human-readable label** — the **string value** from `TRIGGER_DISPLAY` for that event (e.g. `'Chat Unsubscribed'`), not the raw `domain.*` key.

**Whenever you add or change an `ACTION_DISPLAY` entry, do the same** in `ACTION_ICONS` using the **display string** from `ACTION_DISPLAY`.

- **Always use [lucide-react](https://lucide.dev/icons)** for `TRIGGER_ICONS`, `ACTION_ICONS`, and the card UI icons in the same file (copy, chevron, flow arrow, etc.). Import the named icon and render with the shared **`L13`** props: `{...L13}` expands to `size={13} strokeWidth={2} aria-hidden`. Icons inherit chip color via `currentColor`. **Do not hand-write inline SVGs** in `ScenarioCard` unless Lucide truly has no equivalent (extremely rare — search [lucide.dev](https://lucide.dev/icons) first).
- If no map entry exists for a label, the chip renders **text only** — avoid shipping new triggers/actions without an icon.

**Do not swap Lucide icons** for ad-hoc SVGs or alternate libraries unless the user explicitly asks.

### 5. Section comment

Place the new scenario under the correct section comment. Existing sections:
- `// ── Subscription scenarios ──────────────────────────────────────────────────`
- `// ── Automation scenarios ────────────────────────────────────────────────────`
- `// ── CRM / Salesforce scenarios ──────────────────────────────────────────────`
- `// ── Q-AI suite ──────────────────────────────────────────────────────────────`
- `// ── Scheduled scenarios ─────────────────────────────────────────────────────`

Add a new section comment if none of the above fit.

### 6. JSON field rules

- Do **not** end `description` with a redundant newline (`\n` suffix) unless the scenario intentionally needs it
- Keep the JSON as close to the original as possible — do not restructure, reorder keys, or rename fields
- Keep production text values as the "prime example" (e.g. Hebrew message text, label names, filtrex expressions)
- The `html` field in `sendEmail` actions must stay as an **array of strings** exactly as given — do not join into one string
- Remove the Salesforce `oauthServiceName` config item if present — it's always `"salesforce"` and doesn't need configuration

### 7. After editing the file

Run `npm run build` to confirm there are no TypeScript or compilation errors. Fix any errors before finishing.

---

## Key file paths

| File | Purpose |
|---|---|
| `src/data/scenarios.ts` | All scenario data — primary edits for new scenarios, `TRIGGER_DISPLAY`, `ACTION_DISPLAY` |
| `src/components/ScenarioCard/index.tsx` | Card UI — **edit** whenever you add `TRIGGER_DISPLAY` / `ACTION_DISPLAY` entries (`TRIGGER_ICONS` / `ACTION_ICONS` keyed by the display label) |
| `src/components/ScenarioCard/styles.module.css` | Card styles |
| `src/pages/scenarios.tsx` | Marketplace page — read if layout questions arise |

---

## After the user confirms they're happy with the result

Once the user confirms the scenario looks good, review the conversation and ask yourself:

- Did I have to ask clarifying questions that a better skill would have answered upfront?
- Did the user correct anything about how I structured the data (tags, configuration items, credential handling, JSON format)?
- Did any new tag, trigger event, or action type come up that isn't in the taxonomy?
- Did any new rule emerge (e.g. a new placeholder convention, a new section group, a new field rule)?
- Did I make a mistake I should warn my future self about?

If any of the above are true, update **`.claude/skills/add-scenario/SKILL.md`** directly — edit the relevant section in place. Do not append a changelog; just keep the skill current and accurate. Treat it as a living document.

---

## Example skeleton

```ts
{
  id: 'my-new-scenario',
  name: 'My New Scenario',
  tags: ['on-message', 'webhook'],
  triggerEvents: ['domain.message.created'],
  description:
    'Plain-English explanation of what this scenario does and when to use it.',
  configuration: [
    {
      field: 'Webhook URL',
      location: 'actions[0].params.url',
      description: 'Your endpoint that receives the payload.',
      required: true,
    },
  ],
  json: {
    version: 'v1',
    name: 'My New Scenario',
    // ... full sanitized JSON as JS object
  },
},
```

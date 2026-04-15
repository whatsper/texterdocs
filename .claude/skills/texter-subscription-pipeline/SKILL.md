---
name: texter-subscription-pipeline
description: End-to-end workflow for new subscribe-to-events (SUB) scenarios — Texter JSON, Postman docs, then marketplace — use when the user wants a webhook subscription scenario or references this pipeline
---

# Texter subscription scenario pipeline (SUB)

Use this **strictly sequential** workflow whenever the user asks for a new **subscribe-to-events** scenario (webhook forwarded from Texter via Scenarios import API).

### Hard rules (non-negotiable)

1. **One phase at a time.** Deliver only what the current phase allows. **Never** bundle Phase 3 + Phase 4 in the same turn.
2. **Phase 4 is forbidden** until the user **explicitly** confirms Phase 3 is done — e.g. Postman/API import works, webhook fires from the imported scenario. Phrases like “cool this works” after **Texter-only** testing **do not** unlock Phase 4; clarify which phase passed if ambiguous.
3. **Before Phase 4, do not edit:** `src/data/scenarios.ts`, `src/components/ScenarioCard/index.tsx`, or add-scenario **tag taxonomy** for the new trigger. (No `TRIGGER_DISPLAY`, no `TRIGGER_ICONS`, no new marketplace row.)
4. If the user has not yet confirmed the **previous** phase, **stop** and ask — do not assume.
5. **Copy-paste delivery:** Whenever you output Postman **Description** markdown, Phase 3 copy-paste blocks, or any similar prose the user is meant to paste elsewhere, **always** put the full text inside **one fenced code block** (e.g. open with a line containing only ` ```markdown `, paste the content, close with a line containing only ` ``` `) so the user can copy everything in one action. Do not rely on naked markdown in the assistant reply for those deliverables.
6. **Postman Description = collection layout, not an essay.** The docs tab must **mirror** existing **Subscribe to Events** requests in `_context/api/Official Texter API V2.postman_collection.json` — see **Subscribe to Message Events** → **All Messages** / **New Incoming Messages** (`request.description`). Use **only** these sections, in order: `### Description` (one short sentence), `### Body Params` (boilerplate below + **`url`** + **`asStatus`**), `### Expected Payload` (short intro + bullet list of `eventData` fields + apidocs links where applicable), `**Example Payload received by your Webhook:**` + fenced `` ``` json `` example. **Do not** add: import endpoint URL, token scopes, long “this matches your Phase 1 JSON” explanations, tables, or extra subsections unless the user explicitly asks.

---

## Phase 1 — Scenario JSON (Texter UI)

**Goal:** Give the user paste-ready scenario JSON to create or import inside **Texter** (Nihul / Scenarios).

**You produce:**

- Full **v1** scenario object: `version`, `name`, `description`, `triggerEvents`, `loaders`, `conditions`, `actions`, `options`.
- **`(SUB) `** prefix on `name` and matching description of the trigger.
- **`request`** action with `url: "{{yourWebhookURL}}"`, `method: "post"`, `json: true`, and `data` containing:
  - `eventName` — stable camelCase identifier for the webhook payload (e.g. `chatSubscribed`, `chatUnsubscribed`).
  - `eventData` — objects using `##provide` / injection as appropriate (usually `chat` for chat-domain events).
- **No real URLs** — only `{{yourWebhookURL}}` (see **add-scenario** skill sanitization rules).

**You do *not* yet:**

- Edit `src/data/scenarios.ts`
- Edit Postman collection files
- Add `TRIGGER_ICONS` / new tags (that is Phase 4)

**Stop and wait** for the user to test in Texter and say whether the scenario fires and the payload looks correct.

---

## Phase 2 — Iterate on JSON (if needed)

If Texter behavior or payload shape is wrong, adjust the JSON (triggers, `eventName`, `eventData`, loaders, conditions) and return an updated block. Repeat until the user confirms **Texter is good**.

---

## Phase 3 — Postman documentation (API import)

**Only after** the user confirms the scenario works in Texter.

**Goal:** Same **request** as other imports: `POST …/scenarios/manage/import`, Bearer `{{scenariosApiToken}}` (see collection folder **Subscribe to Events**). The **Description** tab content must follow **hard rule 6** and the **layout template** below — read **All Messages** / **New Incoming Messages** in the Postman collection if unsure.

### Postman → Description (layout template)

1. `### Description` — **One sentence** only, user-facing (e.g. what the subscriber receives). For **(SUB) Chat Assigned**, use exactly:  
   `Subscribe to receive notifications to your specified webhook URL when a chat is taken by an agent.`
2. `### Body Params` — First sentence matches the collection: `The request body is pre-configured to capture …` — fill in what is forwarded (e.g. *message and chat*, *chat and agent*). Then: `You only need to modify the following specific fields within the JSON body:` then exactly two bullets — **`url`** (under `data.actions[0].params.url`, replace `{{yourWebhookURL}}`) and **`asStatus`** (root, `active` / `inactive`). Nothing else.
3. `### Expected Payload` — Same rhythm as **All Messages**: “When an event triggers…”, “The payload structure contains an `eventName` (set to `…`)…”, then bullets for each top-level `eventData` field with [apidocs](https://apidocs.texterchat.com/) links for Chat/Message objects where the collection does.
4. `**Example Payload received by your Webhook:**` then a `` ``` json `` block (optional space after backticks to match the collection: `` ``` json ``).

**Do not** put the import URL or auth scopes inside the Description tab unless the user asks.

**You produce two separate copy-paste blocks** (each wrapped in its own fenced code block per hard rule 5):

1. **Postman → Description** — Markdown following the template above (hard rule 6).
2. **Postman → Body (raw)** — Import envelope only when the user needs the full JSON (omit if they reuse Phase 1 / Phase 2 scenario):

```json
{
  "data": { ...full scenario object... },
  "asStatus": "active"
}
```

Use strict JSON in the body block (no `//` comments) unless the user’s collection examples consistently use the `asStatus` comment line — then match the collection.

**Reference (not part of the Description tab):** `POST https://{{projectID}}.texterchat.com/server/api/v2/scenarios/manage/import`, Bearer `{{scenariosApiToken}}`.

**Stop and wait** for the user to confirm import + webhook delivery via the API path.

---

## Phase 4 — Texterdocs marketplace (**add-scenario** skill)

**Only after** the user confirms Postman/API import and webhooks behave as expected.

**You must follow** [`.claude/skills/add-scenario/SKILL.md`](../add-scenario/SKILL.md) in full:

- Append to **`src/data/scenarios.ts`** (subscription section), sanitized `json`, `configuration` for webhook URL only unless more fields are required.
- Add **`TRIGGER_DISPLAY`** (and **`ACTION_DISPLAY`** if new action types).
- **`TRIGGER_ICONS` / `ACTION_ICONS`** in **`src/components/ScenarioCard/index.tsx`** using **lucide-react** + shared **`L13`** — no hand-drawn SVGs.
- Register new **tags** in add-scenario taxonomy if needed (e.g. `on-subscribe` for `domain.chat.subscribed`).
- Run **`npm run build`** before finishing.

---

## Quick reference

| Phase | Deliverable | Gate (user must say so) |
|-------|-------------|-------------------------|
| 1 | Scenario JSON for Texter | Scenario tested in **Texter**; fires with expected payload |
| 2 | Revised JSON only | Only if Phase 1 failed or needs tweaks |
| 3 | Postman description + import **body** (two blocks) | **Not** before Phase 1 gate |
| 4 | `add-scenario` + Lucide icons + taxonomy + `npm run build` | **Only after** Phase 3: import via API works and webhook is verified |

Phase 3 **does not** include editing the repo Postman JSON file unless the user separately asks to update the collection file.

**Related files**

- Marketplace data: `src/data/scenarios.ts`
- Icons: `src/components/ScenarioCard/index.tsx` (`L13`, lucide-react)
- Postman reference: `_context/api/Official Texter API V2.postman_collection.json` (structure only; may not be committed everywhere)
- Scenario rules: `.claude/skills/add-scenario/SKILL.md`

---

## Naming conventions

- Marketplace + `json.name`: **`(SUB) …`**
- Webhook `eventName`: **camelCase**, stable, unique per subscription template
- Postman copy should stay aligned with `json.name` and trigger list
- **`description` strings:** do **not** append a redundant newline at the end of `description` unless there is a deliberate multi-line reason. Keep copy concise; avoid internal status codes in user-facing text when the product concept (e.g. “taken”) is enough.

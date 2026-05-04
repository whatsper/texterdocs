---
sidebar_position: 2
slug: /API/chat-auto-resolve
title: Chat auto-resolve (system scenarios)
description: How Texter manages chat auto-resolve via system scenarios, settings storage, and the automations API.
---

# Chat auto-resolve (system scenarios)

Chat **auto-resolve** is a product feature that:

1. Marks **idle** chats (no inbound or outbound message for a configurable period) with the system **idle** label.
2. **Resolves** chats that already have the idle label when they stay inactive for a separate per-status time window.
3. **Removes** the idle label when **any** new message is created on the chat (incoming or outgoing) or when the chat is resolved.

The behavior is implemented as **four fixed system scenarios** (not bot YAML).
Their definitions are **imported from built-in templates** the first time the feature is needed.
**PATCH** `/system/automations/chats/auto-resolve` drives **activation**, **stored config** (on the Auto Resolve scenario revision), **generated conditions** on the resolve cron scenario, the **mark-idle `chatsList` loader**, and **database cron registration** according to the rules below. Operational HTTP details (auth, tenant path prefix) live in the main [Texter API docs](https://apidocs.texterchat.com); this page explains the feature and how the PATCH handler maps settings to scenario structure.

## HTTP surface

| Method | Path (suffix) | Purpose |
|--------|----------------|--------|
| `GET` | `/system/automations/chats/auto-resolve` | Return effective **config**: defaults merged with **`attachedData`** from the **Auto Resolve** system scenario’s latest revision (see below). |
| `PATCH` | `/system/automations/chats/auto-resolve` | Apply a full **config** body: ensure all four scenarios exist, update resolve conditions / mark-idle loader when inputs change, activate or inactivate revisions, then **conditionally** sync DB cron tasks. |

The router mounts these routes at the path above relative to your environment’s system/customer API base.

## Configuration model (`PATCH` body / `GET` response)

The request and response body is a single **config** object. The service validates it against the automation schema. Conceptually it contains:

| Field | Meaning |
|-------|--------|
| `enabled` | Master switch. When **`false`**, the service **inactivates** the active revision on **all four** system scenarios and **deletes** the two dedicated DB schedule rows for this feature. |
| `idleThresholdHours` | Hours without any message before a chat is eligible for the **Mark idle** pass. The service sets the mark-idle **`chatsList`** loader’s `lastMessageTimestamp.before` to a Texter time expression of the form `%time:now-24h("x")|parseInt%`, with the middle number equal to this field’s value. |
| `1` | **Pending** chats: `{ "enabled": boolean, "hours": number }`. `hours` is the inactivity window (last message older than that many hours) **after** the idle label is present, used only by the **Auto Resolve** cron scenario. Numeric key **`1`** is the internal chat status value for pending. |
| `2` | **Assigned** chats: same shape as `1`. Key **`2`** is the internal value for assigned. |

:::info
Only **pending** (`1`) and **assigned** (`2`) participate. The resolve cron scenario gets **one condition group per key** in stored config order; each group ends with a literal **status** compare (`##literal` **1** or **2**) and an **`enabled` flag** compare wired to that status’s `enabled` from the PATCH body (when a status is disabled in config, that group’s conditions cannot pass).
:::

### Defaults (nothing stored yet on the Auto Resolve revision)

`GET` merges these defaults when `attachedData` is missing or incomplete:

- `enabled`: `false`
- `idleThresholdHours`: `24`
- `1` and `2`: `{ "enabled": true, "hours": 24 }`

### Where settings are stored

The **canonical** copy of `enabled`, `idleThresholdHours`, and the **`1` / `2`** objects is the **Auto Resolve** system scenario’s latest revision **`attachedData`**. That object is what `GET` overlays on defaults. **`idleThresholdHours`** is reflected again in the mark-idle **`chatsList`** loader whenever the service updates that loader after a PATCH.

### Example `PATCH` body

Send as JSON on `PATCH /system/automations/chats/auto-resolve` (exact URL prefix and auth: [Texter API docs](https://apidocs.texterchat.com)). Keys **`1`** and **`2`** are required shape-wise together with `enabled` and `idleThresholdHours`.

```json
{
  "1": {
    "enabled": true,
    "hours": 48
  },
  "2": {
    "enabled": true,
    "hours": 48
  },
  "enabled": true,
  "idleThresholdHours": 24
}
```

Pending and assigned use **48** hours of inactivity (after the idle label) before the resolve cron may resolve the chat; **mark idle** uses **24** hours without a message before applying the idle label.

## Feature flag

All four scenarios include an **environment** loader (alias `environment`) and a condition that `features.autoResolveChatsAutomation` is **`true`**. If the flag is off, those conditions fail and the automations do not run — even if `enabled` is **`true`** in stored config.

## The four system scenarios

Stable **system IDs** (cron `params.name` values and invariant checks):

| System ID | Role |
|-----------|------|
| `auto-resolve-chat-scenario` | Cron: `chatsList` loads pending/assigned chats with **idle** label, excluding **favorite**; foreach chat, if its condition group passes, **resolve** and **remove** idle label. |
| `auto-resolve-mark-idle-chat-scenario` | Cron: `chatsList` loads chats **without** idle, last message before `idleThresholdHours`, pending/assigned; foreach chat, **add** idle label. |
| `auto-resolve-remove-idle-label-on-message-sent-scenario` | **`domain.message.created`**: if feature flag on and chat has idle label, **remove** idle (any message direction). |
| `auto-resolve-remove-idle-label-on-chat-resolved-scenario` | **`domain.chat.resolved`**: if feature flag on and chat has idle label, **remove** idle. |

Display names in the product follow the **(Auto-Resolve) …** import titles.

### Templates vs what PATCH writes

- **Auto Resolve** (`auto-resolve-chat-scenario`): the imported template ships with **`conditions: []`**. On each PATCH where the **`1` / `2`** slice of the body **differs** from the **`attachedData`** slice on the **previous** Auto Resolve revision, the service starts a draft, **clears** each condition group if the old revision’s group count does not match the number of statuses, then **appends** for each status (in fixed order) exactly these conditions:

  1. Feature flag equals **`true`**.
  2. Cron **`name`** equals `auto-resolve-chat-scenario`.
  3. `last_message_timestamp` **less than** a `time` provider key `now-48h`-style value built from that status’s `hours` in the PATCH body (e.g. `now-24h` when `hours` is 24).
  4. Chat **status** equals the numeric status (**`1`** or **`2`**).
  5. That status’s **`enabled`** from the PATCH body is compared so the group only passes when it is **`true`**.

  It then **creates** a new revision whose **`attachedData`** is the **full config** from the request, and **activates** it when `enabled` is **`true`**.

- **Mark idle**: the imported template has only the **environment** loader and the feature + cron-name conditions; it does **not** ship the **`chatsList`** loader. Whenever **`idleThresholdHours`** in the request **differs** from the value in the **previous** Auto Resolve **`attachedData`**, the service **replaces** the mark-idle **`chatsList`** loader (alias `chats`) with filters for pending/assigned, no idle, and `lastMessageTimestamp.before` derived from the new hours, then creates and **activates** a new mark-idle revision.

- **Remove idle on message / on resolved**: PATCH does **not** rewrite their graphs; it only **inactivates** them when `enabled` is **`false`**, or **activates the latest revision** when `enabled` is **`true`** (if they were inactive).

## Cron scheduling

Two **database schedule** tasks (`ScenariosCustomTriggerCronTask` / custom scenario cron) are used so mark-idle and resolve do not share the same minute:

| `params.name` | Built-in expression |
|---------------|---------------------|
| `auto-resolve-mark-idle-chat-scenario` | `@shift(26) * * * *` (minute **26** each hour) |
| `auto-resolve-chat-scenario` | `@shift(27,59) * * * *` (minutes **27–59** each hour) |

Resolve runs **after** mark-idle in the hour so chats that **just** crossed the idle threshold can receive the idle label before the resolve pass evaluates inactivity.

**When rows are created or removed (service behavior):**

- **`enabled: false`** in the PATCH body: after inactivating all four scenarios, the service **always removes** both auto-resolve schedule rows (by matching `params.name`).
- **`enabled` goes from `false` to `true`** in stored **`attachedData`** (previous revision had `enabled` falsy/missing, new request has `enabled: true`): **after** `commit`, the service runs a **sync**. If **no** per-status rule has `enabled: true`, it **removes** those rows. If **at least one** is on and the customer config allows **database scheduled tasks**, it **ensures** each row exists with the expressions above (delete stale duplicates, insert if missing). If database scheduled tasks are **off** for the customer, it **logs a warning** and **does not** register rows — scheduled auto-resolve will not run until that is fixed.

:::note
Cron sync after PATCH is tied to the **master** `enabled` transition above. Adjusting only per-status flags while leaving `enabled: true` does not, by itself, re-run that sync path in the current implementation.
:::

## PATCH lifecycle (ordered steps)

What `PATCH` applies, in order:

1. **Invariant**: all four system scenarios must exist, or none — a partial set **errors**. If the Auto Resolve scenario is **missing**, the service **imports** all four templates as **inactive**, then continues.
2. If **`enabled`** is **`false`**: **inactivate** active revisions on all four scenarios and **remove** the two auto-resolve DB schedule rows.
3. If the **`1` / `2`** portion of the body **deep-differs** from the same keys on the previous Auto Resolve revision’s **`attachedData`**: open a draft on Auto Resolve, normalize/clear condition groups as needed, **rebuild** each status group with `setAutoResolveConditionsForStatus`, **create** a revision carrying the **full** new config in **`attachedData`**, and **activate** that revision when **`enabled`** is **`true`**.
4. If **`idleThresholdHours`** **changed** vs previous **`attachedData`**: update the mark-idle **`chatsList`** loader and publish a new **active** revision on the mark-idle scenario (revision message: idle threshold updated).
5. If **`enabled`** is **`true`**: **activate latest revision** on each scenario if it is still inactive (all four).
6. **`commit`** scenario changes.
7. If **`enabled`** flipped **off → on** relative to previous **`attachedData`**: run **cron sync** as described above.

## Who should read this

- **Integrators** calling `GET`/`PATCH` on `/system/automations/chats/auto-resolve`.
- **Support/engineering** debugging why chats are or are not auto-resolved (feature flag, `enabled`, per-status `hours`/`enabled`, idle threshold, DB schedule tasks).
- **Advanced users** correlating in-app behavior with the four system scenarios in exports or logs.

For day-to-day **bot** behavior (nodes, YAML, handoff), see the [YAML Overview](/docs/YAML/Overview) and [Bot Configuration](/docs/YAML/Bot%20Configuration).

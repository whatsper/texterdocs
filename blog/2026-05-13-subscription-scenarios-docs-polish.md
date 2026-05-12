---
title: Subscription Scenarios + Data Storage Docs Polish
date: 2026-05-13
tags: [scenarios, automation, docs, yaml]
---

Ten new **(SUB)** webhook scenarios cover the full chat lifecycle — pending, resolved (with by-agent / by-bot variants), labels, external bot toggles, and channel health — so you can subscribe an external system to any of them via a single webhook. The newly-added Data Storage and `updateCrmData` docs are refined to match the rest of the Func reference style, with worked before/after examples for every `mergingMode`.

<!-- truncate -->

## Added

- **(SUB) Chat Pending** — webhook fires when a chat moves to pending (waiting for a human agent).
- **(SUB) Chat Resolved** — webhook on any resolution, with the full chat payload.
- **(SUB) Chat Resolved by Agent** — same as above, filtered to human-driven resolutions only (`exists(agent.uid)`).
- **(SUB) Chat Resolved by Bot** — bot/auto-resolve only.
- **(SUB) Chat Labels Updated** — fires whenever labels change on a chat, with the new label set.
- **(SUB) Specific Label Added** — narrower variant that only fires for one configured label.
- **(SUB) External Bot Enabled** / **Disabled** — pair of webhooks for `externalBot` flips, useful for AI handoff observability.
- **(SUB) Channel Health Problem Created** / **Resolved** — alert/recovery pair for channel health events.
- **New trigger labels** — `Channel Health Recovered` and `Chat Labels Updated` added to the marketplace display map, with matching icons.
- **`on-pending` / `on-labels` scenario tags** — registered in the `add-scenario` skill taxonomy so future scenarios can reuse them.

## Improved

- **`updateCrmData` docs** — full rewrite to match the Func reference style. Each `mergingMode` (`replace`, `assign`, `merge`, `defaults`, `defaultsDeep`) now has a worked **Before / After** JSON example showing exactly what survives and what doesn't, plus a dedicated "reset `crmData` completely" example. `merge` is called out as the default.
- **Data Storage Overview** — restructured as a short concept page: the four functions (`get` / `set` / `list` / `delete`), the `collection` + `key` model, output paths on `%state:node.<name>%`, TTL rules, and a single Limits table.
- **`get` / `set` / `list` / `delete` pages** — rewritten consistently. Output JSON shapes shown explicitly so it's clear how to read `.data` and `.items`.
- **`get` "not found" pattern** — clarified that a missing or expired record routes to `on_complete` with `null` in state (it is **not** a failure). Pairs with a follow-up `matchExpression` using `exists(...)` for the existence check.
- **`set` TTL cap** — documented the 7-day maximum.
- **`delete` failure semantics** — documented that missing/expired keys raise an error and route to `on_failure`.

## Fixed

- **`func_id` values** — corrected across Data Storage docs: `get`, `set`, `list`, `delete` (the docs previously suggested `getData`, `setData`, `listData`, `deleteData`, which would not match the bot engine's function registry).
- **`listData` `total`** — corrected to reflect the upcoming fix: `total` counts non-expired items **on the current page** (equal to `items.length`), not the raw collection count. The existence-check example uses `total` against the first page.

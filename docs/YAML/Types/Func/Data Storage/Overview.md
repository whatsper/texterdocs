---
sidebar_position: 0
---

# Overview

### What is data storage?
A **customer-scoped** key-value store for **JSON documents**. Pick a `collection` name + `key`, write arbitrary JSON, attach optional `tags` for querying, and set a TTL so rows expire automatically. Shared across bots, flows, and scenarios for the same customer.

This is **not** the same as:
- [`storeValue`](../System/Store%20Value) — session-scoped, lives only inside the current bot run
- [`updateCrmData`](../Chat/Update%20CRM%20Data) — fields persisted **on a single chat**, not across chats

Use data storage when the same data must be readable from **multiple chats / bots / automations** (e.g. SLA timers, campaign participation, shared caches).

___
## 1. The four functions

| `func_id` | What it does |
|-----------|--------------|
| [`get`](./Get%20Data) | Read one document by `collection` + `key`. Returns `null` if missing or expired. |
| [`set`](./Set%20Data) | Upsert one document with TTL and optional tags. |
| [`list`](./List%20Data) | Query a collection (optional tag filter, pagination). |
| [`delete`](./Delete%20Data) | Remove one document by `collection` + `key`. |

All four use `func_type: dataStorage`.

___
## 2. Concepts

### `collection` + `key`
A `key` is unique within a `collection` — like a table + primary key.

Pick stable keys when the row should follow an entity. For example, use `%chat:channelInfo.id%` to make the row "the SLA record for this customer's phone number" so any future bot session for that phone can find it.

**Naming convention:** `snake_case` for collections (e.g. `sla_chats`, `campaign_events`, `draft_orders`).

### Each node's result lives at `%state:node.<node_name>%`
Every data-storage node writes its result under its own node name:

| Node | Output at `%state:node.<name>%` |
|------|---------------------------------|
| `get` | The item DTO (with `data`, `tags`, `expiresAt`, …) or `null` |
| `set` | The upserted item DTO |
| `list` | `{ items: [...], total: <number> }` |
| `delete` | `{ deleted: true }` |

Read fields with the [`state` provider](/docs/YAML/Data%20Injection/Providers#state) — e.g. `%state:node.load_sla.data.timestamp%`.

### TTL (time-to-live)
- `set` **requires** `expiresIn` + `expiresInUnit` (`minutes`, `hours`, or `days`).
- **Max TTL is 7 days.** Larger values are rejected.
- `get` returns `null` for expired rows. `list` filters expired rows out of `items` (but `total` reflects the raw match count — see [List Data](./List%20Data)).

___
## 3. Limits

| Limit | Value |
|-------|-------|
| Max TTL | 7 days |
| Max collection name length | 100 chars |
| Max key length | 200 chars |
| Max tag length | 100 chars |
| Max tags per item | 50 |
| Max `list` page size (`limit`) | 1000 (default 100) |
| Allowed characters in `collection` (for `set` and `delete`) | letters, digits, `_`, `-` |

___
## 4. When to use what

| Need | Use |
|------|-----|
| Value lives for the current bot session only | [`storeValue`](../System/Store%20Value) |
| Fields persisted on a single chat | [`updateCrmData`](../Chat/Update%20CRM%20Data) |
| Shared JSON keyed by ID, with TTL and optional tagged queries | **Data storage** ([`get`](./Get%20Data) / [`set`](./Set%20Data) / [`list`](./List%20Data) / [`delete`](./Delete%20Data)) |

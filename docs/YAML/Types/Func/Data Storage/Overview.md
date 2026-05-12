---
sidebar_position: 0
---

# Overview

**Data storage** funcs give you a **customer-scoped** key–value store for **JSON documents**: you choose a **collection** name and a **key**, write structured `data`, optionally attach **tags** for queries, and set a **time-to-live (TTL)** so rows expire automatically. They are separate from [`storeValue`](../System/Store%20Value) (session `state:store`) and from CRM payloads.

Use these nodes when the same **logical database** must be shared across **bots, flows, or automations** for that customer (for example SLA timers, campaign counters, or small shared caches).

---

## What each function does

| `func_id` | Role |
|-----------|------|
| [`getData`](./Get%20Data) | Read **one** document by `collection` + `key`. |
| [`setData`](./Set%20Data) | **Upsert** one document with TTL and optional tags. |
| [`listData`](./List%20Data) | **Query** a collection (optional tag filter, pagination). |
| [`deleteData`](./Delete%20Data) | **Remove** one document by `collection` + `key`. |

All use `func_type: dataStorage` in YAML (see each page for full syntax).

---

## Concepts you need before wiring YAML

1. **Outputs live on the node name** — Each func writes its result under `userState` for **this node’s name**. Read it with the [`state` provider](/docs/YAML/Data%20Injection/Providers#state), e.g. `%state:node.my_get.data%`, `%state:node.my_list.items%`, `%state:node.my_delete.deleted%`. See the per-function pages for exact shapes.
2. **`collection` + `key`** — A **key** is unique within a **collection** (like a table + primary key). Pick stable keys (for example `%chat:channelInfo.id%`) when the row should follow a chat or business entity.
3. **TTL is mandatory on write** — `setData` requires `expiresIn` and `expiresInUnit` (`minutes`, `hours`, or `days`). [Get Data](./Get%20Data) treats expired rows as missing (`null`). [List Data](./List%20Data) only returns **non-expired** documents; **`total` counts the same non-expired set** as `items` (full match count, while `items` is just the current page).
4. **Strict params** — Handlers validate `params` with **no extra properties**. Typos or unknown keys cause validation errors.

---

## When to use data storage vs alternatives

| Need | Prefer |
|------|--------|
| Value only for **current bot session** | [`storeValue`](../System/Store%20Value) |
| Fields should persist on the chat until you overwrite them (not a shared store) | [`updateCrmData`](../Chat/Update%20CRM%20Data) |
| **Shared** keyed JSON, TTL, optional **tagged scans** | **Data storage** funcs |

---

## Limitations and caveats

- **Customer context** — Storage is resolved using the current **customer** in the request context. If `customerId` is missing, handlers throw; that is an environment/configuration issue, not something you fix in YAML alone. ( customerId should be always present in request context)
- **Not a full database** — No arbitrary SQL, joins, or cross-customer reads. Design around **get / set / list / delete** and small JSON payloads.
- **List pagination** — `listData` caps `limit` at **1000**; default **100**. Large collections need paging with `skip` (and possibly repeated jobs or external indexing for heavy analytics).
- **No data validation** — collection data is not validated in any way, so you need to ensure the data is consistent before writing to the storage.
- **Tags and lengths** — Tag arrays and string lengths are **bounded** by product constants (enforced in the bot code). Extremely large `data` objects may cause performance issues or even errors, so keep documents focused.

---

## Next steps

- [Get Data](./Get%20Data) — single-key reads  
- [Set Data](./Set%20Data) — upserts and TTL  
- [List Data](./List%20Data) — tagged / paged queries  
- [Delete Data](./Delete%20Data) — keyed deletes  

For injecting values into `params`, see [Data injection](/docs/YAML/Data%20Injection/Overview).

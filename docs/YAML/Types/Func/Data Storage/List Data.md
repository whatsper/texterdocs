---
sidebar_position: 4
---

# List Data

### What does it do?

Queries documents in a **collection**, optionally filtered by **tags**, with **pagination** (`limit` / `skip`). Only **non-expired** documents are included. **`items`** is the current page of results; **`total`** is how many rows match the same query **counting only non-expired** documents (so it matches paging over the live set — typically `items.length` equals `limit` except on the last page, and `total` is independent of `skip`).

The result object `{ items, total }` is written to bot state under this node’s name.

:::tip

Pair with **`prompt.choice`** node or downstream logic that iterates over `%state:node.<name>.items%`. 
<br/> For a **single** key, [Get Data](./Get%20Data) is simpler and cheaper in resources.

:::

---

## 1. Syntax

```yaml
<node_name>:
  type: func
  func_type: dataStorage
  func_id: list
  params:
    collection: "<collection_name>"
  on_complete: <next_node>
```

### Required params

- `type` — must be `func`
- `func_type` — `dataStorage`
- `func_id` — `list`
- `params.collection` — non-empty string, must only contain letters, digits, `_` , `-`
- `on_complete` — next node after the query finishes

### Optional params

- `params.tags` — array of non-empty strings (per-item max length and max array size enforced by the product); omit or `null` to ignore tag filter
- `params.limit` — integer from 1 to 1000; default **100** when omitted
- `params.skip` — integer ≥ 0; default **0** when omitted
- `on_failure` — fallback node
- `department` — assigns the chat to a department
- `agent` — assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

---

## 2. Behavior notes

- **Customer scope** — the implementation resolves storage against the current **customer** (`customerId` in request context). If that context is missing, the handler throws (treat as a configuration / environment issue).
- **Expiry** — expired documents are excluded everywhere for this call: both **`items`** and **`total`** refer only to non-expired rows.
- **Additional params** — implementation rejects any unknown keys in `params`.

---

## 3. Accessing results

After the node runs:

| Path | Meaning |
|------|---------|
| `%state:node.<node_name>.items%` | Array of record DTOs (each includes the stored `data` object and metadata — align with your `setData` payloads) |
| `%state:node.<node_name>.total%` | Count of matching **non-expired** documents for the query (entire result set, not capped by `limit`) |

---

## 4. Examples

### First page of a collection

```yaml
  list_sla_candidates:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "sla_chats_collection"
      limit: 50
      skip: 0
      tags: []
    on_complete: process_batch
```

### Tagged subset with smaller page size

```yaml
  list_active_promos:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "campaign_events"
      tags:
        - "summer_sale"
      limit: 25
      skip: 0
    on_complete: foreach_promo
```

---
sidebar_position: 3
---

# Set Data

### What does it do?

Creates or updates a **JSON document** in the customer-scoped data store under `collection` + `key`, with a **time-to-live** (`expiresIn` + `expiresInUnit`). Optionally attaches **tags** for later filtering in [List Data](./List%20Data).

The upsert result is written to bot state under this node’s name (see [`state` provider](/docs/YAML/Data%20Injection/Providers#state)).

:::tip[Set Data vs Store Value]

Use **`storeValue`** ([Store Value](../System/Store%20Value)) for **session-scoped** key-value data. <br/>
Use **data storage** funcs when you need **"global" customer-scoped keyed JSON** with TTL and optional **tagged listing** across keys.

:::
---

## 1. Syntax

```yaml
<node_name>:
  type: func
  func_type: dataStorage
  func_id: set
  params:
    collection: "<collection_name>"
    key: "<record_key>"
    data:
      <arbitrary_json_object>
    expiresIn: <positive_number>
    expiresInUnit: minutes | hours | days
  on_complete: <next_node>
```

### Required params

:::info[Collection and Key Naming Convention]

For consistency, we recommend using `snake_case` for collection names, e.g `new_leads`, `potential_lovers` etc. <br/>
And stable keys like `%chat:channelInfo.id%` (unique per chat and also provides a reference for the chat).
:::

- `type` — must be `func`
- `func_type` — `dataStorage`
- `func_id` — `setData`
- `params.collection` — non-empty string, must only contain letters, digits, `_` , `-`
- `params.key` — non-empty string, must only contain letters, digits, `_` , `-`
- `params.data` — object (any JSON-serializable fields you need)
- `params.expiresIn` — number ≥ `1`
- `params.expiresInUnit` — one of `minutes`, `hours`, `days`
- `on_complete` — next node after the write succeeds

### Optional params

- `params.tags` — array of non-empty strings (each bounded by max tag length; max count enforced by the product); omit or pass `null` for no tags
- `on_failure` — fallback node
- `department` — assigns the chat to a department
- `agent` — assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

---

## 2. Behavior notes

- **Customer scope** — the storage in customer scoped against the current **customer** (`customerId` in request context). If that context is missing, the handler throws (treat as a configuration / environment issue).
- **TTL** — `expiresIn` + `expiresInUnit` are converted to milliseconds and stored as an expiry timestamp `expiresAt`. <br/>Only **non-expired** documents are included in [Get Data](./Get%20Data) and [List Data](./List%20Data).
- **Additional params** — implementation rejects any unknown keys in `params`.

---

## 3. Examples

### SLA-style timestamp row (24h TTL)

```yaml
  write_sla_row:
    type: func
    func_type: dataStorage
    func_id: set
    params:
      collection: "sla_chats_collection"
      key: "%chat:channelInfo.id%"
      data:
        timestamp: "%time:now(\"x\")%"
        chatId: "%chat:_id%"
      tags: []
      expiresIn: 24
      expiresInUnit: hours
    on_complete: next_node
```

### Tag a customer as a campaign participant

When a customer arrives to bot via a campaign, we want to track them as a participant so we can trigger a custom bot flow for them for future bot sessions.
```yaml
  save_campaign_participant:
    type: func
    func_type: dataStorage
    func_id: set
    params:
      collection: "campaign_events"
      key: "%chat:channelInfo.id%"
      data:
        source: "icq_campaign"
        customerName: "%state:node.ask_name.text%"
      tags:
        - "icq_campaign"
        - "skibidi"
        # can be used to trigger a scenario on all customers with the interest tag
        - "%state:node.ask_interest.text%" 
      expiresIn: 7
      expiresInUnit: days
    on_complete: next_node
```

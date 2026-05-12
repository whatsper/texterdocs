---
sidebar_position: 3
---

# Set Data

### What does it do?
Creates or updates (upserts) a JSON document in the customer-scoped data store under `collection` + `key`, with a required TTL. Optionally attaches `tags` for later filtering via [`list`](./List%20Data).

If a row with the same `collection` + `key` already exists and hasn't expired, it is **updated** (data, tags, and expiry all replaced). Otherwise a new row is created.
___
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
        <arbitrary_json>
      expiresIn: <positive_number>
      expiresInUnit: "minutes" | "hours" | "days"
      tags:
        - "<tag>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be `dataStorage`
- `func_id` what function are we calling (`set`)
- `params.collection` collection name. Must match `^[a-zA-Z0-9_-]+$` (letters, digits, `_`, `-`), max 100 chars
- `params.key` record key within the collection (non-empty, max 200 chars)
- `params.data` JSON object to store (any serializable fields you need)
- `params.expiresIn` positive number, paired with `expiresInUnit`. **Max combined TTL is 7 days.**
- `params.expiresInUnit` one of `"minutes"`, `"hours"`, `"days"`
- `on_complete` next node after the write succeeds

### optional params
- `params.tags` array of strings — used for tagged queries with [`list`](./List%20Data). Max 50 tags per item, each up to 100 chars
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

:::info[Naming convention]
Use `snake_case` for collection names — e.g. `new_leads`, `sla_chats`, `campaign_events`. <br/>
Use stable keys like `%chat:channelInfo.id%` (one row per phone number) so future bot sessions can find the same record.
:::

___
## 2. Output

The upserted item DTO is stored at `%state:node.<node_name>%` — same shape as [`get`](./Get%20Data#2-output) returns. Useful for chaining (e.g. reading back the `expiresAt` or `_id`).

___
## 3. Examples

### SLA timestamp row (24h TTL)
Tracks when the customer's chat went into an SLA state. Keyed by phone number so any later session finds the same record.
```yaml
  write_sla_row:
    type: func
    func_type: dataStorage
    func_id: set
    params:
      collection: "sla_chats"
      key: "%chat:channelInfo.id%"
      data:
        timestamp: "%time:now(\"x\")%"
        chatId: "%chat:_id%"
      expiresIn: 24
      expiresInUnit: "hours"
    on_complete: next_node
```

### Tag a customer as a campaign participant
Tags make this row queryable later via `list` (e.g. "all customers who joined the icq campaign in the last 7 days").
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
        - "%state:node.ask_interest.text%"
      expiresIn: 7
      expiresInUnit: "days"
    on_complete: next_node
```

### Cache an API lookup for an hour
Store an expensive lookup result so repeat conversations don't refetch.
```yaml
  cache_customer_lookup:
    type: func
    func_type: dataStorage
    func_id: set
    params:
      collection: "customer_cache"
      key: "%chat:channelInfo.id%"
      data:
        accountId: "%state:node.lookup.response.accountId%"
        tier: "%state:node.lookup.response.tier%"
      expiresIn: 60
      expiresInUnit: "minutes"
    on_complete: continue_flow
```

:::tip
Calling `set` on an existing key **replaces** `data`, `tags`, and the expiry. There is no partial update — pass the full object you want stored.
:::

:::danger
Max TTL is **7 days**. `expiresIn: 8, expiresInUnit: "days"` will fail validation.
:::

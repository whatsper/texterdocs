---
sidebar_position: 4
---

# List Data

### What does it do?
Queries documents in a `collection`, optionally filtered by `tags`, with pagination (`limit` / `skip`). Returns `{ items, total }`. Each item is the full DTO (same shape as [`get`](./Get%20Data#2-output)).

For a single keyed read, use [`get`](./Get%20Data) — it's cheaper and simpler.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "<collection_name>"
      tags:
        - "<tag>"
      limit: <1-1000>
      skip: <0+>
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be `dataStorage`
- `func_id` what function are we calling (`list`)
- `params.collection` collection name (non-empty, max 100 chars)
- `on_complete` next node after the query finishes

### optional params
- `params.tags` array of tags — items must have **all** specified tags (`AND`, not `OR`). Max 50 tags, each up to 100 chars. Omit for no tag filter
- `params.limit` page size, 1–1000. Defaults to `100`
- `params.skip` how many rows to skip. Defaults to `0`
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

Stored at `%state:node.<node_name>%`:

```json
{
  "items": [
    { "_id": "...", "collection": "...", "key": "...", "data": {...}, "tags": [...], "expiresAt": ..., "createdAt": ..., "updatedAt": ... }
  ],
  "total": 42
}
```

Common access paths:
- `%state:node.<name>.items%` — array of item DTOs (current page only, expired rows excluded)
- `%state:node.<name>.total%` — number of non-expired items **on the current page** (equal to `items.length`)
- `%state:node.<name>.items.0.data.<field>%` — a field from the first result

:::info[`total` is page-scoped, not a full match count]
`total` reflects only the non-expired items returned **on this page** — it's not the total number of matching rows across the whole collection. If you need to know whether more pages exist, request `limit + 1` and check whether you got back the extra row, or keep paging with `skip` until `items` comes back empty.
:::

___
## 3. Examples

### First page of a collection
```yaml
  list_sla_candidates:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "sla_chats"
      limit: 50
    on_complete: process_batch
```

### Tagged query with pagination
Returns rows that have **both** `icq_campaign` AND `interested` tags.
```yaml
  list_active_promos:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "campaign_events"
      tags:
        - "icq_campaign"
        - "interested"
      limit: 25
      skip: 0
    on_complete: foreach_promo
```

### Branch on whether the first page is empty
Since `total` reflects only the current page, use it to detect "nothing matched at all" by checking the first page.
```yaml
  list_drafts:
    type: func
    func_type: dataStorage
    func_id: list
    params:
      collection: "draft_orders"
      tags:
        - "%chat:channelInfo.id%"
    on_complete: check_draft_count

  check_draft_count:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'count > 0'
      count: "%state:node.list_drafts.total%"
    on_complete: show_drafts
    on_failure: no_drafts_message
```

:::tip
For tag filtering, multiple tags act as **AND** — an item must have all listed tags to match. To OR across tags, run multiple `list` nodes and combine the results downstream.
:::

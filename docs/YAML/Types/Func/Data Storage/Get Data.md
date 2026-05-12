---
sidebar_position: 2
---

# Get Data

### What does it do?
Reads a single document from the customer-scoped data store by `collection` + `key`. If the row is missing or already expired, the result is `null`. The loaded value is written to bot state under this node's name.

**A missing record is not a failure** — the node still routes to `on_complete` with `null` in state. To branch on existence, follow `get` with a [`matchExpression`](../System/Match%20Expression) (see [Examples](#3-examples)). `on_failure` only fires on configuration errors (e.g. invalid params), not on "not found".

For querying many rows at once, use [`list`](./List%20Data) instead.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: "<collection_name>"
      key: "<record_key>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be `dataStorage`
- `func_id` what function are we calling (`get`)
- `params.collection` collection name (non-empty, max 100 chars)
- `params.key` record key within the collection (non-empty, max 200 chars)
- `on_complete` next node after the read finishes

### optional params
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

The loaded item (or `null`) is stored at `%state:node.<node_name>%`. When a record exists:

```json
{
  "_id": "...",
  "collection": "sla_chats",
  "key": "972501234567",
  "data": { "timestamp": 1715520000000, "chatId": "..." },
  "tags": ["urgent"],
  "expiresAt": 1715606400000,
  "createdAt": 1715520000000,
  "updatedAt": 1715520000000
}
```

Common access paths:
- `%state:node.<name>.data%` — the stored payload object
- `%state:node.<name>.data.<field>%` — a specific field inside the payload
- `%state:node.<name>%` — the whole DTO (or `null` if not found / expired)

___
## 3. Examples

### Load a record by stable key, then branch
```yaml
  load_sla_record:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: "sla_chats"
      key: "%chat:channelInfo.id%"
    on_complete: check_if_timer_started
```

### Use injected key from another node
```yaml
  fetch_prefs:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: "user_prefs"
      key: "%state:node.ask_account_id.text%"
    on_complete: apply_theme
```

### Branch on whether a record exists (common pattern)
Because `get` routes to `on_complete` even when the item is `null`, the standard pattern is to follow it with a [`matchExpression`](../System/Match%20Expression) that checks existence, then act on `.data` only in the "found" branch.

```yaml
  smart_resolved:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: "ChatsLastAgent"
      key: "%chat:_id|toString%"
    on_complete: check_if_item_exists
    on_failure: noop_back_to_agent

  check_if_item_exists:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: "exists(item)"
      item: "%state:node.smart_resolved%"
    on_complete: handoff_to_last_agent
    on_failure: noop_back_to_agent

  handoff_to_last_agent:
    type: func
    func_type: system
    func_id: noop
    agent: "%state:node.smart_resolved.data.latestAgentUid%"
    on_complete: handoff

  noop_back_to_agent:
    type: func
    func_type: system
    func_id: noop
    on_complete: back_to_agent
```

Here `on_failure` on the `get` node only catches setup-level errors; the **"record not found"** case is handled by the `matchExpression` right after.

:::tip
Expired rows are treated the same as missing — `%state:node.<name>%` is `null`. Always follow `get` with an existence check (`matchExpression` with `exists(...)`) before reading `.data`.
:::

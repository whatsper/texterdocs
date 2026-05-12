---
sidebar_position: 5
---

# Delete Data

### What does it do?
Removes a single document from the customer-scoped data store by `collection` + `key`. If the row doesn't exist or is already expired, the node routes to `on_failure`.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: dataStorage
    func_id: delete
    params:
      collection: "<collection_name>"
      key: "<record_key>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be `dataStorage`
- `func_id` what function are we calling (`delete`)
- `params.collection` collection name. Must match `^[a-zA-Z0-9_-]+$` (letters, digits, `_`, `-`), max 100 chars
- `params.key` record key within the collection (non-empty, max 200 chars)
- `on_complete` next node after the delete succeeds

### optional params
- `on_failure` fallback node — used when the row doesn't exist or is already expired
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

On success, stored at `%state:node.<node_name>%`:
```json
{ "deleted": true }
```

___
## 3. Examples

### Clear SLA row when chat resolves
```yaml
  clear_sla_record:
    type: func
    func_type: dataStorage
    func_id: delete
    params:
      collection: "sla_chats"
      key: "%chat:channelInfo.id%"
    on_complete: resolved_message
    on_failure: resolved_message
```

### Delete using a key from user input
```yaml
  remove_draft:
    type: func
    func_type: dataStorage
    func_id: delete
    params:
      collection: "draft_orders"
      key: "%state:node.ask_draft_id.text%"
    on_complete: confirm_cancelled
    on_failure: draft_not_found
```

:::tip
Always set `on_failure` — `delete` raises an error when the row is missing or expired. If you don't care about that case (e.g. you just want to make sure it's gone), point `on_failure` at the same node as `on_complete`.
:::

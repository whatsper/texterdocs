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

### Safely delete only if the record exists (cleanup at start)
When you clean a record at the start of a bot run (e.g. removing a chat from a follow-up campaign once the customer finally replies), guard the `delete` with a [`get`](./Get%20Data) plus a [`matchExpression`](../System/Match%20Expression) existence check, so `delete` is only reached when the row is actually there:

```yaml
  check_record:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: passive_marketing_chats
      key: "%chat:_id|toString%"
    on_complete: record_exists

  record_exists:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: "exists(entry)"
      entry: "%state:node.check_record%"
    on_complete: delete_record
    on_failure: continue_normally

  delete_record:
    type: func
    func_type: dataStorage
    func_id: delete
    params:
      collection: passive_marketing_chats
      key: "%chat:_id|toString%"
    on_complete: continue_normally
```

Calling `delete` on a missing or expired row raises an error, and without an `on_failure` that error leaves the bot **stuck** on the node. The existence check above avoids calling `delete` at all when there is nothing to remove. Note the `%chat:_id|toString%` key: the chat `_id` is a Mongo ObjectId and must be passed through `|toString` (see [Overview](./Overview)).

:::tip
Always set `on_failure` — `delete` raises an error when the row is missing or expired. If you don't care about that case (e.g. you just want to make sure it's gone), point `on_failure` at the same node as `on_complete`.
:::

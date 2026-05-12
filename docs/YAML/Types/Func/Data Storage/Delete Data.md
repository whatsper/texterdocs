---
sidebar_position: 5
---

# Delete Data

### What does it do?

Deletes the document identified by **`collection` + `key`** from the customer-scoped data store (the same store as [Get Data](./Get%20Data), [Set Data](./Set%20Data), and [List Data](./List%20Data)).

On success, the node writes `{ deleted: true }` to bot state under this node’s name (for example `%state:node.<this_node_name>.deleted%`).

---

## 1. Syntax

```yaml
<node_name>:
  type: func
  func_type: dataStorage
  func_id: deleteData
  params:
    collection: "<collection_name>"
    key: "<record_key>"
  on_complete: <next_node>
```

### Required params

- `type` — must be `func`
- `func_type` — `dataStorage`
- `func_id` — `deleteData`
- `params.collection` — non-empty string, must only contain letters, digits, `_` , `-`
- `params.key` — non-empty string, must only contain letters, digits, `_` , `-`
- `on_complete` — next node after deletion succeeds

### Optional params

- `on_failure` — fallback node
- `department` — assigns the chat to a department
- `agent` — assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

---

## 2. Behavior notes

- **Customer scope** — the implementation resolves storage against the current **customer** (`customerId` in request context). If that context is missing, the handler throws (treat as a configuration / environment issue).
- **Additional params** — implementation rejects any unknown keys in `params`.

---

## 3. Examples

### Clear SLA row when chat resolves

```yaml
  clear_sla_record:
    type: func
    func_type: dataStorage
    func_id: deleteData
    params:
      collection: "sla_chats_collection"
      key: "%chat:channelInfo.id%"
    on_complete: resolved_message
```

### Delete using a key from user input

```yaml
  remove_draft:
    type: func
    func_type: dataStorage
    func_id: deleteData
    params:
      collection: "draft_orders"
      key: "%state:node.ask_draft_id.text%"
    on_complete: confirm_cancelled
```

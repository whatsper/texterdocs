---
sidebar_position: 2
---

# Get Data

### What does it do?

Loads a single **keyed document** from the customer-scoped data store (same store used by [Set Data](./Set%20Data), [List Data](./List%20Data), and [Delete Data](./Delete%20Data)). If the row is missing or **already expired**, the result is `null`.

The loaded value (or `null`) is written to bot state under this node’s name, so you can read it with the [`state` provider](/docs/YAML/Data%20Injection/Providers#state) (for example `%state:node.<this_node_name>.data%` when a record exists).

---

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

### Required params

- `type` — must be `func`
- `func_type` — `dataStorage`
- `func_id` — `getData`
- `params.collection` — non-empty string, must only contain letters, digits, `_` , `-`
- `params.key` — non-empty string, must only contain letters, digits, `_` , `-`
- `on_complete` — next node after the read finishes

### Optional params

- `on_failure` — fallback node
- `department` — assigns the chat to a department
- `agent` — assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

---

## 2. Behavior notes

- **Customer scope** — the implementation resolves storage against the current **customer** (`customerId` in request context). If that context is missing, the handler throws (treat as a configuration / environment issue).
- **TTL** — expired rows are treated as **not found** (`null` in state), same as a missing key.
- **Additional params** — implementation rejects any unknown keys in `params`.

---

## 3. Examples

### Load a record by stable key, then branch

```yaml
  load_sla_record:
    type: func
    func_type: dataStorage
    func_id: get
    params:
      collection: "sla_chats_collection"
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

:::tip

This is the **read** counterpart to [`setData`](./Set%20Data). For many keys at once, use [`listData`](./List%20Data) with `tags`, `limit`, and `skip` instead.

:::

# Add Label

### What does it do?
Manages labels on a chat. You can perform exactly **one** of three operations per node:
- `add` — appends label(s) to the current ones
- `remove` — removes label(s) from current labels
- `set` — replaces all current labels with the specified list (use an empty array to clear all labels)
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: labels
    params:
      add:
        - "<label id>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`labels`)
- `params` with exactly **one** of: `add`, `remove`, or `set`
    - `add` array of label IDs to append (at least 1)
    - `remove` array of label IDs to remove (at least 1)
    - `set` array of label IDs to replace all current labels (can be empty)
- `on_complete` next node after complete

### optional params
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Add a single label
```yaml
  add_urgent_label:
    type: func
    func_type: chat
    func_id: labels
    params:
      add:
        - "urgent"
    on_complete: handoff
```

### Add multiple labels
Adding `"important"` and `"needs_followup"` to a chat that already has `"new_lead"` results in all three labels: `"new_lead"`, `"important"`, `"needs_followup"`.
```yaml
  add_labels:
    type: func
    func_type: chat
    func_id: labels
    params:
      add:
        - "important"
        - "needs_followup"
    on_complete: handoff
```

### Remove a label
Removing `"new_lead"` from a chat with `"new_lead"`, `"important"`, `"needs_followup"` leaves `"important"` and `"needs_followup"`.
```yaml
  remove_label:
    type: func
    func_type: chat
    func_id: labels
    params:
      remove:
        - "new_lead"
    on_complete: existing_customer_menu
```

### Set labels (replaces all existing)
Setting `"only_one"` replaces whatever labels the chat currently has — the result is only `"only_one"`.
```yaml
  set_label:
    type: func
    func_type: chat
    func_id: labels
    params:
      set:
        - "only_one"
    on_complete: handoff
```

### Clear all labels
```yaml
  clear_labels:
    type: func
    func_type: chat
    func_id: labels
    params:
      set: []
    on_complete: main_menu
```

:::danger[Non-existent labels cause the entire operation to fail]
If **any** label ID in the list does not exist, the **entire operation fails** — even if other labels in the list are valid. For example, if you add `"vip"` and `"tel aviv"` but `"tel aviv"` doesn't exist as a label, neither label will be added.

If some labels might not exist, add them **one at a time** in separate nodes so that a missing label doesn't block the others.
:::

:::warning[Only one operation per node]
You **cannot** combine `add`, `remove`, and `set` in the same node. Each node accepts exactly one operation. If you need to add some labels and remove others, use separate nodes.
:::

---
sidebar_position: 5
---

# Set Display Name

### What does it do?
Sets the chat's `displayName` — a **custom chat title** stored on the chat, separate from the channel-provided `title` (which holds the WhatsApp profile name and is not changed by this node). Use it after collecting the customer's real name in the bot flow so agents see that name on the chat instead of (or alongside) the channel handle.

Accessible afterwards via `%chat:displayName%`. `%chat:title%` continues to return the original channel-provided name.

The value is **trimmed** and internal whitespace runs are collapsed to single spaces before being saved (e.g. `"  John   Doe  "` becomes `"John Doe"`). If the normalized value matches the current `displayName`, the node is a no-op.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: "<new name>"
      setOnlyIfEmpty: <boolean>
      maxLength: <1-255>
      onOverflow: "truncate" | "fail" | "skip"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`setDisplayName`)
- `params.displayName` the new display name. Empty string `""` clears the current value. Supports data injection
- `on_complete` next node after complete

### optional params
- `params.setOnlyIfEmpty` if `true`, the update is **skipped** when the chat already has a non-empty `displayName`. Default `false`
- `params.maxLength` max allowed length after whitespace normalization, integer between **1 and 255**. Default `255`
- `params.onOverflow` what to do when the normalized value exceeds `maxLength`. One of:
  - `"truncate"` — cut to `maxLength` characters (default)
  - `"skip"` — leave the existing `displayName` unchanged and continue to `on_complete`
  - `"fail"` — throw an error and route to `on_failure`
- `on_failure` fallback node (used by `onOverflow: "fail"` and on invalid params)
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Set display name from a collected first + last name
```yaml
  set_display_name:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: "%state:node.ask_first_name.text% %state:node.ask_last_name.text%"
    on_complete: main_menu
```

### Only set if the chat has no name yet
Useful when the WhatsApp profile name is already on the chat and you don't want to overwrite it with what the bot collected.
```yaml
  set_name_if_missing:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: "%state:node.ask_full_name.text%"
      setOnlyIfEmpty: true
    on_complete: main_menu
```

### Set from CRM lookup, with a length cap
```yaml
  set_name_from_crm:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: "%state:node.lookup_customer.response.data.0.fullName%"
      maxLength: 60
      onOverflow: "truncate"
    on_complete: continue_flow
```

### Fail the node on overflow
Route to `on_failure` instead of silently truncating — e.g. so the bot can re-prompt for a shorter name.
```yaml
  set_name_strict:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: "%state:node.ask_full_name.text%"
      maxLength: 40
      onOverflow: "fail"
    on_complete: confirm_name
    on_failure: ask_shorter_name
```

### Clear the display name
Pass an empty string to wipe the existing value.
```yaml
  clear_display_name:
    type: func
    func_type: chat
    func_id: setDisplayName
    params:
      displayName: ""
    on_complete: next_step
```

:::tip
The new value is reflected immediately in `%chat:displayName%` for downstream nodes (notify messages, request bodies, email subjects). It does **not** change `%chat:title%` — that remains the channel-provided name.
:::

:::tip
`setOnlyIfEmpty` and the no-op-on-unchanged behavior make this safe to place at the top of a flow — it won't repeatedly overwrite the same value or clobber a name the agent set manually.
:::

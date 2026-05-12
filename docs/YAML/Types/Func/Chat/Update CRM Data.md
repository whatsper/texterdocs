---
sidebar_position: 4
---

# Update CRM Data

### What does it do?
Writes structured fields into the current chat's `crmData`. Use it when you already have values (from prompts, `request`, transformers, or CRM responses) and need to persist them on the chat so they survive in `%chat:crmData.<key>%`, are visible to agents, and reachable by later nodes.

For regex-extracting a single field from the user's last message, use [`parseCrmData`](../System/Parse%20Crm%20Data) instead.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        <field_name>: <value>
      mergingMode: "<merging_mode>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`updateCrmData`)
- `params.data` object of CRM fields to apply
- `on_complete` next node after complete

### optional params
- `params.mergingMode` how `data` is combined with the existing `crmData`. Defaults to **`merge`**. One of: `replace`, `assign`, `merge`, `defaults`, `defaultsDeep` — see [Merging modes](#merging-modes)
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Merging modes {#merging-modes}

`mergingMode` controls how `data` combines with the chat's existing `crmData`. Default is **`merge`**.

| Value | Behavior |
|-------|----------|
| `replace` | Overwrites `crmData` with `data`. Nothing from the previous object is kept. |
| `assign` | Shallow merge — top-level keys from `data` overwrite existing ones, others stay. Nested objects are replaced, not merged. |
| `merge` | Deep merge — nested objects are merged recursively. New keys are added, existing ones are overwritten. **(default)** |
| `defaults` | Shallow — only fills top-level keys that are missing on existing `crmData`. Existing values are never overwritten. |
| `defaultsDeep` | Same as `defaults`, but applied recursively into nested objects. |

___
## 3. Examples

### Set CRM fields after collecting them in the flow
```yaml
  persist_profile:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        ticketNumber: "%state:node.ask_ticket.text%"
        lastUpdatedBy: "bot"
    on_complete: confirm_ticket
```

### Merge API response fields into crmData
```yaml
  save_lookup_to_crm:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        customSegment: "%state:node.external_lookup.response.segment%"
        riskScore: "%state:node.external_lookup.response.score%"
    on_complete: route_by_segment
```

### `replace` — wipe and start over
```yaml
  reset_crm_data:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "replace"
      data:
        ticketNumber: "12345"
        stage: "new"
    on_complete: next_step
```

:::note Result of `replace`
**Before:**
```json
{
  "leadSource": "ad",
  "customer": { "id": "A1", "name": "Dana" }
}
```
**After:**
```json
{
  "ticketNumber": "12345",
  "stage": "new"
}
```
Everything that was there before is gone — `leadSource` and `customer` are lost.
:::

### Reset `crmData` completely
Use `mergingMode: "replace"` to wipe `crmData`. Two forms — both work, with a small difference in the final state:

**Option A — omit `data` (recommended, true reset):**
```yaml
  reset_crm_data:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "replace"
    on_complete: start_fresh
```

**Option B — pass an empty object:**
```yaml
  reset_crm_data:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "replace"
      data: {}
    on_complete: start_fresh
```

:::note Result of reset
**Before:**
```json
{
  "leadSource": "ad",
  "customer": { "id": "A1", "name": "Dana" },
  "stage": "qualified"
}
```
**After (Option A — `data` omitted):**
```
undefined
```
`crmData` is **removed entirely** from the chat.

**After (Option B — `data: {}`):**
```json
{}
```
`crmData` is kept as an empty object.

In both cases all `%chat:crmData.<key>%` injections resolve to empty. Prefer Option A for a clean reset; use Option B if downstream code specifically checks for an empty object rather than absence.
:::

### `assign` — shallow overwrite
```yaml
  assign_top_level_fields:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "assign"
      data:
        customer:
          name: "Dana Cohen"
        stage: "qualified"
    on_complete: next_step
```

:::note Result of `assign`
**Before:**
```json
{
  "leadSource": "ad",
  "customer": { "id": "A1", "name": "Dana" },
  "stage": "new"
}
```
**After:**
```json
{
  "leadSource": "ad",
  "customer": { "name": "Dana Cohen" },
  "stage": "qualified"
}
```
Note that `customer.id` is **lost** — `assign` replaces the whole `customer` object instead of merging into it.
:::

### `merge` (default) — deep merge nested objects
```yaml
  deep_merge_customer:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        customer:
          name: "Dana Cohen"
          email: "dana@example.com"
        stage: "qualified"
    on_complete: next_step
```

:::note Result of `merge`
**Before:**
```json
{
  "leadSource": "ad",
  "customer": { "id": "A1", "name": "Dana" },
  "stage": "new"
}
```
**After:**
```json
{
  "leadSource": "ad",
  "customer": { "id": "A1", "name": "Dana Cohen", "email": "dana@example.com" },
  "stage": "qualified"
}
```
`customer.id` is preserved, `customer.name` is updated, `customer.email` is added.
:::

### `defaults` — only fill missing top-level keys
```yaml
  set_defaults_if_missing:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "defaults"
      data:
        stage: "new"
        leadSource: "organic"
        customer:
          name: "Unknown"
    on_complete: next_step
```

:::note Result of `defaults`
**Before:**
```json
{
  "stage": "qualified",
  "customer": { "id": "A1" }
}
```
**After:**
```json
{
  "stage": "qualified",
  "customer": { "id": "A1" },
  "leadSource": "organic"
}
```
- `stage` already existed → not overwritten
- `leadSource` did not exist → added
- `customer` already existed → kept as-is (no deep fill — `customer.name` is **not** added)
:::

### `defaultsDeep` — fill missing keys, deeply
```yaml
  deep_fill_missing:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      mergingMode: "defaultsDeep"
      data:
        customer:
          name: "Unknown"
          email: "n/a"
        stage: "new"
    on_complete: next_step
```

:::note Result of `defaultsDeep`
**Before:**
```json
{
  "stage": "qualified",
  "customer": { "id": "A1", "name": "Dana" }
}
```
**After:**
```json
{
  "stage": "qualified",
  "customer": { "id": "A1", "name": "Dana", "email": "n/a" }
}
```
- `stage` already existed → not overwritten
- `customer.name` already existed → not overwritten
- `customer.email` was missing → filled in
:::

:::tip
For **regex extraction from the user's last message** into a single `crmKey`, use [`parseCrmData`](../System/Parse%20Crm%20Data). Use `updateCrmData` when you already have structured values and need to persist them on the chat.
:::

:::tip
Saved values are available immediately as `%chat:crmData.<key>%` (including nested paths like `%chat:crmData.customer.name%`) in subsequent nodes.
:::

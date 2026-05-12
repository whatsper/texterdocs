---
sidebar_position: 4
---

# Update CRM Data

### What does it do?

Updates the **current chat’s** `crmData` in Texter’s persistence layer by calling the chats service `updateCrmData` with the payload you supply. Use it when the bot (or a prior step) has computed structured CRM fields and you need them **written back** to the chat so agents, `%chat:crmData…%` injection, and later CRM nodes all see the same data — without making a vendor CRM API call.

This complements [`parseCrmData`](../System/Parse%20Crm%20Data) (regex → one field from the last message) and CRM adapter funcs (remote read/write).

---

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

### Required node fields

- `type` — `func`
- `func_type` — `chat`
- `func_id` — `updateCrmData`
- `on_complete` — next node after the update succeeds

### `params` (validated object)

The handler validates `params` with **`additionalProperties: false`** — only the keys below are allowed.

| Param | Required | Description |
|-------|----------|-------------|
| `data` | No | Object of CRM field keys and values to apply (same logical shape as `crmData` snippets you use in `%chat:crmData.<key>%`). |
| `mergingMode` | No | How `data` is combined with existing `crmData`. Must be **exactly** one of the strings in [`dataMergingModesList`](#mergingmode-allowed-values) (Ajv `enum` on the handler). |

An empty `params: {}` is schema-valid; whether that is useful depends on the chats service implementation when `data` / `mergingMode` are omitted.

### `mergingMode` allowed values {#mergingmode-allowed-values}

Use **one** of these literals in YAML (quoted strings are fine):

| Value | Typical behavior |
|-------|------------------|
| `replace` | Replace `crmData` with `data` (no merge with the previous object). |
| `assign` | Shallow merge: top-level keys from `data` overwrite / extend existing `crmData` (lodash-style `assign`). |
| `merge` | Deep merge: nested objects are merged recursively (lodash-style `merge`). |
| `defaults` | Only fills **missing** properties on existing `crmData` from `data` (lodash-style `defaults`). |
| `defaultsDeep` | Same as `defaults`, but applied deeply for nested objects (lodash-style `defaultsDeep`). |

### Optional node fields

- `on_failure` — fallback node
- `department` — assigns the chat to a department
- `agent` — assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

---

## 2. Behavior notes

- **Customer context** — The implementation requires `context.customerId` to be a string; otherwise it throws (`Context has no Customer ID`).
- **Current chat** — The update always targets the **chat passed into the handler** (the active conversation).
- **Persistence** — The node delegates to `Chats.updateCrmData` (last argument `true` in the handler — see source). Prefer this node over only mutating in-memory state when you need the change to **stick** on the chat record.
- **Invalid params** — Ajv validation errors surface as `updateCrmData: Invalid function params - …`.

---

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

Add `mergingMode` when you need a specific merge strategy — see [allowed values](#mergingmode-allowed-values) (`replace`, `assign`, `merge`, `defaults`, `defaultsDeep`).

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

:::tip

For **regex extraction from the user’s last message** into a single `crmKey`, use [`parseCrmData`](../System/Parse%20Crm%20Data). Use **`updateCrmData`** when you already have structured values (from prompts, `request`, transformers, or CRM responses) and need to **persist** them on the chat.

:::

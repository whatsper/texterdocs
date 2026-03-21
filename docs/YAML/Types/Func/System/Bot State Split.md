---
sidebar_position: 8
---


# Bot State Split

:::danger[Legacy function]
`botStateSplit` is **legacy** but still supported. New bots should prefer:
:::

| Instead of | Use |
|------------|-----|
| `last_message` mode | [`keywordsRoute`](./Keyword%20Route) — regex on the last message (flexible matching), or [`switchNode`](./Switch%20Node) with `input` from data injection if the value is already normalized |
| `node` mode (lookup from `userState`) | [`switchNode`](./Switch%20Node) with `params.input` set to e.g. `%state:node.<node>.id%` or `%state:node.<node>.crm_id%` and `params.cases` |
| `crmField` mode | [`switchNode`](./Switch%20Node) with `params.input` set to `%chat:crmData.<field>%` and `params.cases`, plus optional `params.empty` for empty values |

`botStateSplit` remains valid for **existing bots** that already use this syntax; behavior is unchanged.



:::tip
Use this for routing based on template button replies (underscored text), CRM field values, or stored prompt results — when you are **maintaining** older YAML rather than writing new flows.
:::

### What does it do?
Routes to different nodes based on the value of the last message, a stored node result, or a CRM field. Works like a switch on bot state data. Goes to `on_failure` if no value matches.

The implementation only supports **three** ways to choose the lookup value (below). There are no separate “modes” beyond these — features like `"null"` for empty CRM fields or `id` with a leading `0` are **variations** of the `crmField` branch, and `nodeKey` vs default `id` are **variations** of the `node` branch.

___
## 1. The three routing modes

| Mode | What it uses | How the map key is chosen |
|------|----------------|---------------------------|
| **1. `last_message: true`** | Last inbound message text (or caption / postback) | Spaces → underscores, then lookup in `params` |
| **2. `node: <name>`** | `botState.userState[<name>]` | `splitNode.id` or `splitNode[nodeKey]` |
| **3. `crmField: <field>`** | `chat.crmData[<field>]` | String value, with optional `id` / `"null"` handling (see examples) |

Only **one** of `last_message`, `node`, or `crmField` applies per node (the code checks them in that order).

___
## 2. Syntax

### 1. Split by last message
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      "<answer_1>": <node_for_answer_1>
      "<answer_2>": <node_for_answer_2>
    on_failure: <fallback_node>
```

### 2. Split by node value
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      node: <source_node_name>
      nodeKey: <field to read from the node result>
      "<value_1>": <node_for_value_1>
      "<value_2>": <node_for_value_2>
    on_failure: <fallback_node>
```

### 3. Split by CRM field
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      crmField: <field_name>
      "<value_1>": <node_for_value_1>
      "<value_2>": <node_for_value_2>
      "null": <node_if_field_is_empty>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`botStateSplit`)
- Exactly one routing switch: `last_message: true`, or `node` (with optional `nodeKey`), or `crmField`
- Key-value pairs mapping possible values to destination nodes (plus mode-specific keys like `node`, `nodeKey`, `crmField`, `last_message`)

### optional params
- `nodeKey` when using `node` mode — which field of the node result to use as the lookup key. If omitted, defaults to `id`
- `"null"` when using `crmField` mode — destination node when the CRM field is empty or missing (YAML key often written as `"null"`)
- `on_failure` fallback node if no value matches
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 3. Examples

### Split by last message (template button reply)
```yaml
  mini_bot_start:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      approve: age_question_min_bot
      decline: irrelevant_user
    on_failure: agent_handoff
```

### Split by template reply with agent assignment
```yaml
  pending_customers_start:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      "כן_,_זה_מאוד_רלוונטי": relevant_pending
      לא_תודה: pending_customers_no_thanks
    agent: adigl@naderbutto.com
    on_failure: handoff_to_specific_agent_on_template_failure
```

### Split by CRM field (status-based routing)
```yaml
  split_by_status:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      crmField: status
      active: active_customer_menu
      inactive: reactivation_flow
      prospect: new_lead_flow
      "null": unknown_status_flow
    on_failure: general_menu
```

### Split by CRM field (`id` with zero-prefix fallback)
When splitting on the `id` CRM field, if the value isn't found, it automatically retries with a leading `0` prefix (e.g., `12345` → `012345`):
```yaml
  split_by_crm_id:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      crmField: id
      "12345": branch_a
      "012345": branch_a
      "67890": branch_b
    on_failure: unknown_customer
```

### Split by node value (`crm_id` from a choice)
```yaml
  split_by_branch:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      node: main_menu
      nodeKey: crm_id
      "1": branch_rishon
      "2": branch_ramat_gan
      "4": branch_jerusalem
    on_failure: general_menu
```

### Split by node value (using default `id` key)
When `nodeKey` is omitted, the node result's `id` field is used:
```yaml
  split_by_selection:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      node: ask_category
      option_a: flow_a
      option_b: flow_b
    on_failure: general_menu
```

### Template message routing (common pattern)
After sending a template message with buttons, use `botStateSplit` on the `last_message` to route based on what the user clicked:
```yaml
  template_split:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      "interested": start_onboarding
      "not_interested": resolved
      "more_info": send_info
    on_failure: main_menu
```

:::tip
For new flows, [Switch Node](./Switch%20Node) is usually clearer for many branches (`cases`, `empty`) and [Keyword Route](./Keyword%20Route) for flexible text matching (regex).
:::

:::danger
When splitting by `last_message`, spaces in the message text are replaced with underscores before lookup. Template button reply values use this same format (e.g., `"כן_,_זה_מאוד_רלוונטי"` instead of `"כן, זה מאוד רלוונטי"`). Always use underscored keys.
:::

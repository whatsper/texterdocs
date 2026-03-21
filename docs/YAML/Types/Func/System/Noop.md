---
sidebar_position: 10
---


# Noop

### What does it do?
A pass-through node that does nothing and immediately routes to `on_complete`. Useful as a placeholder, or to trigger side effects from optional params (like department or agent assignment) without any actual function logic.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: noop
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`noop`)
- `on_complete` next node to route to

### optional params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Simple pass-through
```yaml
  noop_handoff:
    type: func
    func_type: system
    func_id: noop
    on_complete: handoff
```

### Assign department then continue
```yaml
  assign_to_rishon:
    type: func
    func_type: system
    func_id: noop
    department: rishon
    on_complete: existing_sub_menu
```

### Assign agent then continue
```yaml
  assign_to_agent:
    type: func
    func_type: system
    func_id: noop
    agent: adigl@company.com
    on_complete: agent_welcome_msg
```

### Resolve without a message
```yaml
  noop_resolved:
    type: func
    func_type: system
    func_id: noop
    on_complete: resolved
```

:::tip
Use `noop` when you need to assign a department or agent without sending any message. Any node type supports `department` and `agent`, but `noop` is the cleanest way since it has no side effects.
:::

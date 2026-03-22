# Sensitive Session

### What does it do?
Starts or stops a sensitive session on the current chat. While a sensitive session is active, message content is not stored or logged — used for privacy compliance when collecting data like ID numbers, financial details, or medical information.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: sensitiveSession
    params:
      action: "start"
      ttl: 60
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`sensitiveSession`)
- `params.action` the operation to perform: `"start"` or `"stop"`
- `on_complete` next node after the operation

### optional params
- `params.ttl` time-to-live in **minutes** for the sensitive session (minimum `0`, default `60`). Only relevant when `action` is `"start"` — the session automatically expires after this duration.
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Start a sensitive session before collecting an ID number
```yaml
  mark_sensitive:
    type: func
    func_type: chat
    func_id: sensitiveSession
    params:
      action: "start"
    on_complete: ask_id_number

  ask_id_number:
    type: prompt
    prompt_type: text
    messages:
      - "Please enter your ID number"
    on_complete: verify_id
```

### Start with a custom TTL (30 minutes)
```yaml
  start_sensitive:
    type: func
    func_type: chat
    func_id: sensitiveSession
    params:
      action: "start"
      ttl: 30
    on_complete: ask_credit_card
```

### Stop the sensitive session after collecting data
```yaml
  stop_sensitive:
    type: func
    func_type: chat
    func_id: sensitiveSession
    params:
      action: "stop"
    on_complete: continue_flow
```

:::tip
Place a `"start"` node **before** any prompt that collects sensitive data, and a `"stop"` node **after** you're done collecting it. If you don't explicitly stop the session, it will expire automatically after the TTL (default 60 minutes).
:::

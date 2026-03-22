---
sidebar_position: 12
---


# Parse CRM Data

### What does it do?
Extracts a value from the user's last text message using a regex pattern and stores the first capture group into a CRM data field. Useful for parsing structured information like ticket numbers, IDs, or codes from user messages.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: parseCrmData
    params:
      regex: "<regex pattern with capture group>"
      crmKey: "<crm field name to store the result>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`parseCrmData`)
- `params.regex` a regex pattern **with a capture group** `()` — the first capture group (`results[1]`) is stored
- `params.crmKey` the CRM data field name where the matched value will be saved (accessible via `%chat:crmData.<crmKey>%`)
- `on_complete` next node if regex matched

### optional params
- `on_failure` fallback node if the regex did not match or there is no text message
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Extract a ticket number from a message
Parses a message like "(מספר פנייה:3223)" to extract `3223`:
```yaml
  parse_ticket_number:
    type: func
    func_type: system
    func_id: parseCrmData
    params:
      regex: "מספר פנייה:(\\d+)"
      crmKey: ticketNumber
    on_complete: show_ticket_details
    on_failure: ask_for_ticket_number
```

### Extract an order ID
Captures a 5+ digit number from the message:
```yaml
  parse_order_id:
    type: func
    func_type: system
    func_id: parseCrmData
    params:
      regex: "(\\d{5,})"
      crmKey: orderId
    on_complete: lookup_order
    on_failure: ask_order_number
```

### Extract an email address from a message
```yaml
  parse_email:
    type: func
    func_type: system
    func_id: parseCrmData
    params:
      regex: "([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})"
      crmKey: email
    on_complete: confirm_email
    on_failure: ask_email_again
```

### In a typical flow: ask → parse → use
```yaml
  ask_ticket:
    type: prompt
    prompt_type: text
    messages:
      - "Please send your ticket number"
    on_complete: parse_ticket

  parse_ticket:
    type: func
    func_type: system
    func_id: parseCrmData
    params:
      regex: "(\\d+)"
      crmKey: ticketId
    on_complete: fetch_ticket_details
    on_failure: ask_ticket

  fetch_ticket_details:
    type: notify
    messages:
      - "Looking up ticket #%chat:crmData.ticketId%..."
    on_complete: next_step
```

:::tip
The matched value is stored in `%chat:crmData.<crmKey>%` and can be used in subsequent nodes for messages, API calls, or routing.
:::

:::danger
The regex is applied to the **last text message** only. Make sure your regex includes a capture group `()` — only the first capture group is stored.
:::

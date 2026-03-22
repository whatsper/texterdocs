---
sidebar_position: 11
---


# Format Date

### What does it do?
Formats a date value into a specific output format. Useful for displaying dates from CRM data or API responses in a human-readable format. The result is stored as a plain string at `%state:node.<node_name>%`. Formatting is locale-aware based on the bot's current language.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: "<date value or data injection>"
      format: "<output format>"
      inputFormat: "<input format>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`formatDate`)
- `params.input` the date value to format — can be a string or integer, supports data injection
- `on_complete` next node

### optional params
- `params.inputFormat` the format of the input date. One of:
  - `"timestamp_ms"` — millisecond timestamp (default)
  - `"timestamp"` — second timestamp
  - `"iso"` — ISO 8601
  - `"rfc2822"` — RFC 2822
- `params.format` the desired output format using [Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) (default: `"ISO"` for full ISO string; use `"ISODate"` for date-only ISO)
- `params.formatTimezone` IANA timezone for the output (e.g., `"Asia/Jerusalem"`). Defaults to the customer's configured timezone
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Format an ISO date to dd/MM/yyyy
```yaml
  format_date:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: '%chat:crmData.order.DUEDATE%'
      format: "dd/MM/yyyy"
      inputFormat: "iso"
    on_complete: show_date_to_user
```

### Format with timezone
```yaml
  format_appointment_date:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: '%state:store.appointmentDate%'
      format: "dd/MM/yyyy HH:mm"
      inputFormat: "iso"
      formatTimezone: "Asia/Jerusalem"
    on_complete: confirm_appointment
```

### Format a millisecond timestamp (default inputFormat)
```yaml
  format_timestamp:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: '%state:node.get_order.response.createdAt%'
      format: "dd/MM/yyyy"
    on_complete: show_order_date
```

### Get date-only ISO string
```yaml
  format_iso_date:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: '%chat:crmData.birthDate%'
      inputFormat: "iso"
      format: "ISODate"
    on_complete: next_step
```

### Locale-aware formatting
The output respects the bot's current language (set via [Set Language](./Set%20Language)). For example, month names and day names will appear in the bot's language:
```yaml
  format_readable_date:
    type: func
    func_type: system
    func_id: formatDate
    params:
      input: '%state:store.eventDate%'
      inputFormat: "iso"
      format: "dd MMMM yyyy"
    on_complete: show_event_date
```

:::tip
The formatted result is stored as a plain string at `%state:node.<node_name>%` — not nested under a key. Use it directly in subsequent messages.
:::

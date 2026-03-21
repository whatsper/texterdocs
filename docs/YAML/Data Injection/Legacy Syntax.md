---
sidebar_position: 4
---

# Legacy Syntax

:::danger
The `%DATA_...%` syntax is **deprecated**. Use the modern `%provider:path%` syntax instead. Existing bots using legacy syntax will still work, but all new bots should use the new format.
:::

___

## Migration table

| Legacy | Modern replacement | Description |
|--------|-------------------|-------------|
| `%DATA_CRM=fieldName%` | `%chat:crmData.fieldName%` | CRM data fields |
| `%DATA_BOT_NODE=nodeName%` | `%state:node.nodeName.text%` | Text collected at a prompt node |
| `%DATA_BOT_NODE=nodeName.id%` | `%state:node.nodeName.id%` | Selected choice ID |
| `%DATA_BOT_NODE=nodeName.link%` | `%state:node.nodeName.link%` | File link from shareFile |
| `%DATA_CHAT=clientPhone%` | `%chat:channelInfo.id%` | Customer phone number |
| `%DATA_CHAT=clientPhoneNoDash%` | `%chat:channelInfo.id\|replace("-","","g")%` | Phone without dashes |
| `%DATA_CHAT=title%` | `%chat:title%` | Customer display name |
| `%DATA_CHAT=lastMessage%` | `%chat:lastMessage.text%` | Last message text |
| `%DATA_CHAT=channelId%` | `%chat:channelInfo.id%` | Channel identifier |
| `%DATA_CHAT=channelAccountId%` | `%chat:channelInfo.accountId%` | Business account ID |
| `%CLIENT_PHONE%` | `%chat:channelInfo.id%` | Customer phone (shorthand) |
| `%TITLE%` | `%chat:title%` | Customer name (shorthand) |
| `%MESSAGES%` | `%messages:latest(...)%` (+ transformers such as `join`, `hbTpl`) | Recent messages; see [Send Mail](../Types/Func/System/Send%20Mail#conversation-text-in-the-email-messages-vs-data-injection) |

___

## Examples

### Before (legacy)

```yaml
messages:
  - "Hello %DATA_CRM=firstname%, welcome back!"

params:
  phone: "%DATA_CHAT=clientPhoneNoDash%"
  name: "%DATA_CRM=name%"
  answer: "%DATA_BOT_NODE=ask_email.text%"
```

### After (modern)

```yaml
messages:
  - "Hello %chat:crmData.firstname%, welcome back!"

params:
  phone: '%chat:channelInfo.id|replace("-","","g")%'
  name: "%chat:crmData.name%"
  answer: "%state:node.ask_email.text%"
```

___

## `%MESSAGES%` — where it works and how

`%MESSAGES%` is **not** the same as `%messages:latest(...)%` data injection. It is handled as a **special case** in a few places. Behavior depends on the function:

### `sendEmail`

- Replacement runs **after** each `content` line has been processed for data injection.
- Every literal `%MESSAGES%` in the final HTML body (and in `subject`) is replaced with the built-in transcript (same message window as `amountOfMessages`).
- It may appear **on its own line or inside a longer string** (global replace on the joined body).

```yaml
# Both valid in sendEmail content:
content:
  - "%MESSAGES%"
  - "Log: %MESSAGES%"
```

### `sendWebhook` (legacy webhook)

- A param value must be **exactly** the string `%MESSAGES%` (equality check). **Embedded** text like `"foo %MESSAGES% bar"` is **not** replaced; use `%messages:latest(...)%` (or build the payload with data injection) instead.

```yaml
# Works — whole value is exactly %MESSAGES%
params:
  transcript: "%MESSAGES%"

# Does NOT trigger %MESSAGES% replacement in sendWebhook
params:
  data: "Conversation: %MESSAGES%"
```

### Modern alternative

Use **`%messages:latest(limit, sortDirection, "in"|"out"|"any", type?)%`** with transformers ([Messages provider](./Providers#messages)) for full control. For email bodies, see [Send Mail](../Types/Func/System/Send%20Mail#conversation-text-in-the-email-messages-vs-data-injection).

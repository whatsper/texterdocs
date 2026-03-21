---
sidebar_position: 9
---


# Send Mail

:::warning[Enable once per environment]
The **`sendEmail`** integration must be **enabled manually by Gil (Texter)** for each environment before it will work. You only need to request this **once per environment** — if `sendEmail` nodes already work there, you do **not** need to ask again.
:::

### What does it do?
Sends an email from the bot (from **`team@texterchat.com`**). Use it to notify internal teams, forward conversation summaries, or include form data.

___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: sendEmail
    params:
      to: "<recipient(s), comma-separated for multiple>"
      replyTo: "<recommended: business admin email>"
      subject: "<email subject>"
      content:
        - "<line 1, HTML allowed>"
        - "<line 2>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`sendEmail`)
- `params.to` recipient email address(es). **Multiple addresses:** separate with **commas** (`,`). Goes to `on_failure` if missing
- `params.subject` email subject line
- `params.content` array of strings. Each item becomes a segment of the HTML body (joined with `<br/>`). Use `""` for a blank line
- `on_complete` next node after email is sent

### optional params
- `params.replyTo` **Strongly recommended** — replies to this email will go to this inbox
- `params.cc` carbon copy — additional visible recipients; **comma-separated** if several.
- `params.bcc` blind carbon copy — **comma-separated** if several.
- `params.sendUrlsAsAttachments` whether to attach **media files from recent chat messages** to the email. Default: **`true`**.
- `params.amountOfMessages` how many recent messages are loaded for this send (default: `20`). Used for **`%MESSAGES%`**, for **media attachments** when `sendUrlsAsAttachments` is true, and matches the window `sendEmail` uses for the built-in transcript
- `on_failure` fallback node if `to` is missing or sending fails
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## Reply-To and from address

Emails are sent **from** `team@texterchat.com`. This is a **system address** — it does not receive replies.

**Always set `replyTo`** to a real business inbox (e.g. a team lead or shared mailbox). When a recipient hits "Reply", their response will go to **`replyTo`** instead of the system address, keeping the conversation inside their ecosystem.

___
## CC vs BCC

| Field | Who sees it? | When to use |
|-------|-------------|-------------|
| **To** | All recipients see who is in To | Primary recipient(s) |
| **CC** (*carbon copy*) | All recipients see the CC addresses | Loop in someone who should be aware (e.g. a manager) |
| **BCC** (*blind carbon copy*) | **Hidden** from To and CC recipients | Archive mailbox, privacy-sensitive copies |

All three (`to`, `cc`, `bcc`) accept **multiple addresses separated by commas**.

___
## sendUrlsAsAttachments detail

- **`true` (default):** Media files (images, documents, videos) from the last `amountOfMessages` chat messages are **downloaded and attached** to the email as file attachments.
- **`false`:** No media is attached. The email contains only the HTML body from your `content` lines (and `%MESSAGES%` transcript if used). Use this for lighter emails when you don't need the actual files.

This setting is about **chat media**, not about URLs you write inside `content` strings.

___
## Conversation text in the email: `%MESSAGES%` vs data injection

You can put a transcript in the body in two ways:

| Approach | What it is | Best for |
|----------|------------|----------|
| **`%MESSAGES%`** | Built-in placeholder (not data injection). Replaced after your lines are joined. | Quick default transcript; same formatting the engine uses internally (`getMessagesInSendingText`). |
| **`%messages:latest(...)%` + transformers** | Normal data injection on each `content` line (and `subject`). | New bots: control count, direction (`in` / `out` / `any`), message type, and layout (`join`, `column`, [`hbTpl`](../../../Data%20Injection/Providers#format-a-conversation-log-with-hbtpl-handlebars-template), etc.). See **[Messages provider](../../../Data%20Injection/Providers#messages)** and **[Legacy Syntax](../../../Data%20Injection/Legacy%20Syntax)**. |

Both are **supported**. `%MESSAGES%` is **not** removed from the engine; treating **`messages:latest`** as the preferred pattern for new YAML is a documentation convention for consistency with the rest of data injection.

### Order of processing (`sendEmail`)

On each `content` line (and `subject`), **data injection runs first** (`parseParamsWithBOTData`). Then `sendEmail` joins `content` with `<br/>`, applies **`%TITLE%`** / **`%CLIENT_PHONE%`**, and finally replaces every **`%MESSAGES%`** in that HTML string. So you can mix injection and `%MESSAGES%` in the same body.

### Built-in placeholders (`%MESSAGES%`, `%TITLE%`, `%CLIENT_PHONE%`)

These are **string replacements** inside `sendEmail` only (not the general `%provider:path%` syntax):

| Placeholder | Replaced with |
|-------------|---------------|
| `%MESSAGES%` | Transcript of the last `amountOfMessages` messages, using the engine’s default formatter; newlines become `<br/>`. |
| `%TITLE%` | Chat title. Prefer **`%chat:title%`** in new bots (same value, consistent with data injection). |
| `%CLIENT_PHONE%` | Client phone: **pretty** format in `subject`, **E.164** in `content`. Prefer **`%chat:channelInfo.id%`** (plus transformers) when you need one format everywhere. |

`%MESSAGES%` may appear **anywhere** in a `content` line (own line or inline). Example:

```yaml
content:
  - "Customer: %chat:title%"
  - "Phone: %chat:channelInfo.id%"
  - ""
  - "Conversation:"
  - "%MESSAGES%"
```

### Recommended: `messages:latest` in `content`

Use the **same `limit`** as `amountOfMessages` when you want the transcript to match the attachment window. Data injection uses its own `latest` arguments; align the **numeric limit** with `amountOfMessages` if that matters for your flow.

**Simple text lines (incoming only, chronological):**

```yaml
content:
  - "<p><strong>Last messages</strong></p>"
  - '%messages:latest(20,1,"in","text")|column("text")|join("<br/>")%'
```

**Rich layout:** use **`hbTpl`** as in [Format a conversation log with `hbTpl`](../../../Data%20Injection/Providers#format-a-conversation-log-with-hbtpl-handlebars-template). You can put that expression on a **single `content` line**, or use [`storeValue`](./Store%20Value) in the previous node and then `%state:store.your_key%` in `sendEmail` if the template is long or easier to maintain in state.

:::tip
`%MESSAGES%` transcript formatting may **differ** from a custom `messages:latest` + `hbTpl` block. If you need pixel-perfect alignment with another integration, build the string yourself with data injection.
:::

___
## 2. Examples

### Basic internal notification
**Reply via Texter** link format: `https://<your-env>.texterchat.com/contact/whatsapp/<business_whatsapp_number>/<client_number>/`

First number is the **business** WhatsApp, second is the **client**.

```yaml
  send_email_to_team:
    type: func
    func_type: system
    func_id: sendEmail
    params:
      to: "adar@company.co.il"
      replyTo: "admin@company.co.il"
      subject: "New inquiry - interested in insurance"
      content:
        - "Customer: %chat:channelInfo.id% - %chat:title%"
        - ""
        - "Reply via Texter: https://sandbox.texterchat.com/contact/whatsapp/972581234567/972509876543/"
        - ""
        - "%MESSAGES%"
    on_complete: msg_before_handoff
    on_failure: msg_before_handoff
```

### Multiple recipients, CC, and BCC
```yaml
  send_summary_email:
    type: func
    func_type: system
    func_id: sendEmail
    params:
      to: "support@company.com, leads@company.com"
      replyTo: "admin@company.com"
      cc: "manager@company.com, qa@company.com"
      bcc: "archive@company.com, backup@company.com"
      subject: "Customer inquiry summary"
      content:
        - "<strong>Customer:</strong> %chat:title%"
        - "Phone: %chat:channelInfo.id%"
        - ""
        - "Conversation:"
        - "%MESSAGES%"
    on_complete: handoff
```

### Email with collected form data (HTML)
```yaml
  send_lead_email:
    type: func
    func_type: system
    func_id: sendEmail
    params:
      to: "leads@company.com"
      replyTo: "sales@company.com"
      subject: "New lead - %state:node.ask_first_name.text% %state:node.ask_last_name.text%"
      content:
        - "<p>Name: %state:node.ask_first_name.text% %state:node.ask_last_name.text%</p>"
        - "<p>Phone: %chat:phone%</p>"
        - "<p>Interest: %state:node.new_customer_menu.text%</p>"
        - "<p>Preferred date: %state:node.when_to_schedule.text%</p>"
    on_complete: thank_you_message
```

### Limit conversation history and skip chat media attachments
```yaml
  send_short_summary:
    type: func
    func_type: system
    func_id: sendEmail
    params:
      to: "team@company.com"
      replyTo: "admin@company.com"
      subject: "Quick update - %chat:title%"
      amountOfMessages: 5
      sendUrlsAsAttachments: false
      content:
        - "<p>Last 5 messages:</p>"
        - "%MESSAGES%"
    on_complete: done
```

:::tip
Use `""` (empty string) in the `content` array to insert blank spacing between blocks (rendered as `<br/>` in the HTML).
:::

:::tip
Always set **`replyTo`** to a real inbox. The sender `team@texterchat.com` does not receive replies.
:::

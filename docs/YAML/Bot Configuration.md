---
sidebar_position: 2
---

# Bot Configuration

These are the top-level fields that appear **above** the `nodes:` section in a bot YAML file. They control global behavior like working hours, retry logic, and pending messages.

___

## identifier

The bot's unique name. Used when referencing or deploying a specific bot.

```yaml
identifier: whatsper-bot
```

:::tip
To use a specific bot version when chatting with the bot use the command: `/use <identifier> <version-number>` e.g. **/use whatsper-bot 10**
:::

___

## apiVersion

Always set to `v1.1` for current bots. This enables the modern data injection syntax (`%chat:...%`, `%state:...%`).

```yaml
apiVersion: v1.1
```

___

## start_node

The first node the bot executes when a new conversation begins.

```yaml
start_node: start
```

___

## working_time

Defines the business hours schedules. Used by the `checkWorkingTime` function to route differently during and outside working hours.

### Simple (single schedule)

```yaml
working_time:
  office:
    sun-thu: 08:00-17:00
```

### Multiple named schedules

```yaml
working_time:
  office:
    sun-thu: 08:00-17:00
    fri: 08:00-14:00
  customer_service:
    sun-thu: 09:00-13:00
  sales:
    sun-thu: 09:00-17:00
```

### Full week

```yaml
working_time:
  office:
    sun-sat: 09:30-18:30
```

:::tip
Use `checkWorkingTime` with `params.type` to select a named schedule. Without it, `office` is used by default.
:::

___

## prompt_retries

How many times a `prompt` node with `prompt_type: choice` will re-ask when the user gives an invalid answer, before triggering `on_failure`.

```yaml
prompt_retries: 2
```

___

## prompt_error_message

Custom text shown when the user gives an invalid answer to a choice prompt (replaces the default "I didn't understand your answer").

```yaml
prompt_error_message: "Sorry, I didn't understand. Please choose from the options."
```

___

## pending_message

A message automatically sent to the customer if they send more messages while waiting for a human agent (chat status = PENDING).

### Basic

```yaml
pending_message:
  text: "Your place in line is saved, we'll reply soon."
  everyMins: 5
```

### Multi-line with longer interval

```yaml
pending_message:
  text: "Hi again, we received your message. We're handling earlier requests
    and our response may be delayed. We're doing our best to reply as soon as
    possible. Thank you for your patience 🙏"
  everyMins: 60
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The message to send |
| `everyMins` | number | Minimum minutes between pending messages |

___

## abandoned_bot_settings

Controls what happens when a user stops responding mid-conversation with the bot.

```yaml
abandoned_bot_settings:
  first_retry:
    timeout: 7
    text:
      - "Hi, I'm waiting for your response 😊"
  abandoned:
    timeout: 12
    node: abandoned_bot_sequence_1
```

### first_retry

Sends a nudge message after `timeout` minutes of inactivity.

| Field | Type | Description |
|-------|------|-------------|
| `timeout` | number | Minutes to wait before sending the retry message. Max: 60 |
| `text` | string[] | Messages to send as a nudge |

:::tip
To disable the first retry nudge, remove or comment out the `text` lines and keep only the `timeout`.
:::

### abandoned

Triggers a specific node after `timeout` minutes if the user still hasn't responded (counted from the first retry).

| Field | Type | Description |
|-------|------|-------------|
| `timeout` | number | Minutes to wait after first_retry before abandoning. Max: 60 |
| `node` | string | Node to execute when the user is considered abandoned |

:::danger
When executing the abandoned sequence nodes, do **not** use prompt nodes that await user input. This is bad practice and may cause the chat to be stuck in `bot` status since the abandoned check task is no longer performed at this point.
:::
___

## smart_resolved

Defines which node to trigger when an agent resolves/closes a chat and the customer sends another message within the same business day (defined by `working_time.office` that is set in the bot).
Used commonly to allow customers to return back to the agent or close the chat instantly without going through the bot all over again.

```yaml
smart_resolved:
  node: smart_resolved
```

The node it points to is a regular node in the `nodes:` section:

```yaml
  smart_resolved:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "Your request has been resolved. Is there anything else?"
    choices:
      - title: "Back to agent"
        on_select: back_to_agent
      - title: "Back to bot"
        on_select: restart_bot
      - title: "All good"
        on_select: resolved
    on_complete: resolved
```
### Built-in actions
- **`back_to_agent`** - Sets chat status back to PENDING and assigns it to the agent that resolved the chat
- **`restart_bot`** - Restarts the bot session, i.e. routes to the node that is set as the `start_node`
___

## match_messages

Filters which incoming message types trigger the bot. By default, the bot responds to text, media, and postback messages.

```yaml
match_messages:
  - type in ("text", "media", "postback")
  - special.whatsapp.flow_reply
```

The second line enables the bot to process WhatsApp Flow form submissions.

___

## messages

Bot-level message overrides, typically used for customizing system messages per language.

```yaml
messages:
  prompt_wrong_answer:
    default: "I didn't understand your choice, please select from the list by typing the corresponding number."
    he: "לא הבנתי את בחירתך, בבקשה בחר/י מהרשימה על ידי הקלדת המספר המתאים."
    en: "I didn't understand your choice, please select from the list."
```

| Key | Description |
|-----|-------------|
| `prompt_wrong_answer` | Shown when user gives invalid input to a choice prompt |
| `first_retry` | Text for the first abandoned retry |
| `pending_message` | Override the pending message text |

Each key supports language codes (`he`, `en`, `es`, etc.) plus a `default` fallback.

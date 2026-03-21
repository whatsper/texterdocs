---
sidebar_position: 2
---

# Providers

Providers are the data sources available for injection. Each provider exposes different fields you can access using dot-notation paths.

___

## chat

Access fields from the current chat object.

```
%chat:fieldName%
%chat:nested.field.path%
```

### Common fields

| Path | Description | Example output |
|------|-------------|---------------|
| `chat:title` | Customer's WhatsApp display name | `"John Doe"` |
| `chat:channelInfo.id` | Customer's phone number | `"972521234567"` |
| `chat:channelInfo.accountId` | Business WhatsApp number | `"972586640430"` |
| `chat:_id` | Texter chat ID | `"64de3b15398a8e09c47a9f62"` |
| `chat:labels` | Labels applied to the chat | `["urgent", "billing"]` |
| `chat:departmentId` | Assigned department | `"customer_service"` |
| `chat:status` | Chat status (0=bot, 1=pending, 2=taken, 3=resolved, 4=bulk) | `0` |
| `chat:phone` | Customer phone (shorthand) | `"972521234567"` |
| `chat:resolvedUpdateTime` | Last time chat was resolved | `1761664598` |
| `chat:lastMessage.text` | Text of the last message | `"Thanks"` |

### CRM data (after `getCustomerDetails`)

| Path | Description |
|------|-------------|
| `chat:crmData.name` | Customer name from CRM |
| `chat:crmData.recordId` | CRM record ID |
| `chat:crmData.deepLink` | Link to CRM record |
| `chat:crmData.*` | Any field returned by the CRM adapter |

### Examples

```yaml
messages:
  - "Hi %chat:crmData.First_Name%, welcome back!"
```

```yaml
params:
  url: "https://example.com/api/chats/%chat:_id%"
```

```yaml
params:
  phone: "%chat:channelInfo.id%"
  name: "%chat:title%"
```

___

## state

Access the bot's runtime state — values stored during the conversation, node outputs, and session data.

```
%state:path%
```

### Allowed root keys

The state provider only exposes specific root keys (all others are blocked for security):

| Root key | Alias | Description |
|----------|-------|-------------|
| `node` | (alias for `userState`) | Node outputs — prompt answers, request responses, choice selections |
| `store` | — | Values saved via `storeValue` |
| `id` | — | Current bot session ID |
| `flowVersion` | — | Current bot flow version (`identifier`, `version`) |
| `latestAgentUid` | — | UID of the last human agent who handled this chat |
| `latestAgentName` | — | Display name of the last human agent |

### Common paths

| Path | Description |
|------|-------------|
| `state:node.<node_name>.text` | The text the user typed in a prompt node |
| `state:node.<node_name>.id` | The `id` of a selected choice |
| `state:node.<node_name>.crm_id` | The `crm_id` of a selected choice |
| `state:node.<node_name>.data.<field>` | A `data` field from a selected choice |
| `state:node.<node_name>.statusCode` | HTTP status from a `request` node |
| `state:node.<node_name>.response` | Full HTTP response body (when `keepResponse: true`) |
| `state:node.<node_name>.response.<path>` | Nested field from a response (e.g. `.response.data.0.firstName`) |
| `state:store.<key>` | A value saved via `storeValue` |
| `state:store.<key>.<nested>` | Nested field inside a stored JSON object (e.g. `store.customer.type`) |
| `state:id` | Current bot session ID |
| `state:latestAgentUid` | UID of the last human agent |
| `state:latestAgentName` | Display name of the last agent |
| `state:flowVersion.identifier` | Bot flow identifier |
| `state:flowVersion.version` | Bot flow version number |

### Examples

```yaml
# Use what the user typed
messages:
  - "Nice to meet you, %state:node.ask_name.text%"
```

```yaml
# Use a stored value
params:
  treatmentPlanId: "%state:store.planId%"
```

```yaml
# Access nested stored JSON
messages:
  - "Welcome back, %state:store.customer.firstName%!"
```

```yaml
# Check HTTP response status
params:
  input: "%state:node.start_get_costumer_details.statusCode%"
```

```yaml
# Access nested response data (array index with .0)
params:
  value: "%state:node.get_customer_details.response.data.0.firstName%"
```

```yaml
# Access data from a choice node
messages:
  - "Your branch: %state:node.choose_branch.data.name%"
  - "Phone: %state:node.choose_branch.data.phone%"
```

___

### previousBotSession

You can access data from the **previous bot session** (the session before the current one) using the `previousBotSession` prefix. This is useful for checking what happened in the last bot interaction — for example, whether the customer already went through a certain flow, what they selected, or which agent handled them.

```
%state:previousBotSession.<same paths as above>%
```

The same root keys are available: `node`, `store`, `id`, `flowVersion`, `latestAgentUid`, `latestAgentName`.

| Path | Description |
|------|-------------|
| `state:previousBotSession.id` | Previous bot session ID |
| `state:previousBotSession.node.<node_name>.text` | A prompt answer from the previous session |
| `state:previousBotSession.store.<key>` | A stored value from the previous session |
| `state:previousBotSession.latestAgentUid` | Last agent UID from the previous session |
| `state:previousBotSession.latestAgentName` | Last agent name from the previous session |
| `state:previousBotSession.flowVersion.identifier` | Which bot flow ran in the previous session |

#### Examples

```yaml
# Check if the customer had an accountId stored in the previous session
params:
  input: "%state:previousBotSession.store.accountId%"
```

```yaml
# Check what the customer chose last time
params:
  expression: "prevChoice == 'existing'"
  prevChoice: "%state:previousBotSession.node.ask_if_customer.text%"
```

```yaml
# Get the language from the previous session
params:
  input: "%state:previousBotSession.store.language%"
  cases:
    hebrew: greet_hebrew
    english: greet_english
```

:::tip
`previousBotSession` is populated when a bot session ends (handoff or resolved). It contains the full state from the session that just ended. If the customer has never been through the bot before, it will be empty/undefined.
:::

:::danger
`state:previousBotSession` (with no subkey) returns `undefined`. You must always access a specific field like `state:previousBotSession.id` or `state:previousBotSession.store.someKey`.
:::

___

## messages

Query messages from the current conversation. Two methods are available: `latest` and `botSession`. Both **always return an array** — even for a single message, you must use `.0` to access the first element.

### Methods

| Method | Description |
|--------|-------------|
| `messages:latest(...)` | Get the most recent messages from the entire conversation |
| `messages:botSession(...)` | Get all messages from a specific bot session |

___

### `messages:latest`

```
%messages:latest(count, order, direction, type)%
```

#### Arguments

| Argument | Required | Default | Description | Values |
|----------|----------|---------|-------------|--------|
| `count` | Yes | — | Number of messages to return (1–1000) | Any integer |
| `order` | No | `-1` | Sort order | `1` = ascending (oldest first), `-1` = descending (newest first) |
| `direction` | No | `"any"` | Filter by direction | `"in"` = incoming only, `"out"` = outgoing only, `"any"` = both |
| `type` | No | — | Filter by message content type | `"text"`, `"media"`, `"postback"`, `"contacts"`, `"location"`, `"buttons"`, `"list"`, `"special"` |

___

### `messages:botSession`

Returns all messages that belong to a specific bot session. Useful for getting only the messages exchanged during the current (or previous) bot flow run, ignoring older conversation history.

```
%messages:botSession%
%messages:botSession("sessionId")%
```

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `sessionId` | No | Current or previous bot session ID | The bot session ID to fetch messages for |

When no `sessionId` is provided, it defaults to the **current bot session ID** (`botState.id`). If that's not available, it falls back to the **previous bot session ID** (`previousBotSession.id`).

Returns messages sorted by timestamp (newest first). System messages are excluded.

#### Examples

```yaml
# Get all messages from the current bot session
value: "%messages:botSession%"
```

```yaml
# Store current session messages and extract text
value: '%messages:botSession|column("text")|join("\n")%'
```

:::danger[No nested data injection]
You **cannot** pass a `%...%` expression as an argument inside another `%...%`. For example, `%messages:botSession("%state:previousBotSession.id%")%` will **not** work. When no argument is provided, `botSession` defaults to the current or previous bot session ID automatically, which covers most use cases.
:::

### Return value — always an array

Both `messages:latest(...)` and `messages:botSession(...)` **always return an array of message objects**, even when only 1 message matches. This means:

- To access a field on a single message, you must index into the array first
- After storing the result with `storeValue`, access fields using `.0.fieldName` for the first element

```yaml
# WRONG — this gives you the array, not the text
value: "%messages:latest(1,-1,"in")%.text"

# CORRECT — index with .0 to get the first message's text
value: "%state:store.pastMessages.0.text%"
```

### Message object fields

Each message in the array is a full message object. The commonly used fields are:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique message ID |
| `text` | string | Message body text |
| `type` | string | Content type: `"text"`, `"media"`, `"postback"`, `"contacts"`, `"location"`, `"buttons"`, `"list"`, `"special"` |
| `direction` | string | `"incoming"` or `"outgoing"` |
| `timestamp` | number | When the message was created (epoch ms) |
| `agent` | string | Who sent it: `"Bot"` or an agent UID |
| `status` | number | Delivery state: 0=Sent, 1=Accepted, 2=Delivered, 3=Seen, 4=Failed |
| `parent_chat` | string | Chat ID this message belongs to |
| `postback` | object | Selected button/list item: `{ payload, title }` (only when `type: "postback"`) |
| `special` | object | Template/broadcast data (only when `type: "special"`) |
| `media` | array | Media attachments (only when `type: "media"`) — each has `mediaType`, `fileId`, `filename`, `caption` |
| `botSessionId` | string | Bot session ID tied to this message |
| `metadata` | object | Extra metadata — includes `botMsgInfo` (which bot node generated the message), `triggeredBot`, etc. |

___

### Accessing fields after storing

A common pattern is to store messages with `storeValue`, then access individual fields via the stored array:

```yaml
  store_past_messages:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "pastMessages"
      value: '%messages:latest(20,1,"in")%'
    on_complete: check_first_message

  check_first_message:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'firstMessageId == lastMessageId'
      firstMessageId: "%state:store.pastMessages.0._id%"
      lastMessageId: "%chat:lastMessage.id%"
    on_complete: is_first_message
    on_failure: is_not_first_message
```

In the example above, `%state:store.pastMessages.0._id%` accesses the `_id` field of the first (oldest, since order is `1`) message in the stored array. The `.0` is the array index.

___

### Using with transformers

Since the result is an array, you'll typically chain array transformers to extract what you need:

#### Extract a single field from each message with `column`
```yaml
# Get just the text of the last 10 incoming messages
value: '%messages:latest(10,-1,"in")|column("text")%'
```

#### Combine with `join` for a flat string
```yaml
# 10 latest incoming messages as newline-separated text
value: '%messages:latest(10,-1,"in")|column("text")|join("\n")%'
```

#### Get postback payloads
```yaml
# Get the payload of the last incoming postback (button click)
value: '%messages:latest(1,1,"in","postback")|column("postback.payload")|join("\n")%'
```

#### Get message IDs
```yaml
# Store the ID of the last outgoing message
value: '%messages:latest(1,-1,"out")|column("_id")|join("\n")%'
```

#### Extract the `special` field (e.g., Facebook/Instagram referral)
```yaml
special: '%messages:latest(1,-1,"in")|column("special")%'
```

#### Format a conversation log with `hbTpl` (Handlebars template)
This is the **recommended** way to build a custom conversation log (compared to the **`%MESSAGES%`** shortcut in [`sendEmail`](../Types/Func/System/Send%20Mail)). You can often put the same expression on a `sendEmail` `content` line; use [`storeValue`](../Types/Func/System/Store%20Value) first if the template is easier to maintain in state.
```yaml
  store_messages:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "messages"
      value: |
        %messages:latest(12,1,"any","text")|hbTpl("
        {{#each .}}
        [{{date timestamp}}] {{#when direction 'eq' 'incoming'}}{{provide 'chat' 'title'}}{{else}}{{agent}}{{/when}}:
        {{text}}

        {{/each}}
        ")%
    on_complete: send_email_with_messages
```

___

### Common patterns

#### Check if a message came from a Facebook/Instagram ad
```yaml
  check_if_from_ad:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'not empty(special.0.facebook.referral)'
      special: '%messages:latest(1,-1,"in")|column("special")%'
    on_complete: store_social_source
    on_failure: regular_start
```

#### Check if this is the user's very first message ever
```yaml
  store_all_incoming:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "pastMessages"
      value: '%messages:latest(20,1,"in")%'
    on_complete: check_first_message

  check_first_message:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'firstMessageId == lastMessageId'
      firstMessageId: "%state:store.pastMessages.0._id%"
      lastMessageId: "%chat:lastMessage.id%"
    on_complete: first_time_user
    on_failure: returning_user
```

#### Store the last outgoing message (for template tracking)
```yaml
  store_last_outgoing:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "lastOutMsg"
      value: '%messages:latest(1,-1,"out")%'
    on_complete: next_step
```

:::danger
`messages:latest(...)` **always returns an array**. Even `messages:latest(1,...)` returns an array with one element. To access a field on the single message, you must either:
- Use `|column("fieldName")` to extract that field from each element, or
- Store the result and access it as `%state:store.key.0.fieldName%` (`.0` = first element)
:::

:::tip
The `type` filter is optional but recommended. Use `"text"` to ignore media/postback messages, or `"postback"` to specifically get button-click responses.
:::

___

## time

Access the current date/time or format a given date. Supports arithmetic operations (add/subtract time), custom output formats, and timezone conversion. Powered by [Luxon](https://moment.github.io/luxon/).

### Base keys

There are two base keys:

| Key | Description | Arguments |
|-----|-------------|-----------|
| `now` | Current date/time | `(format, timezone)` — both optional |
| `date` | A specific date you provide | `(dateString, format, timezone)` — dateString required |

**Defaults** — when omitted, `format` defaults to `dd-MM-yyyy HH:mm:ss` and `timezone` defaults to `utc`.

```
%time:now%
%time:now("format")%
%time:now("format","timezone")%
%time:date("dateString")%
%time:date("dateString","format","timezone")%
```

___

### Arithmetic operations

You can add or subtract time directly in the key using `+` or `-` followed by a number and a unit. Multiple operations can be chained.

| Unit | Meaning | Example |
|------|---------|---------|
| `y` | Years | `+1y`, `-2y` |
| `M` | Months | `+3M`, `-1M` |
| `w` | Weeks | `+2w`, `-1w` |
| `d` | Days | `+7d`, `-3d` |
| `h` | Hours | `+5h`, `-12h` |
| `m` | Minutes | `+30m`, `-15m` |
| `s` | Seconds | `+45s`, `-10s` |

Arithmetic works on both `now` and `date`:

```
%time:now+3d%                      # 3 days from now
%time:now-2h%                      # 2 hours ago
%time:now+1y-3M+15d%               # 1 year, minus 3 months, plus 15 days from now
%time:date+1w("2025-06-01T10:00:00Z")%  # given date + 1 week
```

:::danger
Note the uppercase `M` for months vs lowercase `m` for minutes. `+3M` = 3 months, `+3m` = 3 minutes.
:::

___

### Format tokens

The format string uses [Luxon formatting tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens). There is also one special keyword: `iso`.

#### Common tokens

| Token | Output | Example |
|-------|--------|---------|
| `yyyy` | 4-digit year | `2026` |
| `yy` | 2-digit year | `26` |
| `MM` | Month (zero-padded) | `03` |
| `MMMM` | Full month name | `March` |
| `MMM` | Short month name | `Mar` |
| `dd` | Day of month (zero-padded) | `18` |
| `d` | Day of month | `8` |
| `EEEE` | Full weekday name | `Wednesday` |
| `EEE` | Short weekday name | `Wed` |
| `HH` | Hour 24h (zero-padded) | `14` |
| `hh` | Hour 12h (zero-padded) | `02` |
| `mm` | Minutes (zero-padded) | `05` |
| `ss` | Seconds (zero-padded) | `09` |
| `a` | AM / PM | `PM` |
| `x` | Unix timestamp (milliseconds) | `1742313600000` |
| `X` | Unix timestamp (seconds) | `1742313600` |

#### Special format

| Value | Output |
|-------|--------|
| `iso` | Full ISO 8601 string, e.g. `2026-03-18T14:05:09.000+02:00` |

If no format is provided, the default is `dd-MM-yyyy HH:mm:ss` → e.g. `18-03-2026 14:05:09`.

___

### Timezones

The second (or third for `date`) argument sets the timezone. Any [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) is supported, plus one shorthand:

| Value | Timezone |
|-------|----------|
| `utc` | UTC (default) |
| `ist` | Israel Standard Time (`Asia/Jerusalem`) |
| `America/New_York` | US Eastern |
| `Europe/London` | UK |
| Any IANA name | e.g. `Asia/Tokyo`, `Europe/Berlin`, etc. |

___

### Examples

#### Current time with default format (UTC)
```yaml
value: "%time:now%"
# → "18-03-2026 12:05:09"
```

#### Current time in Israel timezone
```yaml
value: '%time:now("dd-MM-yyyy HH:mm:ss","ist")%'
# → "18-03-2026 14:05:09"
```

#### Current date only (Israel)
```yaml
value: '%time:now("dd/MM/yyyy","ist")%'
# → "18/03/2026"
```

#### Current time in ISO format
```yaml
value: '%time:now("iso","ist")%'
# → "2026-03-18T14:05:09.000+02:00"
```

#### Unix timestamp in milliseconds
```yaml
value: '%time:now("x")%'
# → "1742313909000"
```

#### Unix timestamp in seconds (as integer)
```yaml
value: '%time:now("X")|parseInt%'
# → 1742313909
```

#### 5 days ago as unix ms timestamp
```yaml
value: '%time:now-5d("x")|parseInt%'
```

#### 7 days ago as unix seconds
```yaml
value: '%time:now-7d("X")|parseInt%'
```

#### 1 hour from now in Israel time
```yaml
value: '%time:now+1h("HH:mm","ist")%'
# → "15:05"
```

#### Tomorrow's date
```yaml
value: '%time:now+1d("dd/MM/yyyy","ist")%'
# → "19/03/2026"
```

#### Complex arithmetic: 1 year minus 3 months plus 15 days
```yaml
value: '%time:now+1y-3M+15d("dd-MM-yyyy","ist")%'
```

#### Format a specific date string
```yaml
value: '%time:date("2025-06-15T10:30:00Z","dd/MM/yyyy HH:mm","ist")%'
# → "15/06/2025 13:30"
```

#### Format a date from an API response

To format a date stored in state or returned from an API, use the [`formatDate`](/docs/YAML/Data%20Injection/Transformers#formatdate) transformer instead:

```yaml
value: '%state:node.get_appointment.response.date|formatDate("dd/MM/yyyy HH:mm","ist")%'
```

:::danger[No nested data injection]
You **cannot** pass a `%...%` expression as an argument inside another `%...%`. For example, `%time:date("%state:store.myDate%")%` will **not** work. Use `time:date` only with hardcoded date strings, and use the `formatDate` transformer to format dynamic dates from state or API responses.
:::

#### Year and month name
```yaml
value: '%time:now("MMMM yyyy","ist")%'
# → "March 2026"
```

#### Weekday name
```yaml
value: '%time:now("EEEE","ist")%'
# → "Wednesday"
```

:::tip
When using `time` in a `storeValue` or `request` param that expects a number (e.g., a unix timestamp), pipe it through `|parseInt` to convert the string result to an integer.
:::

:::tip
The `ist` timezone shorthand is a convenience for Israel Standard Time (`Asia/Jerusalem`). For any other timezone, use the full IANA name.
:::

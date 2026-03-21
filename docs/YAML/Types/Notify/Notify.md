# Notify

### What does it do?
Sends a message to the user without waiting for an answer.
___
## 1. Syntax
```yaml
  <node_name>:
    type: notify
    messages:
      - "<message>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `messages` list of messages to send in a single message block
- `on_complete` next node to do after complete

### optional params
- `media` a link to an image or media file (also see [Send Media](/docs/YAML/Types/Notify/Send%20Media))
- `delay_complete_seconds` time in seconds to wait before moving to the next node (integer, `1`–`60`)
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Simple message
```yaml
  send_message:
    type: notify
    messages:
      - "A message for the user"
    on_complete: handoff
```

### Greeting with dynamic data
```yaml
  greet_customer:
    type: notify
    messages:
      - "Hello %chat:crmData.First_Name%, welcome back!"
    on_complete: main_menu
```

### Dynamic message from stored value
```yaml
  start_msg:
    type: notify
    messages:
      - "%state:store.account.startMsg%"
      - "*הרשת המובילה בישראל להסרת שיער בלייזר וטיפולי קוסמטיקה מתקדמים.*"
    on_complete: get_customer_details
```

### Multi-line with empty lines as separators
```yaml
  outside_working_hours:
    type: notify
    messages:
      - "תודה"
      - "קיבלנו את פנייתך, נחזור אליך בהקדם בשעות הפעילות"
      - ""
      - "אנו פעילים בימים א-ה בין השעות 9:00 ועד 18:00"
      - "ובימי ו' וערבי חג בין השעות 9:00 ועד 14:00"
    on_complete: handoff
```

### Multiple messages in sequence
```yaml
  onboarding_intro:
    type: notify
    messages:
      - "Welcome to our service!"
      - "We're here to help you with anything you need."
      - "Let's get started."
    on_complete: main_menu
```

### Message before handoff with department
```yaml
  transfer_message:
    type: notify
    department: customer_service
    messages:
      - "Transferring you to our team. Please hold on..."
    on_complete: handoff
```

### Assign to a specific agent
```yaml
  handoff_to_agent:
    type: notify
    messages:
      - "הפניה התקבלה ותטופל בהקדם"
      - "תודה"
    agent: geula@naderbutto.com
    on_complete: handoff
```

### With delay
```yaml
  processing_message:
    type: notify
    messages:
      - "Processing your request, please wait..."
    delay_complete_seconds: 3
    on_complete: show_result
```

### Referral with dynamic branch info
```yaml
  refer_customer_to_branch:
    type: notify
    messages:
      - "לקבלת מענה מסניף %state:node.choose_branch.data.name% פנו למספר הסניף בקישור כאן למטה 👇"
      - "https://wa.me/%state:node.choose_branch.data.phone%?text=היי,+אשמח+לדבר+עם+נציגה+מהסניף"
    on_complete: resolved
```

:::tip
Each item in `messages` is sent as a separate bubble in the same message block. Use an empty string `""` to create a blank line between sections.
:::

:::warning[Max delay is 60 seconds]
`delay_complete_seconds` accepts an integer between `1` and `60`. Values above 60 will cause timeout problems and fail validation.
:::

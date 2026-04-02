---
sidebar_position: 1
---

# Text

### What does it do?
Sends a message to the user and **waits** for an answer. The user's response is stored and can be accessed later via `%state:node.<node_name>.text%`.
___
## 1. Syntax
#### prompt - text:
```yaml
  <node_name>:
    type: prompt
    prompt_type: text
    messages:
      - "<message>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `prompt_type` what type of prompt (`text`)
- `messages` list of messages to send in a single message block
- `on_complete` next node after complete

### optional params
- `delay_complete_seconds` number of seconds to delay before moving to the next node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Basic text input
```yaml
  ask_name:
    type: prompt
    prompt_type: text
    messages:
      - "What is your name?"
    on_complete: ask_age_range
```

### Collecting a sequence of fields
```yaml
  ask_first_name:
    type: prompt
    prompt_type: text
    messages:
      - "מה שמך הפרטי?"
    on_complete: ask_last_name

  ask_last_name:
    type: prompt
    prompt_type: text
    messages:
      - "מה שם המשפחה?"
    on_complete: store_new_customer_details
```
Then access the values with `%state:node.ask_first_name.text%` and `%state:node.ask_last_name.text%`.

### Using previous answers in the next message
```yaml
  ask_last_name:
    type: prompt
    prompt_type: text
    messages:
      - "Nice to meet you, %state:node.ask_first_name.text%! What is your last name?"
    on_complete: ask_email
```

### Multi-line message with instructions
```yaml
  ask_phone_number:
    type: prompt
    prompt_type: text
    messages:
      - "לא הצלחנו לזהות אותך לפי מס' הטלפון שפנית ממנו."
      - "על איזה טלפון כרטיס הלקוח שלך אצלנו?"
      - "_לצורך הזיהוי, אנא כתבו את המספר המלא עם הספרה 0 בהתחלה, לדוגמא '0529876543'_"
    on_complete: get_customer_details_by_given_phone
```

### With delay before next node
```yaml
  ask_phone:
    type: prompt
    prompt_type: text
    messages:
      - "Please enter your phone number"
    delay_complete_seconds: 2
    on_complete: verify_phone
```

### Open-ended question before handoff
```yaml
  how_can_we_help:
    type: prompt
    prompt_type: text
    messages:
      - "איך אפשר לעזור?"
    on_complete: check_working_hours
```

:::tip
The user's answer is stored at `%state:node.<node_name>.text%`. For example, if the node is called `ask_name`, access the answer with `%state:node.ask_name.text%`.
:::

:::tip
Each item in `messages` is sent as a separate bubble in the same message block. Use multiple items for distinct lines/paragraphs, or a single item with line breaks for paragraph-style text.
:::

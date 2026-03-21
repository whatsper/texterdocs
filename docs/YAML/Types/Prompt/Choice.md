---
sidebar_position: 2
---

# Choice

### What does it do?
Sends a message to the user and **waits** for an answer. Presents a set of choices the user can select from. Choices can be static (hardcoded in the YAML) or dynamic (populated from CRM/API data at runtime).
___
## 1. Syntax

### With `on_select` (per-choice routing)
```yaml
  <node_name>:
    type: prompt
    prompt_type: choice
    messages:
      - "<message>"
    choices:
      - title: "<title_name>"
        on_select: <node_for_this_choice>
      - title: "<title_name>"
        on_select: <node_for_this_choice>
    on_failure: <fallback_node>
```

### Without `on_select` (all choices go to `on_complete`)
```yaml
  <node_name>:
    type: prompt
    prompt_type: choice
    messages:
      - "<message>"
    choices:
      - title: "<title_name>"
      - title: "<title_name>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `prompt_type` what type of prompt (`choice`)
- `messages` list of messages to send in a single message block
- `choices` list of choices (minimum 2) — see [Choice Properties](#choice-properties) below
- `on_failure` fallback node when the user exceeds retries with invalid answers

### optional params
- `on_complete` node to go to after a choice is selected. **Required** when choices don't have `on_select` — in that case, any selection goes to this node
- `interactive` display mode: `buttons` or `list`
- `list_title` title text shown on the list button (only for `interactive: list`, max 20 characters)
- `retries` override the bot-level `prompt_retries` for this node (set to `0` to go to `on_failure` immediately on invalid input)
- `hide_summary` if `true`, hides the choice summary in the chat
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Choice Properties {#choice-properties}

Each item inside `choices` supports the following properties:

| Property | Required | Description |
|----------|----------|-------------|
| `title` | Yes | The text shown to the user for this choice |
| `on_select` | No | Node to go to when this specific choice is selected. If omitted from **all** choices, any selection goes to `on_complete` |
| `id` | No | An internal identifier stored in bot state. Access with `%state:node.<node_name>.id%` |
| `crm_id` | No | A CRM-facing identifier stored alongside the choice. Access with `%state:node.<node_name>.crm_id%` |
| `department` | No | Assigns the chat to a department when this choice is selected |
| `agent` | No | Assigns the chat to a specific agent when this choice is selected |
| `data` | No | An arbitrary object of extra data attached to the choice. Access fields with `%state:node.<node_name>.data.<field>%` |

:::danger[Two routing modes — don't mix them]
- **With `on_select`**: every choice must have `on_select`. The bot routes to the selected choice's `on_select` node. `on_failure` is **required**. `on_complete` is only used if the user types free text that doesn't match any choice.
- **Without `on_select`**: no choice should have `on_select`. Any selection goes to `on_complete`. `on_complete` is **required**.
:::

___
## 3. Dynamic Choices with `list`

You can populate choices dynamically from CRM data, API responses, or bot state using the `list` keyword:

```yaml
choices:
  - list: "<data injection expression>"
  - title: "Fallback option"
    on_select: fallback_node
```

The `list` item injects an array of choices at runtime. You can mix it with static choices — static items (like a fallback) appear alongside the dynamic ones.

### Dynamic list from CRM data
```yaml
  select_service:
    type: prompt
    prompt_type: choice
    messages:
      - "אנא בחר/י שירות"
    choices:
      - list: "%chat:crmData.services%"
      - title: "מעוניינ/ת לקבוע טיפול במספר אזורים"
        on_select: check_working_hours
    on_complete: store_service_id
    on_failure: on_failure_handoff
```

### Dynamic list from API response
```yaml
  select_order:
    type: prompt
    prompt_type: choice
    messages:
      - "באיזו הזמנה מדובר?"
    choices:
      - list: "%state:node.check_customer_orders.response.orders%"
      - title: "ההזמנה שלי לא כאן"
        on_select: no_orders
    on_complete: check_working_hours_order_chosen
    on_failure: on_failure_handoff
```

### Dynamic list from state using `map` transformer
When the API response is an array of objects that don't match the expected `title`/`id`/`crm_id` shape, use the `map` transformer to reshape them:
```yaml
  select_order:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "Your orders"
    messages:
      - "Select an order to view details:"
    choices: 
      - list: '%state:node.get_orders.response.orders|map("summary::title","Order_ID::id","Order_Date::crm_id")%'
      - title: "ההזמנה שלי לא כאן"
        on_select: no_orders
    on_complete: show_order_details
    on_failure: no_orders
```

### Dynamic list of doctors
```yaml
  select_doctor:
    type: prompt
    prompt_type: choice
    messages:
      - "בחירת מטפלת"
    choices:
      - list: "%DATA_CRM=doctors%"
      - title: "לתפריט הראשי"
        on_select: existing_sub_menu
    on_complete: store_doctor_id_choice
    on_failure: on_failure_handoff
```

:::tip
The `list` expression must resolve to an array of objects. Each object should have a `title` property (displayed to the user). It can also have `id`, `crm_id`, and other fields that get stored in bot state.
:::

___
## 4. Examples

### Buttons
Up to 3 buttons, each button can contain up to 20 characters.
```yaml
  ask_age_range:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "What is your age range?"
    choices:
      - title: "12-18"
        on_select: teen_questions
      - title: "18+"
        on_select: adult_questions
    on_failure: agent_handoff
```

### List
Up to 10 choices, each can contain up to 24 characters. `list_title` is the text on the list button (max 20 chars).
```yaml
  ask_city:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "Choose city"
    messages:
      - "In what city do you live?"
    choices:
      - title: "Jerusalem"
        on_select: jerusalem_menu
      - title: "Tel-Aviv"
        on_select: tel_aviv_menu
      - title: "Ramat-Gan"
        on_select: ramat_gan_menu
      - title: "Other"
        on_select: main_menu
    on_failure: general_menu
```

### Numbers (no interactive)
Without `interactive`, choices are sent as a numbered text list. The user replies by typing a number (1, 2, 3...). No character limit.
```yaml
  which_treatment:
    type: prompt
    prompt_type: choice
    messages:
      - "באיזה טיפול התעניינת?"
    choices:
      - title: "הסרת שיער בלייזר נשים"
      - title: "הסרת שיער בלייזר גברים"
      - title: "טיפול פנים"
      - title: "פדיקור"
      - title: "מניקור"
      - title: "עיצוב גבות"
    on_complete: store_chosen_treatment
    on_failure: on_failure_handoff
```

### All choices to the same node (no `on_select`)
When you don't need per-choice routing — every selection goes to `on_complete`:
```yaml
  ask_feedback:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "How was your experience?"
    choices:
      - title: "Great"
      - title: "OK"
      - title: "Not good"
    on_complete: save_feedback
    on_failure: handoff_msg
```

### Choices with `id` and `data`
Attach extra identifiers and metadata to each choice. Access them later via `%state:node.<node_name>.id%` and `%state:node.<node_name>.data.<field>%`:
```yaml
  choose_branch:
    type: prompt
    prompt_type: choice
    messages:
      - "נא לבחור את הסניף הרלוונטי"
    choices:
      - title: "קניון שרונים, הוד השרון"
        id: "13"
        data:
          phone: "972547702079"
          name: "קניון שרונים"
      - title: "כפר שמריהו, החורש 2"
        id: "11"
        data:
          phone: "972542953026"
          name: "כפר שמריהו"
      - title: "נתניה - רמת פולג"
        id: "7"
        data:
          phone: "972547337613"
          name: "נתניה רמת פולג"
    on_complete: store_chosen_branch
    on_failure: check_client_type_before_handoff
```
Then later in the flow:
```yaml
  refer_customer_to_branch_number:
    type: notify
    messages:
      - "לקבלת מענה מסניף %state:node.choose_branch.data.name% פנו למספר:"
      - "https://wa.me/%state:node.choose_branch.data.phone%"
    on_complete: resolved
```

### Choices with `crm_id`
Use `crm_id` to store an identifier for CRM purposes. Access it with `%state:node.<node_name>.crm_id%`:
```yaml
  select_course:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "תפריט בחירה"
    messages:
      - "בחרו את הקורס הרצוי"
    choices:
      - title: "דירקטורים"
        id: "df5be8ae2d"
        crm_id: "76799"
      - title: "דאטה אנליסט"
        id: "89fed8ca16"
        crm_id: "76063"
      - title: "ניהול מוצר ושיווק"
        id: "8e8bd754d5"
        crm_id: "76796"
    on_complete: get_client_phone
    on_failure: no_agent_handoff
```

### Choices with per-choice `department` and `agent`
Each choice can assign the chat to a different department or agent when selected:
```yaml
  main_menu:
    type: prompt
    prompt_type: choice
    messages:
      - "במה אתה מתעניין?"
    choices:
      - title: "מתעניין בטיפול"
        on_select: update_lead_tipul
        department: e3578763-4f28-48fc-8c63-7fc0bf4681f3
      - title: "לימודים וקורסים"
        on_select: update_lead_studies
        crm_id: "לימודים"
        department: 0750a2cd-2fe4-4080-9dd5-1cf80e53b07b
      - title: "הרצאות וכנסים"
        on_select: update_lead_lectures
        department: 0750a2cd-2fe4-4080-9dd5-1cf80e53b07b
      - title: "רכישת מוצרים"
        on_select: update_lead_merch
      - title: "יצירת קשר עם נציג"
        on_select: lectures_handoff
    on_failure: abandoned_bot_sequence
```

### Menu with retries and on_failure
```yaml
  menu_working_hours:
    type: prompt
    prompt_type: choice
    interactive: buttons
    retries: 0
    choices:
      - title: "Representative"
        on_select: agent_handoff
      - title: "Contact info"
        on_select: contacts
      - title: "Close request"
        on_select: no_agent_resolved
    on_failure: agent_handoff
    messages:
      - "What would you like to do next?"
```

:::tip
For `interactive: buttons`, max 3 choices with 20 chars each. For `interactive: list`, max 10 choices with 24 chars each. Without `interactive`, choices are presented as a numbered list with no character limit.
:::

:::tip
The user's selected choice text is stored at `%state:node.<node_name>.text%`, just like a text prompt. Combined with `id`, `crm_id`, and `data`, you can capture both the display value and any associated metadata.
:::

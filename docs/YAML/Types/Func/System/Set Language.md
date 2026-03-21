---
sidebar_position: 13
---


# Set Language

### What does it do?
Sets the bot's language for the current session. Affects locale-aware formatting (e.g., in [Format Date](./Format%20Date)) and bot-level message overrides (like `prompt_wrong_answer`). Can be used to build multilingual bot flows.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: "<2-letter language code>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`setLanguage`)
- `params.lang` a 2-letter lowercase language code (e.g., `"he"`, `"en"`, `"ar"`, `"ru"`). Must match the pattern `^[a-z]{2}$`. Supports data injection.
- `on_complete` next node

### optional params
- `on_failure` fallback node if `lang` is missing or invalid (not a 2-letter lowercase code)
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Set language to Hebrew
```yaml
  set_hebrew:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: "he"
    on_complete: main_menu
```

### Set language to English
```yaml
  set_english:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: "en"
    on_complete: main_menu
```

### Dynamic language from CRM data
Use data injection to set the language based on a CRM field:
```yaml
  set_language_from_crm:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: '%chat:crmData.preferredLanguage%'
    on_complete: main_menu
    on_failure: ask_language
```

### Language selection flow
Combine with a choice prompt to let users pick their language:

```yaml
  ask_language:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "Please select your language / בחר שפה"
    choices:
      - title: "עברית"
        on_select: set_hebrew
      - title: "English"
        on_select: set_english
    on_complete: set_hebrew

  set_hebrew:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: "he"
    on_complete: main_menu_he

  set_english:
    type: func
    func_type: system
    func_id: setLanguage
    params:
      lang: "en"
    on_complete: main_menu_en
```

:::tip
Language affects bot-level `messages` overrides. Define per-language messages in the bot configuration:
```yaml
messages:
  prompt_wrong_answer:
    default: "I didn't understand, please try again."
    he: "לא הבנתי, בבקשה נסה שוב."
    en: "I didn't understand, please try again."
```
:::

:::danger
The `lang` value must be exactly 2 lowercase letters (e.g., `"he"`, `"en"`). Any other format will fail validation and route to `on_failure`.
:::

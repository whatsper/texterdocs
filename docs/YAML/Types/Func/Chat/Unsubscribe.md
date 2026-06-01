---
sidebar_position: 6
---

# Unsubscribe

### What does it do?
Unsubscribes the chat from future template messages, sends the customer the configured **unsubscribe confirmation message**, and **resolves the chat automatically**. Use this after the customer chose to opt out of communications (e.g. from an "unsubscribe me" choice in a menu, or from a keyword route).

Effects on the chat:
- `blockTemplates` is set to `true`, so the chat will be skipped by future bulk template sends.
- The customer receives the default unsubscribe confirmation message: `בקשתך התקבלה. פנייתך נסגרה.`
- Chat status is set to **resolved**, so no further bot or agent action is needed.
- If the chat is **already** unsubscribed, this node is a no-op (no second confirmation message, status is left as-is).

___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: unsubscribe
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`unsubscribe`)
- `on_complete` next node after unsubscribe completes. The unsubscribe action already resolves the chat on its own, so this field is effectively redundant. By convention set it to `on_complete: resolved` for readability, so anyone reading the bot YAML sees the chat ends here.

### optional params
- `on_failure` fallback node, used if the call errors (e.g. an unexpected param was passed, since the node accepts none, or any other execution error). Since unsubscribe requests are **legally binding**, route this to a node that gives a human agent visibility, for example a node that adds a label like `unsubscribe-failed` so an agent picks it up and completes the opt-out manually from the Texter UI. Don't leave it silent.
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

This node takes **no `params`**.

___
## 2. Examples

### Unsubscribe from an opt-out choice
```yaml
  ask_continue:
    type: prompt
    prompt_type: choice
    messages:
      - "Would you like to keep receiving updates?"
    choices:
      - title: "Yes, keep me subscribed"
        on_select: main_menu
      - title: "No, unsubscribe me"
        on_select: do_unsubscribe
    on_failure: agent_handoff

  do_unsubscribe:
    type: func
    func_type: chat
    func_id: unsubscribe
    on_complete: resolved
    on_failure: flag_failed_unsubscribe

  flag_failed_unsubscribe:
    type: func
    func_type: chat
    func_id: labels
    params:
      add: 
        - "unsubscribe-failed"
    on_complete: handoff
```

### Unsubscribe from a keyword route
```yaml
  detect_stop_keyword:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      # Regex quick reference for the pattern below:
      #   (?i)   case-insensitive, so "STOP" matches "stop"
      #   ^      start of the message
      #   $      end of the message
      #   |      alternation (OR)
      # Together ^(...|...)$ means the WHOLE message must be exactly one of these words.
      do_unsubscribe: "(?i)^(unsubscribe|stop|הסר|הסרה)$"
    on_complete: main_menu

  do_unsubscribe:
    type: func
    func_type: chat
    func_id: unsubscribe
    on_complete: resolved
    on_failure: flag_failed_unsubscribe

  flag_failed_unsubscribe:
    type: func
    func_type: chat
    func_id: labels
    params:
      add: ["unsubscribe-failed"]
    on_complete: handoff
```

:::tip
The pattern above only matches when the **entire** message is exactly one of those words. To also catch the keyword **inside a longer sentence** (e.g. `Please stop sending me these`) or when the user adds **punctuation / quotation marks** around it (e.g. `"unsubscribe"`, `unsubscribe!`), replace `^...$` with `\b...\b` (word boundaries):

```yaml
      do_unsubscribe: "(?i)\\b(unsubscribe|stop)\\b|הסר|הסרה"
```

`\b` matches the boundary between a word character and a non-word character (space, punctuation, start/end of string), so `stoppage` still won't match but `Please stop.` will. Hebrew words are left without `\b` because word boundaries don't work reliably on Hebrew characters; they fall back to substring matching, which is normally fine for words like `הסר` / `הסרה`.
:::

:::tip
This node both **sends the confirmation message** to the customer and **resolves the chat** in one step. You don't need to add a separate notify or resolve node after it.
:::

# Keyword Route

### What does it do?
Routed between nodes based on user entered text.
___
## 1. Syntax
```
<node_name>:
  type: func
  func_type: system
  func_id: keywordsRoute
  params:
    <node_1>: <word_A>|<word_B>|<word_C>
    <node_2>: <word_D>|<word_E>
  on_complete: <next_function>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling
- `on_complete` next function to do after complete (can be either a node or a function)

### optional params
 - `none`

___
## 2. Example
```
mini_bot_start:
  type: func
  func_type: system
  func_id: botStateSplit
  params:
    last_message: true
    approve: age_question_min_bot
    decline: irrelevant_user
  on_complete: agent_handoff
```
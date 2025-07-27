# Split

:::tip
Use this for rounting nodes based on answer template message with buttons
:::

### What does it do?
Calls a node based on answer, mainly used for template messages,
user answered A then do this, user answered B then do that.
___
## 1. Syntax
it can be either _last_message: true_ or _node_name.text_
```
<node_name>:
  type: func
  func_type: system
  func_id: botStateSplit
  params:
    last_message: true
    <ans_1>: <node_ans_1>
    <ans_2>: <node_ans_2>
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
# Text

### What does it do?
Sends a message to user and **waits** for an answer.
___
## 1. Syntax
#### prompt - text:
```
<node_name>:
  type: prompt
  prompt_type: text
  messages:
    - "<message>"
  on_complete: <next_function>
```

### required params
- `type` type of the node.
- `prompt_type` what type of prompt (text)
- `messages` list of messages to send in a single message block.
- `on_complete` next function to do after complete (can be either a node or a function).

### optional params
- `delay_on_complete` number of seconds to delay

___
## 2. Example
### Text
```
ask_name:
  type: prompt
  prompt_type: text
  messages:
    - "what is your name?"
  on_complete: ask_age_range
```
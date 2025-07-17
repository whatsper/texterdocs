# Notify

### What does it do?
Sends a message to user without waiting for an answer.
___
## 1. Syntax
```
<node_name>:
  type: notify
  messages:
    - "<message>"
  on_complete: <next_function>
```

### required params
-  `type` type of the node
- `messages` list of messages to send in a single message block
- `on_complete` next function to do after complete (can be either a node or a function)

### optional params
- `media` a link to file in firebase of an image

___
## 2. Example
```
send_message:
  type: notify
  messages:
    - "a message for the user"
  on_complete: handoff
```
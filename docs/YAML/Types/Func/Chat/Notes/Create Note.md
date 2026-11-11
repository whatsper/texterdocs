---
sidebar_position: 1
---

# Create Note

### What does it do?
Adds an internal note to the current chat. The note is attached to a message of the chat: the one you pass in `messageId`, or else the chat's latest message. The created note is stored under this node's name.

See the [Overview](./Overview#the-note-object) for the note fields.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: createNote
    params:
      text: "<note_text>"
      messageId: "<message_id>"
      customName: "<author_name>"
    on_complete: <next_node>
    on_failure: <failure_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`createNote`)
- `params.text` the note text, 1 to 4096 characters
- `on_complete` next node after the note is created

### optional params
- `params.messageId` ID of a message in this chat to attach the note to. Defaults to the chat's latest message. A message from another chat fails the node
- `params.customName` name shown as the note's author instead of the default bot name. Up to 50 characters, must contain a visible character
- `on_failure` node for invalid params or a `messageId` that is not in this chat
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

The created note is stored at `%state:node.<node_name>%`:

- `%state:node.<name>._id%` the new note ID, for a later `editNote` or `deleteNote`
- `%state:node.<name>.text%` the saved text

___
## 3. Examples

### Leave a summary for the agent before handoff
```yaml
  save_summary:
    type: func
    func_type: chat
    func_id: createNote
    params:
      text: "Order %state:node.ask_order.text%, reason: %state:node.ask_reason.text%"
      customName: "Order bot"
    on_complete: handoff
    on_failure: handoff
```

### Keep the note ID for a later update
```yaml
  open_ticket_note:
    type: func
    func_type: chat
    func_id: createNote
    params:
      text: "Ticket opened, waiting for the customer's documents"
    on_complete: remember_note_id
    on_failure: ask_documents

  remember_note_id:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        ticketNoteId: "%state:node.open_ticket_note._id%"
    on_complete: ask_documents
```

:::tip
An injection token that resolves to empty text fails the node, because a bot note needs at least one character. Add `on_failure` so the flow does not stop on an empty answer.
:::

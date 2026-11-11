---
sidebar_position: 5
---

# Delete Note

### What does it do?
Deletes a note from the current chat. Nothing is stored under this node's name; a successful delete goes to `on_complete`.

The bot can delete any note of the chat, including notes written by agents.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: deleteNote
    params:
      noteId: "<note_id>"
    on_complete: <next_node>
    on_failure: <failure_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`deleteNote`)
- `params.noteId` ID of a note in this chat
- `on_complete` next node after the note is deleted

### optional params
- `on_failure` node for a note that does not exist (for example, already deleted) or invalid params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Remove the ticket note when the ticket is closed
```yaml
  remove_ticket_note:
    type: func
    func_type: chat
    func_id: deleteNote
    params:
      noteId: "%chat:crmData.ticketNoteId%"
    on_complete: ticket_closed
    on_failure: ticket_closed
```

Both routes continue to `ticket_closed`, so a note that is already gone does not stop the flow.

---
sidebar_position: 4
---

# Edit Note

### What does it do?
Replaces the text of a note in the current chat. The original author stays as it is; the bot is saved as the note's last editor. The updated note is stored under this node's name.

The bot can edit any note of the chat, including notes written by agents.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: editNote
    params:
      noteId: "<note_id>"
      text: "<new_text>"
      customName: "<editor_name>"
    on_complete: <next_node>
    on_failure: <failure_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`editNote`)
- `params.noteId` ID of a note in this chat
- `params.text` the new text, 1 to 4096 characters
- `on_complete` next node after the edit

### optional params
- `params.customName` name shown as the editor instead of the default bot name. Up to 50 characters, must contain a visible character
- `on_failure` node for a note that does not exist or invalid params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

The updated note is stored at `%state:node.<node_name>%`. Its `lastEditor` is the bot, with `customName` when you set one.

### Same text
When `text` is the same as the saved text, nothing changes: the node goes to `on_complete` with the note as it is. Changing only `customName` with the same text fails the node, because the editor name can change only together with the text.

___
## 3. Examples

### Update the note saved earlier
```yaml
  update_ticket_note:
    type: func
    func_type: chat
    func_id: editNote
    params:
      noteId: "%chat:crmData.ticketNoteId%"
      text: "Documents received: %state:node.ask_documents.text%"
      customName: "Order bot"
    on_complete: thank_customer
    on_failure: open_ticket_note
```

If an agent deleted the note, the flow goes to `open_ticket_note` and writes a new one.

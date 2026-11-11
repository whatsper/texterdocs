---
sidebar_position: 2
---

# Get Note

### What does it do?
Reads one note of the current chat by its ID. The note, or `null` when it does not exist, is stored under this node's name.

**A missing note is not a failure** by default: the node goes to `on_complete` with `null`. Set `failIfEmpty: true` to go to `on_failure` instead.

To read several notes, use [`listNotes`](./List%20Notes).
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: getNote
    params:
      noteId: "<note_id>"
      failIfEmpty: true
    on_complete: <next_node>
    on_failure: <failure_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`getNote`)
- `params.noteId` ID of a note in this chat. An ID of another chat's note, or one that is not a valid ID, counts as missing
- `on_complete` next node after the read

### optional params
- `params.failIfEmpty` `true` to go to `on_failure` when the note does not exist. Defaults to `false`. Write `true` without quotes: the string `"true"` is invalid
- `on_failure` node for a missing note (with `failIfEmpty: true`) or invalid params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Output

The note, or `null`, is stored at `%state:node.<node_name>%`. See the [Overview](./Overview#the-note-object) for the fields.

- `%state:node.<name>.text%` the note text
- `%state:node.<name>.author.customName%` the custom author name, if one was set

___
## 3. Examples

### Read a saved note, skip ahead when it is gone
```yaml
  load_ticket_note:
    type: func
    func_type: chat
    func_id: getNote
    params:
      noteId: "%chat:crmData.ticketNoteId%"
      failIfEmpty: true
    on_complete: show_ticket_status
    on_failure: open_ticket_note
```

Here a deleted note sends the flow to `open_ticket_note`, which writes a new one.

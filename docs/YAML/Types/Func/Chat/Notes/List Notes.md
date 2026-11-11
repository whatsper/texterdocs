---
sidebar_position: 3
---

# List Notes

### What does it do?
Reads a page of the current chat's notes, **newest first**, with optional filters on the note's original author. Stores `{ notes, total, hasMore }` under this node's name.

For a single note by ID, use [`getNote`](./Get%20Note).
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: chat
    func_id: listNotes
    params:
      limit: <1-1000>
      skip: <0+>
      authorSources:
        - <author_source>
        - <another_author_source>
      authorUid: "<user_id>"
      authorCustomName: "<author_name>"
      failIfEmpty: true
    on_complete: <next_node>
    on_failure: <failure_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a chat function
- `func_id` what function are we calling (`listNotes`)
- `on_complete` next node after the read

`params` is optional. Without it, the node reads the 100 newest notes.

### optional params
- `params.limit` page size, 1 to 1000. Defaults to `100`
- `params.skip` how many notes to skip. Defaults to `0`
- `params.authorSources` keep notes whose original author is any of these sources: `user` (agents), `bot`, `scenario`, `api`, `unknown`. Each value once
- `params.authorUid` keep notes written by the agent with this user ID
- `params.authorCustomName` keep notes whose author `customName` is exactly this value
- `params.failIfEmpty` `true` to go to `on_failure` when the page has no notes. Defaults to `false`. Write `true` without quotes
- `on_failure` node for an empty page (with `failIfEmpty: true`) or invalid params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

All filters you set must match. Filters check the original author, not the last editor.

___
## 2. Output

Stored at `%state:node.<node_name>%`:

```json
{
  "notes": [
    { "_id": "...", "chatId": "...", "text": "...", "author": { ... }, "createdAt": ..., "updatedAt": ... }
  ],
  "total": 12,
  "hasMore": true
}
```

- `%state:node.<name>.notes%` notes on this page, newest first
- `%state:node.<name>.notes.0.text%` text of the newest note on the page
- `%state:node.<name>.total%` number of notes that match the filters in the whole chat, not only on this page
- `%state:node.<name>.hasMore%` `true` when more matching notes come after this page

`failIfEmpty` checks the page: a `skip` past the last note fails even when `total` is not `0`.

___
## 3. Examples

### Latest note written by the bot
```yaml
  last_bot_note:
    type: func
    func_type: chat
    func_id: listNotes
    params:
      authorSources:
        - bot
      limit: 1
      failIfEmpty: true
    on_complete: save_last_summary
    on_failure: no_summary_yet

  save_last_summary:
    type: func
    func_type: chat
    func_id: updateCrmData
    params:
      data:
        lastBotSummary: "%state:node.last_bot_note.notes.0.text%"
    on_complete: main_menu
```

### Notes written under a custom name
```yaml
  order_bot_notes:
    type: func
    func_type: chat
    func_id: listNotes
    params:
      authorCustomName: "Order bot"
      limit: 20
    on_complete: check_more_notes
```

### Branch on `hasMore`
```yaml
  check_more_notes:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%state:node.order_bot_notes.hasMore%"
      cases:
        "true": tell_agent_more_notes
    on_complete: continue_flow
```

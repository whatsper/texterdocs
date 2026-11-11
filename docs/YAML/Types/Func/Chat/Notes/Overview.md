---
sidebar_position: 0
---

# Overview

### What are chat notes?
Internal notes on a chat. Agents see them in the inbox next to the conversation; the customer never sees them. The bot can create, read, list, edit and delete the notes of the **current chat**, for example to leave a summary for the agent who takes over.

Notes written by the bot are marked as written by the bot in the inbox. Set `customName` to show your own name instead (for example `Order bot`).

___
## 1. The five functions

| `func_id` | What it does |
|-----------|--------------|
| [`createNote`](./Create%20Note) | Add a note to the current chat. |
| [`getNote`](./Get%20Note) | Read one note by its ID. Returns `null` when it does not exist. |
| [`listNotes`](./List%20Notes) | Read a page of the chat's notes, newest first, with optional author filters. |
| [`editNote`](./Edit%20Note) | Replace the text of a note. |
| [`deleteNote`](./Delete%20Note) | Delete a note. |

All five use `func_type: chat` and work only on the chat the bot is running in.

___
## 2. Concepts

### Each node's result lives at `%state:node.<node_name>%`

| Node | Output at `%state:node.<name>%` |
|------|---------------------------------|
| `createNote` | The created note |
| `getNote` | The note, or `null` |
| `listNotes` | `{ notes: [...], total: <number>, hasMore: <boolean> }` |
| `editNote` | The updated note |
| `deleteNote` | Nothing is stored |

Read fields with the [`state` provider](/docs/YAML/Data%20Injection/Providers#state), for example `%state:node.save_summary._id%`.

### The note object

```json
{
  "_id": "6731f0c2a1b2c3d4e5f60718",
  "chatId": "67a87067aeed4dee1271cb4d",
  "text": "Customer asked for a refund on order 1234",
  "messageId": "6731efa0a1b2c3d4e5f60701",
  "author": {
    "actor": { "type": "system", "component": "bot" },
    "customName": "Order bot"
  },
  "lastEditor": {
    "actor": { "type": "system", "component": "bot" }
  },
  "createdAt": 1762851000000,
  "updatedAt": 1762851300000
}
```

| Field | Description |
|-------|-------------|
| `_id` | Note ID. Pass it as `noteId` to `getNote`, `editNote` and `deleteNote` |
| `chatId` | The chat the note belongs to |
| `text` | The note text |
| `messageId` | The chat message the note is attached to. Missing when the chat had no messages |
| `author` | Who wrote the note. Kept as it is on every edit |
| `author.actor` | The author's type: `user` (an agent, with `uid`), `system` with `component: bot` or `component: scenario`, or `jwt` / `legacyToken` (the API) |
| `author.customName` | The name shown instead of the default author name, when one was set |
| `lastEditor` | Who made the last edit, same shape as `author`. Missing on notes that were never edited |
| `createdAt` / `updatedAt` | Unix timestamps in milliseconds |

### Getting a note ID
- Right after `createNote`: `%state:node.<create_node>._id%`
- From a list: `%state:node.<list_node>.notes.0._id%` is the newest note on the page
- To use the ID in a later bot session, save it on the chat with [`updateCrmData`](../Update%20CRM%20Data)

### Failures
These go to `on_failure`: invalid params, an `editNote` or `deleteNote` on a note that does not exist, and a `messageId` that is not in this chat. A missing note in `getNote` and an empty page in `listNotes` are **not** failures unless you set `failIfEmpty: true`.

Without `on_failure`, the bot continues to `on_complete`, so add `on_failure` whenever the next node depends on the result.

:::warning The bot can change any note of the chat
`editNote` and `deleteNote` work on every note of the current chat, including notes written by agents. Use IDs that the bot created or selected on purpose.
:::

___
## 3. Limits

| Limit | Value |
|-------|-------|
| Max note text | 4096 characters |
| Min note text (bot) | 1 character |
| Max `customName` | 50 characters, must contain a visible character |
| Max `listNotes` page size (`limit`) | 1000 (default 100) |

Creating, editing or deleting a note also fires the chat note triggers in scenarios.

---
title: Chat Notes for Bots + API
date: 2026-11-11
tags: [docs, yaml]
---

Bots can now read and write the internal notes of a chat, for example to leave a summary for the agent who takes over. The Texter API has new chat notes endpoints too.

<!-- truncate -->

## Added

- **[Chat notes bot functions](/docs/YAML/Types/Func/Chat/Notes/Overview)**: `createNote`, `getNote`, `listNotes`, `editNote` and `deleteNote` work on the current chat's notes, with an optional custom author name.
- **Chat notes API**: new Texter API endpoints list, read, create, edit and delete a chat's notes, with filters by author.

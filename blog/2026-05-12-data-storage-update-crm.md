---
title: Data Storage Funcs + Chat `updateCrmData` Docs
date: 2026-05-12
tags: [docs, yaml]
---

The YAML reference now covers **customer-scoped data storage** func nodes and the **`updateCrmData`** chat func for persisting `crmData`, with cross-links from Parse CRM Data and the Data Injection providers table.

<!-- truncate -->

## Added

- **Data Storage** — new Func subsection with an overview plus pages for `getData`, `setData`, `listData`, and `deleteData` (`func_type: dataStorage`): collections, keys, TTL, tags, and when to use them instead of `storeValue` or chat `crmData`.
- **`updateCrmData`** — chat-level documentation for merging or replacing `crmData` on the current conversation, including the allowed `mergingMode` values.

## Improved

- **YAML Overview** — Func table lists `dataStorage` and links the new overview; `chat` row includes `updateCrmData`.
- **Data Injection Providers** — documents `state:node` paths for data-storage node outputs.
- **Parse CRM Data** — points to `updateCrmData` when you need structured writes beyond regex capture.

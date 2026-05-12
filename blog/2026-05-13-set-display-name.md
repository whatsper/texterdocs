---
title: Set Display Name Func Docs
date: 2026-05-13
tags: [docs, yaml]
---

The YAML reference now documents the new **`setDisplayName`** chat func — sets a custom chat title (stored separately from the channel-provided `%chat:title%`), with optional length capping and overflow handling.

<!-- truncate -->

## Added

- **Set Display Name** — new page under `Func / Chat` covering `setDisplayName`: required `displayName`, plus optional `setOnlyIfEmpty`, `maxLength` (1–255), and `onOverflow` (`truncate` / `skip` / `fail`). Examples include setting from collected first+last name, only-if-empty (don't clobber WhatsApp profile names), CRM-lookup with cap, strict-fail for re-prompt flows, and clearing the value.

## Fixed

- **YAML Overview** — chat row now lists `setDisplayName`; the `dataStorage` row uses the real `func_id`s (`get` / `set` / `list` / `delete`) instead of the stale `getData` / `setData` / `listData` / `deleteData` labels.

---
title: Transformers — `get` Examples + API JSON Tip
date: 2026-05-10
tags: [docs, yaml]
---

The Data Injection **Transformers** page now highlights a practical `get` pattern for nested values inside JSON returned from API calls, and the `crmData` example shows a non-ASCII property key.

<!-- truncate -->

## Improved

- **Transformers (`get`)** — new tip with a `jsonParse` → `get(...)` chain for drilling into API response strings, plus a short inline comment on the evaluated result.
- **`crmData` example** — uses a Hebrew field name so dot-path access with `get` reads clearly for localized CRM payloads.

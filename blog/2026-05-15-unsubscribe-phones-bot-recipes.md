---
title: Unsubscribe Phones + Bot Recipes
date: 2026-05-15
tags: [feature, docs, yaml, site]
---

A new in-browser tool to bulk-unsubscribe phone numbers from a Texter environment, plus a "Bot Recipes" section under Bot YAML with copy-paste-ready snippets for common starter bots.

<!-- truncate -->

## Added

- **Unsubscribe Phones** — new tool at [Tools → Unsubscribe Phones](/docs/tools/unsubscribe-phones) for bulk-unsubscribing phone numbers from a Texter environment. Paste a comma-separated list or upload a CSV (`phone` column), capped at 5,000 per request. Pre-flight probe aborts on auth / config / unreachable-instance errors with one clear message; otherwise the result panel shows per-number outcomes with HTTP status and reason.
- **Bot Recipes** — new section under Bot YAML with copy-paste-ready snippets for common starter bots: **AI Bot** (external-bot wiring + `AI_TEST` command), **CPA Assist Bot** (mandatory CPA Assist starter, includes the nodes routed by partner templates), **Optima Bot** (meeting-reminder webhook handler), and **Handoff Only Bot** (forward everything to a human).

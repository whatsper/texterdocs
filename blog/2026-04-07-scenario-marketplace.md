---
title: Scenario Marketplace
date: 2026-04-07
tags: [scenarios, docs, automation]
---

Browse, understand, and copy ready-made automation scenarios directly into Texter — no starting from scratch.

<!-- truncate -->

## Added

- **Scenario Marketplace** — new top-level section in the docs site at `/scenarios`
- **18 scenarios** across trigger types, action types, and integrations, including:
  - Subscribe-to-events templates (incoming messages, chat assigned/resolved, message status, external bot, scheduled, channel health)
  - Q-AI suite — turn on/off AI sessions, forward messages to an AI webhook, end sessions and run a fallback bot
  - Salesforce CRM — create and update service requests on chat events
  - Utility — assign by echo message, label on message error, notify on assignment, forward delivery status
- **Tag filtering** — filter by trigger type, action type, or integration (e.g. `ai-bot`, `salesforce`, `webhook`)
- **Search** — full-text search across scenario name, description, tags, and trigger events
- **Per-card flow strip** — visual trigger → action icon flow at the top of each card; hover an icon to see its label
- **"What to configure" section** — collapsible per-scenario guide showing exactly which fields to replace, where they live in the JSON, and whether they're required
- **Copy JSON** — one click copies the full scenario JSON to clipboard, ready to paste into Texter
- **Randomized ordering** — cards shuffle on each page load so no scenario is always buried at the bottom

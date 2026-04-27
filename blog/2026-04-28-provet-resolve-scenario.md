---
title: Provet Adapter + Run Bot on Resolve Scenario
date: 2026-04-28
tags: [adapters, docs, scenarios, yaml]
---

New Provet Cloud adapter docs and a Scenario Marketplace entry that auto-runs the bot when an agent resolves a chat.

<!-- truncate -->

## Added

- **Provet adapter** — documentation for the new Provet Cloud (vet PMS) adapter, including OAuth setup and an onboarding guide for Texter Support.
- **Run Bot on Agent Resolve scenario** — new Scenario Marketplace entry that auto-resumes the bot from a configurable node (e.g. `close_chat`) when an agent resolves a chat.
- **Rapid `newOpportunity`** — `substatus` and `reason` lead fields.

## Improved

- **Request examples** — switched to `json: true` shorthand instead of manual `Content-Type` headers.
- **Check Working Hours** — legacy deprecation callout moved to the top of the legacy section.

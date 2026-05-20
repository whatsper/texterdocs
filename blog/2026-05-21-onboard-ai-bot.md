---
title: Onboard AI Bot Tool + Adapter Fixes
date: 2026-05-21
tags: [feature, site, adapters, scenarios]
---

A new in-docs tool for onboarding AI customers, plus a Provet cleanup and a few adapter fixes.

<!-- truncate -->

## Added

- **Onboard AI Bot tool** — new tool at `/tools/onboard-ai-bot` that runs the AI customer onboarding workflow end-to-end (vector store, Drive folders, default prompt, scenarios import) and surfaces success/error with a link to the n8n executions log on failure.
- **Rapid partner bundle** — new financial-document template with a document header.

## Improved

- **Provet adapter** — removed misleading YAML examples for `appointmentReminders` and `sendReminders` (scheduled-task-only); points at the Provet Task Editor and a JSON `CrmMethodTask` example instead.
- **Remember Last Agent scenario** — now also stores `latestAgentEmail` alongside UID and name.

## Fixed

- **Rapid `createUpdateCustomer`** — documented the required params that were missing.
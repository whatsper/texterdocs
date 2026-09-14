---
title: Optima Adapter, Lead.IM Side-Panel Fields, Provet Full Client Details
date: 2026-09-14
tags: [adapters, docs, feature]
---

Optima joins the CRM adapters with a phone lookup, Lead.IM lets you pick which lead fields feed the CRM side panel, and Provet reminder tasks can pull the full client record before filtering.

<!-- truncate -->

## Added

- **[Optima adapter](/docs/YAML/Adapters/Optima)**: a new read-only adapter with `getCustomerDetails`, matching a patient card by phone across all five phone fields on the card. Sets `crmData.id`, `crmData.cardId`, `crmData.phone` and `crmData.name`. The lookup resolves only when exactly one card matches, so an ambiguous number routes to `on_failure` rather than picking a card. Config is `username`, `password`, plus optional `company` and `requestTimeoutMs`. Writing back to Optima is still done with `sendWebhook`, as in the [Optima Bot recipe](/docs/YAML/Bot%20Recipes/Optima%20Bot).
- **[Lead.IM side-panel fields](/docs/YAML/Adapters/LeadIM)**: `getCustomerDetails` now returns `crmData.status`, taken from the lead's `status_name` by default. Three new optional `crmConfig` fields, `statusField`, `phoneField` and `idField`, point the status, phone and id shown in the CRM panel at a different Lead.IM field, the same way `nameField` already worked. All four accept a plain field name or a dot path, and a path that lands on an object or a list falls back to the default.
- **[Provet `fetchFullClientDetails`](/docs/YAML/Adapters/Provet#sendreminders)**: an optional `sendReminders` param that fetches the full client record for every reminder in one batched request and merges it into `reminder.client` before `filters`, `body` and `crmData` run. Provet's `expose_client` returns only a small subset of client fields, so this is what makes filters like `empty(client.no_sms)` or `"vip" in client.tags_rel` possible. Off by default.

## Fixed

- **Lead.IM lookup response shapes**: the lookup endpoint can return the lead as a list or as a single object, and both are now handled. A lookup that finds nothing is a clean not-found that routes to `on_failure`, instead of an adapter error, so contacts who simply are not in Lead.IM no longer produce CRM error logs.

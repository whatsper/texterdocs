---
title: Unsubscribe Func + Rapid Recipe + OAuth Webhooks
date: 2026-06-01
tags: [docs, yaml, adapters, site]
---

A new `unsubscribe` chat func with a "legally binding" handling pattern, a Rapid Basic Bot starter recipe, accurate `injectOAuth` docs on `sendWebhook` with a Salesforce example, plus a small persistence fix in the partner-bundle import tool.

<!-- truncate -->

## Added

- **`unsubscribe` chat func** — new doc covering the func that sends the unsubscribe confirmation and resolves the chat in one step, with the `on_failure` → label flow recommended for legal-binding visibility.
- **Rapid Basic Bot recipe** — new copy-paste starter under Bot Recipes: greet, `getCustomerDetails`, branch to a service menu for existing customers or `newOpportunity` + name collection for unknown senders, then working-hours-aware handoff.
- **Rapid `disableSystemEvents`** — new `newOpportunity` param, defaults to `true` so Rapid's new-lead system event doesn't escape the bot mid-conversation with a template send. Pass `false` to re-enable.
- **`matchExpression` node-traversal example** — new example for branching on which earlier node(s) the chat passed through, using `exists(%state:node.X%)`.

## Improved

- **`sendWebhook` `injectOAuth`** — documented the real object shape (`service`, `header`, `tokenPrefix`) instead of treating it as a flag, listed the supported services, and added a Salesforce example with `Authorization: Bearer …`.

## Fixed

- **Partner-bundle seed inputs** — values like "שם הקליניקה" on the Optima bundle in the Templates Import tool now persist to `localStorage` so they survive reloads.

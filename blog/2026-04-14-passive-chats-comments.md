---
title: Giscus Comments, Template Webhooks, and Passive Marketing Chats
date: 2026-04-14
tags: [scenarios, automation, site]
---

New this week: comments on every docs page, three subscribe-to-events templates for template messaging and assignment webhooks, and a scheduled scenario for recovering passive bulk chats.

<!-- truncate -->

## Added

- **Comments on every page** — each docs page and scenario card now has a comment section powered by [Giscus](https://giscus.app/), backed by GitHub Discussions. Use it to ask questions, share your own scenario variations, post real-world examples, or discuss edge cases with the community.

- **(SUB) Chat Unsubscribed** — sends a webhook when a chat opts out of template messages (for example when the customer replies with an opt-out keyword such as "הסר"). Use it to sync suppression lists or update consent in external systems.

- **(SUB) Chat Subscribed** — sends a webhook when a chat subscribes or opts back in to receiving template messages, so you can refresh consent or resume outreach elsewhere.

- **(SUB) Chat Assigned** — sends a webhook when a chat is taken by an agent, including the full chat and a narrowed agent profile (id, crmId, email, displayName, roles) for CRMs, routing tools, or custom backends.

- **Handle Passive Marketing Chats** — cron-triggered scenario that runs once a day, finds BULK chats from the previous day whose last message matched one of your marketing templates, and automatically reassigns them to the sales department (Pending status) while updating the lead's status in Rapid CRM. Built for Tyntec provider customers — see the "What to configure" section for the expression to use with other WhatsApp providers.

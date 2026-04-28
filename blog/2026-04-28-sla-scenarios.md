---
title: SLA Scenario Suite (Marketplace)
date: 2026-04-28
tags: [scenarios, marketplace, sla, automation]
---

Added an SLA scenario suite to the Scenario Marketplace to help track response-time SLAs using a simple per-chat data store record and a default `sla` label.

<!-- truncate -->

## Added

- **SLA scenario group (tag: `sla`)** — a dedicated section in the Scenario Marketplace.
- **(SLA) Set Item On Incoming Message** — starts SLA tracking on incoming customer messages (stores timestamp + chat id).
- **(SLA) Set Item On Set to pending** — starts SLA tracking when a chat becomes pending.
- **(SLA) Set SLA Label For all Records** — cron-driven enforcement that applies the `sla` label when the configured threshold is exceeded (default example: 20 minutes, configurable per customer).
- **(SLA) Remove Item On Resolve Chat** — clears tracking + removes the `sla` label when a chat is resolved.
- **(SLA) Remove Item On outgoing Message** — clears tracking + removes the `sla` label when an agent replies.


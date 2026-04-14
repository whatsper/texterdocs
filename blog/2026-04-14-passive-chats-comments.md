---
title: Page Comments + Passive Marketing Chats Scenario
date: 2026-04-14
tags: [scenarios, automation, site]
---

Two new additions this week: a scheduled scenario for recovering passive bulk chats, and a comments section on every docs page so you can share examples and ask questions.

<!-- truncate -->

## Added

- **Handle Passive Marketing Chats** — cron-triggered scenario that runs once a day, finds BULK chats from the previous day whose last message matched one of your marketing templates, and automatically reassigns them to the sales department (Pending status) while updating the lead's status in Rapid CRM. Built for Tyntec provider customers — see the "What to configure" section for the expression to use with other WhatsApp providers.

- **Comments on every page** — each docs page and scenario card now has a comment section powered by [Giscus](https://giscus.app/), backed by GitHub Discussions. Use it to ask questions, share your own scenario variations, post real-world examples, or discuss edge cases with the community.

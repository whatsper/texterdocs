---
title: Follow-up Campaign Scenarios + Data Storage Docs
date: 2026-06-24
tags: [scenarios, yaml, docs]
---

Two new data-storage-driven follow-up campaigns join the Scenario Marketplace, alongside clearer data-storage guidance and new docs for how smart_resolved handles an unanswered prompt.

<!-- truncate -->

## Added

- **Timed Template Follow-up** — a capture + cron scenario pair that messages customers a set time after a chosen template is sent, regardless of whether they replied. Good for next-day check-ins, reminders, and nudges.
- **Passive Marketing** — a capture + cron pair that flags chats sent a marketing template, then daily reassigns the still-passive ones to sales and updates the Rapid lead status. Replaces the older "Handle Passive Marketing Chats" scenario.
- **smart_resolved `on_abandoned`** — documented the options when a customer ignores the smart_resolved prompt: auto-resolve (default), hand off to a general agent, or return to the agent who resolved the chat.

## Improved

- **Data Storage docs** — a check-before-delete pattern for safe cleanup at bot start, plus a note that chat `_id` keys must be passed through `|toString` (it's a Mongo ObjectId).

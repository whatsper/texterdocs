---
title: Rapid Payment Requests + Message Status Subscriptions
date: 2026-10-20
tags: [adapters, scenarios, docs, yaml]
---

Rapid appointment bookings can request payment, and message-status subscriptions now make delivery outcomes easier to track. Working-hours guidance also clarifies how named schedules are checked.

<!-- truncate -->

## Added

- **[Rapid payment requests](/docs/YAML/Adapters/Rapid#scheduleappointment)** — Optional payment requests when booking, with a commented recipe example. Requires service enablement in Rapid.
- **[Messages Delivered or Failed](/scenarios)** — A subscription scenario that sends webhooks only when outgoing messages are delivered or fail.

## Fixed

- **[Working-hours guidance](/docs/YAML/Types/Func/System/Check%20Working%20Hours)** — Clarified that omitting `params.type` checks all schedules; select `office` to check office hours only.

## Improved

- **[Message-status subscriptions](/scenarios)** — Webhooks include the matched Texter message ID when available and omit CRM data and previous bot sessions.

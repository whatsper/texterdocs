---
title: End-of-Day Closing Message Scenario
date: 2026-04-08
tags: [scenarios, automation]
---

A new scheduled scenario added to the marketplace for closing out pending chats at the end of the business day.

<!-- truncate -->

## Added

- **End-of-Day Closing Message** — cron-triggered scenario that finds pending chats with activity in the last ~9 hours and sends a closing message letting customers know they'll get a response on the next business day. Configurable per customer via a `ScenariosCustomTriggerCronTask` entry in Nihul (e.g. Sun–Thu at 18:30), excludes chats already labeled `waiting_for_customer`, and sends up to 10 messages concurrently.

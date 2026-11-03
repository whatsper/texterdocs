---
title: Bulk Resolve Scenario + Rapid Ticket Request
date: 2026-11-03
tags: [scenarios, adapters, docs, site]
---

A new marketplace scenario resolves every chat still assigned to one agent, and the Rapid page documents a full-control ticket request. Template import also keeps saved media headers.

<!-- truncate -->

## Added

- **[Bulk Resolve Chats of an Agent](/scenarios)**: a manual scenario that resolves all chats still assigned to one agent, for example after the agent left. Runs in batches of up to 1000.
- **[Rapid Create ticket request](/docs/YAML/Adapters/Rapid#create-ticket-gateway)**: open a Rapid ticket on a customer or lead with a `request` node, and set the reason, urgency, assignee and title.

## Fixed

- **[Template JSON import](/docs/templates-import-export)**: imports keep each template's saved defaults, so image, video and document headers pass approval with their media.

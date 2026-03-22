---
sidebar_position: 1
slug: /intro
title: Introduction
---

# Welcome to Texter Docs

This is the official documentation for building and configuring **WhatsApp chatbots** with [Texter](https://www.texterchat.com). Whether you're creating your first bot or looking up a specific function, you'll find what you need here.

## What's covered

### [YAML Overview](/docs/YAML/Overview)

How bot YAML files are structured — node types, how they connect, and the execution model.

### [Bot Configuration](/docs/YAML/Bot%20Configuration)

All top-level settings: `start_node`, `working_time`, `pending_message`, `abandoned_bot_settings`, and more.

### [Data Injection](/docs/YAML/Data%20Injection/Overview)

The `%provider:path|transformer%` syntax for injecting dynamic data — chat fields, CRM data, bot state, timestamps — into any text field.

### Node Types

- **[Prompt](/docs/YAML/Types/Prompt/Text)** — Collect user input (free text, choices)
- **[Notify](/docs/YAML/Types/Notify)** — Send messages and media
- **[Func](/docs/YAML/Types/Func/System/Switch%20Node)** — Run logic: routing, HTTP requests, CRM operations, date formatting, and more
- **[WhatsApp Flow](/docs/YAML/Types/WhatsApp%20Flow)** — Interactive native forms inside WhatsApp

### [API & External References](/docs/API)

Links to the Texter API docs and all supported CRM/third-party platform documentation (Zoho, Powerlink, HubSpot, Rapid, Provet, Shopify, and more).

## Quick links

| Resource | Link |
|----------|------|
| Texter Home | [www.texterchat.com](https://www.texterchat.com) |
| Texter API Docs | [apidocs.texterchat.com](https://apidocs.texterchat.com) |
| YAML Overview | [Get started →](/docs/YAML/Overview) |

## How to use these docs

1. **New to Texter?** Start with the [YAML Overview](/docs/YAML/Overview) to understand how bots are structured, then explore [Bot Configuration](/docs/YAML/Bot%20Configuration).
2. **Looking up a function?** Use the **search bar** at the top, or browse the sidebar under *Types → Func*.
3. **Need data injection?** The [Providers](/docs/YAML/Data%20Injection/Providers) and [Transformers](/docs/YAML/Data%20Injection/Transformers) pages list every available option with examples.
4. **Migrating old syntax?** See [Legacy Syntax](/docs/YAML/Data%20Injection/Legacy%20Syntax) for a mapping of `%DATA_CRM%`, `%DATA_BOT_NODE%`, etc. to the modern format.

:::tip
Every function and node page includes multiple real-world YAML examples. If you see a pattern you need, copy the YAML directly into your bot.
:::

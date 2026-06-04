---
sidebar_position: 1
slug: /intro
title: Introduction
---

# Welcome to Texter Docs

This is the official documentation for building and configuring **WhatsApp chatbots** with [Texter](https://www.texterchat.com) — from YAML bot flows to AI-powered assistants. Whether you're building your first bot, wiring up an AI agent, or looking up a specific function, you'll find what you need here.

## What's covered

### [YAML Overview](/docs/YAML/Overview)

How bot YAML files are structured — node types, how they connect, and the execution model.

### [Bot Configuration](/docs/YAML/Bot%20Configuration)

All top-level settings: `start_node`, `working_time`, `pending_message`, `abandoned_bot_settings`, and more.

### [Data Injection](/docs/YAML/Data%20Injection/Overview)

The `%provider:path|transformer%` syntax for injecting dynamic data — chat fields, CRM data, bot state, timestamps — into any text field.

### [Node Types](/docs/node-types)

- **[Prompt](/docs/YAML/Types/Prompt/Text)** — Collect user input (free text, choices)
- **[Notify](/docs/YAML/Types/Notify)** — Send messages and media
- **[Func](/docs/YAML/Types/Func/System/Switch%20Node)** — Run logic: routing, HTTP requests, CRM operations, date formatting, and more
- **[WhatsApp Flow](/docs/YAML/Types/WhatsApp%20Flow)** — Interactive native forms inside WhatsApp

### [Q-AI Bot](/docs/q-ai-bot)

Texter's AI assistant — an OpenAI-backed bot that answers from a project's own knowledge base (RAG), returns structured replies the bot flow can act on, re-engages quiet leads, and hands off to a human when needed. Covers how it works, how to configure it per project, and how to support it.

### [Tools](/docs/tools)

Interactive tools you run straight from the browser — including **[Onboard AI Bot](/docs/tools/onboard-ai-bot)**, which provisions a new AI project end to end.

### [Scenario Marketplace](/scenarios)

Ready-made, copy-paste **scenario** configurations for common automations — search the catalog and grab the JSON you need.

### [API & External References](/docs/API)

Links to the Texter API docs and all supported CRM/third-party platform documentation (Zoho, Powerlink, HubSpot, Rapid, Provet, Shopify, and more).

## Quick links

| Resource | Link |
|----------|------|
| Texter Home | [www.texterchat.com](https://www.texterchat.com) |
| Texter API Docs | [apidocs.texterchat.com](https://apidocs.texterchat.com) |
| Bot YAML | [Get started →](/docs/YAML/Overview) |
| Q-AI Bot | [Meet the AI assistant →](/docs/q-ai-bot) |
| Scenario Marketplace | [Browse scenarios →](/scenarios) |
| What's new | [Changelog →](/changelog) |

## How to use these docs

1. **New to Texter?** Start with the [YAML Overview](/docs/YAML/Overview) to understand how bots are structured, then explore [Bot Configuration](/docs/YAML/Bot%20Configuration).
2. **Building an AI bot?** Head to the [Q-AI Bot](/docs/q-ai-bot) section, then use [Onboard AI Bot](/docs/tools/onboard-ai-bot) to set one up.
3. **Looking up a function?** Use the **search bar** at the top, or browse the sidebar under *Types → Func*.
4. **Need data injection?** The [Providers](/docs/YAML/Data%20Injection/Providers) and [Transformers](/docs/YAML/Data%20Injection/Transformers) pages list every available option with examples.
5. **Want a ready-made automation?** Browse the [Scenario Marketplace](/scenarios) and copy the config straight into your setup.
6. **Migrating old syntax?** See [Legacy Syntax](/docs/YAML/Data%20Injection/Legacy%20Syntax) for a mapping of `%DATA_CRM%`, `%DATA_BOT_NODE%`, etc. to the modern format.

:::tip
Every function and node page includes multiple real-world YAML examples. If you see a pattern you need, copy the YAML directly into your bot.
:::

:::tip Ask AI
In a hurry? Use **Ask AI** to ask a question in plain English — it answers from these docs and links you straight to the source page.
:::

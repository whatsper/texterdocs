---
title: Overview
sidebar_position: 1
slug: /q-ai-bot/overview
description: What the Q-AI Bot is, the value it adds to Texter, the four subsystems it is built from, and where an AI turn sits inside a conversation.
---

# Overview

The **Q-AI Bot** is an AI assistant layered on top of the Texter chat platform. When it is switched on for a chat, an OpenAI-backed assistant reads each incoming message, looks up answers in a knowledge base you control, replies to the contact in natural language, and decides — turn by turn — whether to keep going or hand the conversation back to your Texter bot or a human agent.

It is not a replacement for your Texter bot. Think of it as a **specialist you can route a conversation to**: the YAML bot handles structured menus and flows, and when a conversation needs open-ended, knowledge-grounded answers, the bot flips the AI on for that chat. When the AI is done, control returns to the bot.

:::info[New to Texter bots?]
If you have never worked with a Texter bot YAML file, start with the **[YAML Overview](/docs/YAML/Overview)**. The Q-AI Bot plugs into that same bot, so the concepts there (nodes, `on_complete`, funcs) carry over.
:::

---

## Why it exists

A traditional menu-driven bot is great at predictable paths ("press 1 for sales") but struggles with free-form questions. The Q-AI Bot fills that gap:

- **It answers in the contact's own words.** No menus to navigate — the contact asks, the assistant replies.
- **It is grounded in your content.** Answers come from a per-project knowledge base (your help articles, price lists, policies, website pages), so the assistant speaks for *your* business, not the open internet.
- **It knows when to step aside.** The assistant can resolve a simple chat on its own, or escalate to a human the moment a conversation needs one.
- **It can score and capture leads.** On projects that need it, the assistant can read the contact's intent, tag a conversation as a hot, warm, or cold lead, and capture details (name, phone, service of interest) into structured fields your bot then writes to your CRM. This **lead-scoring** behavior is opt-in per project and is covered on the **[Response Schema](/docs/q-ai-bot/response-schema)** page.
- **It is configured per project.** Every project has its own knowledge base, its own system prompt (the assistant's instructions and persona), and its own settings — so two businesses on Texter get two completely different assistants.

:::note[What "project" means here]
A **project** is one business's Texter environment. Each project has a unique identifier, its own bot, its own knowledge base, and its own AI settings. When this section says "your project," it means the specific business the assistant is configured for.
:::

---

## Key terms

These words appear throughout this section. Skim them now; they will make the rest of the pages read faster.

| Term | What it means |
| --- | --- |
| **AI mode** | The on/off switch on a chat that decides whether the Q-AI Bot is in control. On = the assistant answers; off = the Texter bot answers. (Other pages may note its internal name, *external-bot mode* — same thing.) |
| **Session** | One continuous run of the assistant on a chat, from the moment AI mode turns on until it turns off. A session has its own memory; ending and restarting it starts fresh. |
| **Turn** | One incoming message answered by one assistant reply. A session is made of turns. |
| **Knowledge base** | The searchable store of your project's content that the assistant pulls answers from (help articles, price lists, policies, website pages). |
| **RAG** | *Retrieval-Augmented Generation* — the technique the assistant uses to answer: it *retrieves* relevant snippets from the knowledge base and *generates* an answer grounded in them. |
| **Termination reason** | A short label recorded when a session ends (for example *resolved* or *handed to a human*) that tells your bot and reports *why* the assistant stepped away. |
| **Handoff** | What happens when a session ends: AI mode switches off and control returns to your Texter bot or a human agent. |
| **Scenario** | A small, event-driven rule in your Texter environment that reacts to chat events. The Q-AI scenarios are what wire the Texter side to the assistant. |

---

## Where an AI turn sits in a conversation

A message from a contact always arrives through a **channel** (for example WhatsApp) and lands as a **Texter chat**. From there, one of two things handles it:

1. The **Texter bot** (your YAML) — menus, flows, CRM lookups.
2. The **Q-AI Bot** — but only while AI mode is switched on for that chat.

When AI mode is on, each incoming message becomes **one AI turn**: the assistant thinks, optionally searches the knowledge base, and sends a reply. After every turn the assistant either continues the conversation, or ends the AI session — which either resolves the chat or **hands it back** to the bot or a human agent.

In short, the chain is: a message arrives on a **channel** → it becomes a **Texter chat** → if AI mode is **on**, that message is one **AI turn** (reason, optionally search the knowledge base, reply) → after the turn the assistant either **continues** or **ends the session and hands off** to the bot or a human. If AI mode is **off**, the message never reaches the assistant at all — the Texter bot handles it.

---

## The four subsystems

The Q-AI Bot is made of four parts. You don't operate them by hand — background automation workflows run them — but knowing the four makes everything else in this section easier to follow.

| Subsystem | What it does |
| --- | --- |
| **The live reply loop** | The live path: each incoming message becomes an AI turn, the assistant replies, and routing decides whether to continue or hand off. This is the heart of the feature. |
| **Re-engagement (Abandoned Bot) system** | When a contact goes quiet mid-conversation, a per-project ladder of timed follow-ups gently nudges them — and eventually closes the session if they never return. |
| **Knowledge-base ingestion** | How your content gets into the assistant's knowledge base: files from a Google Drive folder, and pages scraped from a curated list of website URLs. |
| **Provisioning + reporting** | Setting up a brand-new project's assistant from scratch, plus the reports that track what the assistant said and how much it cost. |

:::tip
You will see the term **knowledge base** a lot. It is simply the searchable store of your project's content that the assistant pulls answers from. The technique it uses is called **RAG** (Retrieval-Augmented Generation) — the assistant *retrieves* relevant snippets and *generates* an answer grounded in them. More on this in the **[Knowledge Base overview](/docs/q-ai-bot/knowledge-base)**.
:::

---

## How to read this section

These pages build on each other. If you are new, read them in order:

1. **[How It Works](/docs/q-ai-bot/how-it-works)** — one conversation walked through end to end, from switching the AI on to the reply being sent.
2. **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** — how a session starts, the ways it ends, what handoff means, and the Texter scenarios that wire it all together.
3. **[Response Schema](/docs/q-ai-bot/response-schema)** — the structured reply the assistant returns on every turn, and how the bot YAML reads it.
4. **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)** — how quiet conversations are re-engaged and eventually closed.
5. **[Knowledge Base overview](/docs/q-ai-bot/knowledge-base)** — how your content becomes answers, including the file pipeline and the website-scraping pipeline.

When you are ready to turn the AI on for a real project, use the **[Onboard AI Bot tool](/docs/tools/onboard-ai-bot)**, which provisions a new project's assistant end to end.

:::caution[The AI does not run the whole chat]
The Q-AI Bot only acts while **AI mode is on** for a chat. A master on/off switch on the chat controls this, and the Texter bot turns it on (and various events turn it off). If you ever wonder "why isn't the AI answering?", the first question is always: *is AI mode on for this chat?* The **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** page explains exactly what flips that switch.
:::

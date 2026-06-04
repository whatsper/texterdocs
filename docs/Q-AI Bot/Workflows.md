---
title: Workflows & Automations
sidebar_position: 8
slug: /q-ai-bot/workflows
description: The named background automations behind the Q-AI Bot — what each one does, when it runs, and how they connect to a live conversation and the knowledge lifecycle.
---

# Workflows & Automations

The Q-AI Bot is not a single program. It is a set of **background automation workflows** that run on an internal automation platform, each with one job. Together they take a chat from "AI turned on" all the way through to "handed back to a human," and they keep each project's knowledge base fresh in the background.

This page introduces every workflow **by name**, explains conceptually what it does, and links to the page where that behavior is documented in full. You rarely need these names day to day — skim this page once to see how the pieces fit, then refer back when a teammate mentions a workflow by name.

:::info[What is a "workflow" here?]
A **workflow** is a named background automation: a sequence of steps that an internal automation platform runs automatically when something happens (a chat event arrives, a timer fires, a file changes). You do not run these by hand — Texter operates them. You only need to understand *what* each one does and *when* it runs.
:::

---

## How the workflows fit together

At a high level there are two clocks ticking:

- **The conversation clock** — driven by chat events. When a chat turns the AI on, sends a message, or gets handed back to a human, a workflow reacts in real time.
- **The knowledge clock** — driven by schedules and file changes. In the background, other workflows keep each project's knowledge base in sync so the AI always answers from current information.

```mermaid
flowchart TD
    chat([Live chat in Texter])
    main["AI Assistant - Main<br/>(the live reply loop)"]
    abandon["AI Abandoned Bot<br/>(re-engagement ladder)"]
    files["AI File Management<br/>(uploaded files)"]
    scrape["Scraping Websites for AI<br/>(curated URL list)"]
    onboard["AI New Customer Onboarding<br/>(provision a new project)"]
    vs[(Knowledge base<br/>vector store)]

    chat --> main
    abandon -. nudges or closes idle chats .-> chat
    main -- reads from --> vs
    abandon -- reads from --> vs
    files --> vs
    scrape --> vs
    onboard -. seeds the project and its empty knowledge base .-> vs
```

---

## Conversation workflows

These react to live chat events. They are the part of the system a support hire will think about most.

### AI Assistant - Main

The **core reply loop** and the workflow that does the actual answering. Every time a chat has the AI turned on, sends a new message, or is handed back to a human, Texter notifies this workflow. It calls the AI model (with knowledge-base search), reads the structured answer, sends the reply back into the chat, and decides what to do next: keep going, hit the message limit, or hand the chat back to a person.

It is also the workflow that keeps each conversation's context, so the AI "remembers" what was said earlier in the same chat without resending the whole history.

See **[How It Works](/docs/q-ai-bot/how-it-works)** for a turn-by-turn walkthrough, and **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** for how a chat starts, continues, and ends.

### AI Assistant - Dev Sandbox

The **safe twin** of *AI Assistant - Main*. It does the same job but is used for **trialing changes** before they go live, so a new idea can be tested without touching real conversations on the production loop.

The sandbox also writes each test turn into an **evaluation report**, which makes it a natural place to check answer quality while experimenting.

:::tip[Why a twin exists]
New behavior is always tried on the sandbox first, never directly on the live loop. This keeps real conversations stable while changes are validated.
:::

See **[Reporting & Evaluation](/docs/q-ai-bot/reporting)** for what gets logged during these test runs.

### AI Abandoned Bot

Handles **idle conversations**. When someone stops replying mid-conversation, this workflow walks a per-project **re-engagement ladder**: a series of timed steps that can send a gentle reminder, send an AI-written nudge, or eventually close the session and hand the chat back to the normal Texter bot.

The ladder is configured per project, so each business can decide how patient and how persistent the follow-up should be.

See **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)** for the full ladder behavior.

---

## Knowledge workflows

These keep each project's knowledge base current. The AI reads from this knowledge base when it answers, so these workflows are what make the answers accurate and up to date.

### AI File Management

Keeps the knowledge base in sync with the **files** a project provides. When a knowledge file is added, changed, or removed in the project's document folder, this workflow mirrors that change into the AI's searchable knowledge base. It is also the path that updates a project's **system prompt** when the prompt document changes.

See **[Knowledge Files](/docs/q-ai-bot/knowledge-files)** for how files flow into the knowledge base.

### Scraping Websites for AI - Main Loop

Keeps the knowledge base in sync with a project's **website content**. It works from a **curated list of page URLs** (not by crawling the whole site). On a schedule, it compares that list against what is already stored and decides, for each page, whether it needs to be added, refreshed, or removed. It then hands each page off to one of three small helper workflows.

See **[Website Scraping](/docs/q-ai-bot/website-scraping)** for the full mechanism.

The three helpers it calls are:

| Workflow | What it does |
| --- | --- |
| **Create One Page** | Fetches a brand-new page, converts it to text, and adds it to the knowledge base. |
| **Update One Page** | Re-fetches an existing page and refreshes it **only if the content actually changed** (detected by comparing a content fingerprint). |
| **Delete One Page** | Removes a page from the knowledge base when it has dropped off the curated URL list. |

These three helpers are documented in full on **[Website Scraping](/docs/q-ai-bot/website-scraping)**, which owns the page-by-page mechanism.

---

## Setup & insight workflows

These run around the edges of a conversation rather than inside it.

### AI New Customer Onboarding

Provisions a **brand-new AI project** end to end: it creates the empty knowledge base, sets up the project's configuration and document folders, seeds a default system prompt and evaluation report, and imports the Texter scenarios that drive the AI lifecycle. This is the high-level flow behind the [Onboard AI Bot](/docs/tools/onboard-ai-bot) tool.

See **[Onboarding a New Project](/docs/q-ai-bot/onboarding)** for the step-by-step flow.

### Update AI Report Sheets

A small **logging helper** that *AI Assistant - Main* calls on every turn, in the background. It appends the turn's question, the AI's answer, and the model's reasoning to the project's evaluation report (for a human to score later), and records usage for cost and volume tracking. It is "fire-and-forget": the conversation never waits on it.

See **[Reporting & Evaluation](/docs/q-ai-bot/reporting)** for how the logs are structured and read.

---

## Where to go next

- **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** — how a chat moves through the AI and back to humans, plus the Texter scenarios that wake these workflows up.
- **[Per-Project Settings](/docs/q-ai-bot/per-project-settings)** — the configuration each of these workflows reads.
- **[Scenario Marketplace](/scenarios)** — import the Q-AI scenarios (search `q-ai` or filter the `ai-bot` tag) that trigger the conversation workflows.

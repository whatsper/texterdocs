---
title: Onboarding a New Project
sidebar_position: 9
slug: /q-ai-bot/onboarding
description: How to provision a brand-new Q-AI Bot project — knowledge store, configuration, Drive folders, default prompt and report, and scenario import — in one step.
---

# Onboarding a New Project

Onboarding sets up everything a new project needs to run the Q-AI Bot, in a single guided step. Instead of creating each piece by hand, you fill in a short form and a background automation workflow called **AI New Customer Onboarding** provisions the whole project for you.

This page explains what gets created, what you need to provide, how to run it, and how to confirm it worked.

---

## What onboarding sets up

When you onboard a project, **AI New Customer Onboarding** provisions the full starting state:

| Created | What it is |
| --- | --- |
| **A new knowledge store** | The project's private [knowledge base](/docs/q-ai-bot/knowledge-base) that the AI searches at answer time. It starts empty and fills as knowledge is added. |
| **The project configuration** | The project's row in the managed configuration database, linking its credentials, settings, and knowledge store together. |
| **The Drive folder tree** | A per-project root folder with **knowledge-base**, **reports**, and **instructions** subfolders, so files have a home from day one. |
| **A cloned default prompt** | A copy of the **Generic System Prompt** document, with the business name and phone filled in, ready to edit. |
| **A cloned evaluation report** | A copy of the **Generic Response Evaluation Report** sheet, used later to review answer quality. |
| **Scenario import** | The Q-AI scenarios that drive the conversation lifecycle are imported into the project's Texter environment. |

---

## What you provide

You supply a small set of details. Have these ready before you start:

- **Project id** — the project's identifier in Texter.
- **Business name and phone** — used to personalize the cloned system prompt and the evaluation report.
- **An admin email** — the project owner is given access to the new Drive folder so they can manage their own knowledge files.
- **Initial knowledge files** — the first documents that describe the business (FAQs, price lists, service descriptions, and so on). These seed the project's knowledge base.

:::info[The configuration is a starting point]
Onboarding gives the project sensible defaults. Fine-tuning — the prompt wording, the response behavior, and per-project options — happens afterward. See [Per-Project Settings](/docs/q-ai-bot/per-project-settings) to adjust the configuration, and the [Knowledge Base](/docs/q-ai-bot/knowledge-base) pages to add more material later.
:::

---

## Run it

Use the **Onboard AI Bot** tool to run onboarding from your browser. It walks you through the form fields above, lets you attach the initial knowledge files, and triggers the provisioning for you.

➡️ **[Open the Onboard AI Bot tool](/docs/tools/onboard-ai-bot)**

:::tip[Run onboarding once per project]
Onboarding creates fresh resources every time it runs. Run it **once** for a new project. If you need to add knowledge or change settings later, use the knowledge-base and settings flows instead of re-running onboarding.
:::

---

## Test your setup

Once onboarding finishes, confirm the project is wired up correctly.

### 1. Check the scenarios were imported

The Q-AI scenarios that drive the conversation lifecycle are imported automatically. You can review them in the **Scenario Marketplace** — open the [Scenario Marketplace](/scenarios) and search for **`q-ai`** (or filter by the **`ai-bot`** tag) to see the full set. These are the scenarios that turn the AI on, forward messages to it, and hand the chat back when the session ends.

### 2. Run the AI Bot recipe

To prove the integration end-to-end, drop the **AI Bot** test recipe into the project's bot YAML. It gives you a minimal flow that switches the AI on via a keyword and routes the chat back when the AI session ends — perfect for a smoke test before going live.

➡️ See the [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot) for the copy-pasteable snippet and integration steps.

:::tip[Send a real test message]
After wiring the recipe, message the project's number with the recipe's test keyword. You should see the AI take over the chat, reply using the project's knowledge base, and then hand the chat back when you trigger a termination. If it does, the project is ready.
:::

---

## Related pages

- [Q-AI Bot Overview](/docs/q-ai-bot/overview) — how the system fits together.
- [Per-Project Settings](/docs/q-ai-bot/per-project-settings) — tune the configuration after onboarding.
- [Knowledge Base](/docs/q-ai-bot/knowledge-base) — add and maintain the project's knowledge.
- [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle) — what the imported scenarios actually do.
- [FAQ & Troubleshooting](/docs/q-ai-bot/faq) — common questions after going live.

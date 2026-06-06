---
title: Onboarding a New Project
sidebar_position: 11
slug: /q-ai-bot/onboarding
description: How to provision a brand-new Q-AI Bot project (knowledge store, configuration, Drive folders, default prompt and report, and scenario import) in one step.
---

# Onboarding a New Project

Onboarding provisions everything a new project needs to run the Q-AI Bot in one guided step: you fill in a short form and the **AI New Customer Onboarding** workflow does the rest.

---

## What onboarding sets up

A single run creates:

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

- **Project id**: the project's identifier in Texter.
- **Business name and phone**: used to personalize the cloned system prompt and the evaluation report.
- **An admin email**: the project owner is given access to the new Drive folder so they can manage their own knowledge files.
- **Initial knowledge files**: the first documents that describe the business (FAQs, price lists, service descriptions, and so on). These seed the project's knowledge base.

:::info[The configuration is a starting point]
Onboarding gives the project sensible defaults. Fine-tuning (the prompt wording, the response behavior, and per-project options) happens afterward. See [Per-Project Settings](/docs/q-ai-bot/per-project-settings) to adjust the configuration, and the [Knowledge Base](/docs/q-ai-bot/knowledge-base) pages to add more material later.
:::

---

## Run it and test

Run onboarding **once** per project from the **[Onboard AI Bot](/docs/tools/onboard-ai-bot)** tool. Each run creates fresh resources, so use the knowledge-base and settings flows for later changes. To verify, confirm the Q-AI scenarios imported (search `q-ai` in the **[Scenario Marketplace](/scenarios)**) and run an end-to-end check with the **[AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot)**.

---

## Related pages

- [Q-AI Bot Overview](/docs/q-ai-bot/overview): how the system fits together.
- [Per-Project Settings](/docs/q-ai-bot/per-project-settings): tune the configuration after onboarding.
- [Knowledge Base](/docs/q-ai-bot/knowledge-base): add and maintain the project's knowledge.
- [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle): what the imported scenarios actually do.

---
title: FAQ & Troubleshooting
sidebar_position: 11
slug: /q-ai-bot/faq
description: Common questions and quick answers for the Q-AI Bot — handoffs, knowledge updates, prompt changes, turning the AI on or off, quality and usage, onboarding, and testing.
---

# FAQ & Troubleshooting

Quick answers to the questions support hears most about the Q-AI Bot. Each answer links to the page with the full story.

---

## Why did the AI hand off the chat (or not answer)?

A chat goes back to humans when the AI resolves it, decides it needs a person, hits the message limit, errors out, goes inactive, or a human takes over — each recorded as a **termination reason**.

If the AI **didn't answer at all**, the usual causes are that it was never turned on for that chat, a human had already taken over, or the relevant knowledge isn't in the project's knowledge base yet.

➡️ Full detail on every termination reason and handoff: [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle).

---

## How do I add or update what the AI knows?

The AI answers from the project's knowledge base via two pipelines — uploaded **files** and synced **website** pages. The [Knowledge Base](/docs/q-ai-bot/knowledge-base) pages cover both and which to use.

---

## How do I change the AI's prompt (how it talks)?

The **system prompt** shapes the AI's tone, scope, and behavior per project; you tailor it by editing the project's prompt document. ➡️ See [Per-Project Settings](/docs/q-ai-bot/per-project-settings).

---

## How do I turn the AI on or off for a chat?

A single **AI mode** switch controls whether the AI is handling a chat; everyday agent actions (assign, resolve, template message, pending) flip it off automatically, because a human takeover always wins. ➡️ What flips the switch is owned by [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle); the scenarios that wire it up are in the [Scenario Marketplace](/scenarios) (search **`q-ai`** or filter the **`ai-bot`** tag).

---

## Where do I see quality and usage?

Each project has a **Response Evaluation Report** for scoring the AI's answers, plus tracked model usage. ➡️ See [Quality & Usage](/docs/q-ai-bot/reporting).

---

## How do I onboard a new project?

The guided flow provisions the knowledge store, configuration, Drive folder tree, starter prompt and evaluation report, and Q-AI scenarios in one step. ➡️ Step-by-step: [Onboarding a New Project](/docs/q-ai-bot/onboarding), run from the **[Onboard AI Bot tool](/docs/tools/onboard-ai-bot)**.

---

## How do I test the AI on a project?

Use the **AI Bot** test recipe — a minimal bot-YAML flow that turns the AI on via a keyword and routes the chat back when the session ends. ➡️ Snippet, integration steps, and the smoke-test checklist are in the [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot) and [Onboarding](/docs/q-ai-bot/onboarding).

---

## Related pages

- [Q-AI Bot Overview](/docs/q-ai-bot/overview)
- [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)
- [Knowledge Base](/docs/q-ai-bot/knowledge-base)
- [Per-Project Settings](/docs/q-ai-bot/per-project-settings)
- [Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)
- [Onboarding a New Project](/docs/q-ai-bot/onboarding)
- [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot)

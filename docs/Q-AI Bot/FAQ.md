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

The AI hands a chat back for a few clear reasons, and each one is recorded as a **termination reason** on the chat:

- **It resolved the conversation** — the AI answered the contact's need and closed the chat itself.
- **It decided the conversation needs a person** — for example a request it shouldn't handle on its own.
- **The message limit was reached** — each project caps how many AI turns a single conversation can take. Past that, the chat goes back to humans.
- **Inactivity** — the lead went quiet and the re-engagement ladder reached its final step. See the [Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system).
- **An error occurred** — if something went wrong on the AI side, the chat is handed back rather than left stuck.
- **A human took over** — if an agent assigns, resolves, or messages the chat, the AI steps aside automatically.

If the AI **didn't answer at all**, the most common causes are that it was never turned on for that chat, a human had already taken over, or the relevant knowledge simply isn't in the project's knowledge base yet.

➡️ Full detail on all five termination reasons: [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle).

---

## How do I add or update what the AI knows?

The AI answers using the project's **[knowledge base](/docs/q-ai-bot/knowledge-base)** — its private set of documents and pages, searched at answer time. There are two ways to feed it:

- **Files** — upload documents (FAQs, price lists, policies) to the project's knowledge-base folder. They are picked up and indexed automatically.
- **Websites** — list the pages you want the AI to learn from; each page is fetched, converted to text, and kept in sync. Changed pages are re-indexed, removed pages are dropped.

➡️ See the [Knowledge Base](/docs/q-ai-bot/knowledge-base) pages for how to add files, manage website pages, and what to expect after an update.

:::tip[Knowledge changes are not instant]
After you add or edit knowledge, give the sync a moment to index the change before testing. If a fresh answer still looks stale, confirm the file or page actually made it into the project's knowledge folder or URL list.
:::

---

## How do I change the AI's prompt (how it talks)?

The **system prompt** is the instruction set that shapes the AI's tone, scope, and behavior for a project. Each project starts from a cloned copy of the **Generic System Prompt** during onboarding, then gets tailored.

You change the prompt by editing the project's prompt document — the update flows into the project's configuration automatically. You do not edit the configuration database by hand.

➡️ See [Per-Project Settings](/docs/q-ai-bot/per-project-settings) for how the prompt and other per-project options are managed.

---

## How do I turn the AI on or off for a chat?

A single master switch — **AI mode** (internally, external-bot mode) — controls whether the AI is handling a chat:

- **On** — the AI takes over and starts replying. In a bot flow this is triggered by the Q-AI scenarios (for example, when a node enables the AI).
- **Off** — the chat returns to the normal Texter flow or to a human agent.

Several everyday actions turn the AI **off** on their own: an agent assigning the chat, resolving it, sending a template message, or the chat moving to pending. That is by design — a human taking over always wins.

➡️ The scenarios that wire this up are in the [Scenario Marketplace](/scenarios) (search **`q-ai`** or filter the **`ai-bot`** tag), and the behavior is explained in [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle).

---

## Where do I see quality and usage?

Two reports cover this:

- **Quality** — each project has a **Response Evaluation Report** (cloned from the Generic Response Evaluation Report during onboarding). It logs the AI's answers so a person can review and score them.
- **Usage** — model usage is tracked so you can see how much the AI is being used.

➡️ See [Quality & Usage](/docs/q-ai-bot/reporting) for where these reports live and how to read them.

:::info[`ai` re-engagement nudges count toward usage]
If a project uses `ai` rungs in its re-engagement ladder, those nudges consume model usage and count as conversation turns, just like normal replies. See the [Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system#a-note-on-cost).
:::

---

## How do I onboard a new project?

Use the guided onboarding flow. It provisions the knowledge store, the configuration, the Drive folder tree, a starter prompt and evaluation report, and imports the Q-AI scenarios — all in one step.

➡️ Step-by-step: [Onboarding a New Project](/docs/q-ai-bot/onboarding). Run it from the **[Onboard AI Bot tool](/docs/tools/onboard-ai-bot)**.

---

## How do I test the AI on a project?

Use the **AI Bot** test recipe. It is a minimal bot-YAML flow that turns the AI on via a keyword and routes the chat back when the AI session ends — ideal for a quick smoke test before going live.

➡️ Grab the snippet and integration steps from the [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot).

:::tip[Smoke-test checklist]
Send the recipe's test keyword to the project's number and confirm: the AI takes over, it replies using the project's knowledge, and the chat hands back cleanly when you trigger a termination. If all three work, the integration is sound.
:::

---

## Related pages

- [Q-AI Bot Overview](/docs/q-ai-bot/overview)
- [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)
- [Knowledge Base](/docs/q-ai-bot/knowledge-base)
- [Per-Project Settings](/docs/q-ai-bot/per-project-settings)
- [Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)
- [Onboarding a New Project](/docs/q-ai-bot/onboarding)
- [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot)

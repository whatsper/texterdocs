---
title: Per-Project Settings
sidebar_position: 4
slug: /q-ai-bot/per-project-settings
description: The settings that shape each project's AI assistant (system prompt, model and creativity, message limit, response schema, knowledge base, and re-engagement ladder), and who changes each one.
---

# Per-Project Settings

Every project gets its own AI assistant, tuned independently: same machinery, different **settings** (personality, knowledge base, follow-up patience). This page covers what is configurable per project, where those settings live, and who changes each one. Per-project settings are operated by Texter support, not by the project's own users.

---

## Where settings live

A project's AI settings are stored centrally in **a managed configuration database** that Texter operates, read by every [background automation workflow](/docs/q-ai-bot/workflows) on each turn, so a change takes effect on the next turn, with no redeploy.

---

## The settings, project by project

| Setting | What it controls | Changed by |
| --- | --- | --- |
| **System prompt** | The assistant's instructions, personality, and rules: its "job description." | The business's prompt document (see below) |
| **Model + creativity** | Which AI model answers, and how creative vs. precise it is. | Texter support |
| **Message limit** | How many turns the AI handles before handing the chat back to a human. | Texter support |
| **Response schema** | The fixed shape of every AI answer that the bot YAML reads. | Texter support |
| **Knowledge base** | The searchable material the AI answers from (files + scraped pages). | The project's files and URL list |
| **Re-engagement ladder** | How the AI follows up when someone goes quiet. | Texter support |
| **Extra session context** | Optional project-specific data handed to the assistant when a session starts. | Texter support (Turn On AI Bot scenario) |

The sections below explain each one.

### System prompt

The single biggest lever on how the AI behaves. It is not edited in the database directly: each project has an editable system-prompt document, and the file-sync workflow flows saved changes into the stored prompt. See [Knowledge Files](/docs/q-ai-bot/knowledge-files) for that mechanism.

### Model + creativity

Projects share one **model** by default. **Creativity** controls how much the AI varies its wording: lower is more precise and repeatable, higher more varied. Most projects keep the default; it is occasionally lowered for projects that need especially careful answers.

For what the model, **temperature** (creativity), and **verbosity** actually do under the hood, see [RAG & OpenAI Concepts](/docs/q-ai-bot/rag-and-openai-concepts).

### Per-conversation message limit

A safety valve so a long, unresolved conversation reaches a person rather than looping (one of the end reasons in [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)). It also sets the project's **pricing tier** (10 messages vs 25), see **[Pricing](/docs/q-ai-bot/pricing)**.

### Response schema

Because every answer comes back in the same structure, the bot YAML can read it reliably, knowing exactly where to find the reply text and the signal for whether to hand the chat back. You usually do not need to touch this: the default works for most projects, and a small number use a customized schema to capture extra structured details. See **[Response Schema](/docs/q-ai-bot/response-schema)** for the full field-by-field breakdown.

### Knowledge base

Built from two auto-syncing pipelines, project [files](/docs/q-ai-bot/knowledge-files) and scraped [website pages](/docs/q-ai-bot/website-scraping) from a curated URL list, and managed by adding, updating, or removing those files and URLs. See the **[Knowledge Base](/docs/q-ai-bot/knowledge-base)** overview for the full picture.

### Re-engagement ladder

A per-project, ordered list of timed follow-up steps. Its full mechanics (step modes, timing, reset-on-reply, and the **12-hour** cap on total follow-up delay) are documented in **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)**.

### Extra session context

So the assistant starts already knowing project-specific facts: the campaign a contact replied to, their labels, a CRM detail, and so on. It is an open, per-project object with no fixed shape, wired into the project's Turn On AI Bot scenario. See [Optional: extra context at session start](/docs/q-ai-bot/how-it-works#optional-extra-context-at-session-start) for the mechanism and a worked example.

---

## Sensible defaults

New projects start from sensible defaults so they work on day one, then get tuned over time:

- A **generic system prompt** template, personalized with the business's name and contact details.
- The **default model and creativity**: precise, consistent answers out of the box.
- A **default message limit** suitable for typical support chats.
- The **default response schema**, which fits most projects.
- An **empty knowledge base** that fills up as files and website pages are added.
- A **default re-engagement ladder** (a light reminder, then a close) that any project can replace with its own.

:::note[Defaults are a starting point]
The defaults are deliberately conservative. As a project's [evaluation reports](/docs/q-ai-bot/reporting) reveal what to improve, support adjusts the settings above to fit that business.
:::

---

## Where to go next

- **[Workflows & Automations](/docs/q-ai-bot/workflows)**: the automations that read these settings.
- **[Response Schema](/docs/q-ai-bot/response-schema)**: the exact shape of every AI answer.
- **[Knowledge Base](/docs/q-ai-bot/knowledge-base)**: how the AI's source material is built and kept current.
- **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)**: the re-engagement ladder in detail.
- **[Reporting & Evaluation](/docs/q-ai-bot/reporting)**: how feedback drives the settings you tune here.
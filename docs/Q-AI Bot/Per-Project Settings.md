---
title: Per-Project Settings
sidebar_position: 7
slug: /q-ai-bot/per-project-settings
description: The settings that shape each project's AI assistant — system prompt, model and creativity, message limit, response schema, knowledge base, and re-engagement ladder — and who changes each one.
---

# Per-Project Settings

Every project gets its own AI assistant, tuned independently — same machinery, different **settings** (personality, knowledge base, follow-up patience). This page covers what is configurable per project, where those settings live, and who changes each one. Per-project settings are operated by Texter support, not by the project's own users.

---

## Where settings live

A project's AI settings are stored centrally in **a managed configuration database** that Texter operates, read by every [background automation workflow](/docs/q-ai-bot/workflows) on each turn — so a change takes effect on the next turn, with no redeploy.

---

## The settings, project by project

Here is the full set of per-project settings, what each one does, and who normally changes it.

| Setting | What it controls | Changed by |
| --- | --- | --- |
| **System prompt** | The assistant's instructions, personality, and rules — its "job description." | The business's prompt document (see below) |
| **Model + creativity** | Which AI model answers, and how creative vs. precise it is. | Texter support |
| **Message limit** | How many turns the AI handles before handing the chat back to a human. | Texter support |
| **Response schema** | The fixed shape of every AI answer that the bot YAML reads. | Texter support |
| **Knowledge base** | The searchable material the AI answers from (files + scraped pages). | The project's files and URL list |
| **Re-engagement ladder** | How the AI follows up when someone goes quiet. | Texter support |

The sections below explain each one.

### System prompt

The **system prompt** is the assistant's standing instructions — who it is, what it helps with, its tone and rules — and the single biggest lever on how the AI behaves. It is not edited in the database directly: each project has an editable system-prompt document, and the file-sync workflow flows saved changes into the stored prompt. See [Knowledge Files](/docs/q-ai-bot/knowledge-files) for that mechanism.

### Model + creativity

Each project is configured with a specific **model** and a **creativity** setting:

- **Model** — the AI that does the reasoning (a GPT-5.2-class model via the OpenAI Responses API; see [How It Works](/docs/q-ai-bot/how-it-works)). The same model is used across projects by default.
- **Creativity** — how much the AI varies its wording and reasoning. Lower means more precise and repeatable answers; higher means more varied, conversational ones.

Most projects keep the default creativity. It is occasionally lowered for projects that need especially careful, consistent answers. This is a Texter support change.

### Per-conversation message limit

The **message limit** caps how many turns the AI handles in a single conversation before it hands the chat back to a human — a safety valve so a long, unresolved conversation reaches a person rather than looping (one of the end reasons in [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)). It also sets the project's **pricing tier** (10 messages vs 25) — see **[Pricing](/docs/q-ai-bot/pricing)**.

### Response schema

The **response schema** is the fixed shape that every AI answer must follow. Because the answer always comes back in the same structure, the bot YAML can read it reliably — knowing exactly where to find the reply text and the signal for whether to hand the chat back.

You usually do not need to touch this; the default schema works for most projects. A small number of projects use a customized schema to capture extra structured details. See **[Response Schema](/docs/q-ai-bot/response-schema)** for the full field-by-field breakdown.

### Knowledge base

The **knowledge base** is the material the AI searches when it answers, so its answers reflect the project's own information rather than generic web knowledge. It is built from two auto-syncing pipelines — project [files](/docs/q-ai-bot/knowledge-files) and scraped [website pages](/docs/q-ai-bot/website-scraping) from a curated URL list — and managed by adding, updating, or removing those files and URLs. See the **[Knowledge Base](/docs/q-ai-bot/knowledge-base)** overview for the full picture.

### Re-engagement ladder

The **re-engagement ladder** is a per-project, ordered list of timed follow-up steps for when someone stops replying mid-conversation. Its full mechanics — rung modes, timing, reset-on-reply, and the **12-hour** cap on total follow-up delay — are documented in **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)**.

---

## Sensible defaults

New projects start from sensible defaults so they work on day one, then get tuned over time:

- A **generic system prompt** template, personalized with the business's name and contact details.
- The **default model and creativity** — precise, consistent answers out of the box.
- A **default message limit** suitable for typical support chats.
- The **default response schema**, which fits most projects.
- An **empty knowledge base** that fills up as files and website pages are added.
- A **default re-engagement ladder** — a light reminder, then a close — that any project can replace with its own.

:::note[Defaults are a starting point]
The defaults are deliberately conservative. As a project's [evaluation reports](/docs/q-ai-bot/reporting) reveal what to improve, support adjusts the settings above to fit that business.
:::

---

## Where to go next

- **[Workflows & Automations](/docs/q-ai-bot/workflows)** — the automations that read these settings.
- **[Response Schema](/docs/q-ai-bot/response-schema)** — the exact shape of every AI answer.
- **[Knowledge Base](/docs/q-ai-bot/knowledge-base)** — how the AI's source material is built and kept current.
- **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)** — the re-engagement ladder in detail.
- **[Reporting & Evaluation](/docs/q-ai-bot/reporting)** — how feedback drives the settings you tune here.
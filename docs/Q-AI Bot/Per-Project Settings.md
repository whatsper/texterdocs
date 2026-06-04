---
title: Per-Project Settings
sidebar_position: 7
slug: /q-ai-bot/per-project-settings
description: The settings that shape each project's AI assistant — system prompt, model and creativity, message limit, response schema, knowledge base, and re-engagement ladder — and who changes each one.
---

# Per-Project Settings

Every project gets its own AI assistant, and each one is tuned independently. Two projects can share the exact same machinery yet behave completely differently because their **settings** differ: a different personality, a different knowledge base, a different patience level for following up.

This page explains **what is configurable per project**, **where those settings live**, and **who changes each one**.

:::caution[These settings are operated by Texter support]
Per-project settings are managed by **Texter support**, not by the project's own users. The business does not log into a settings screen to change the model or the message limit. If you run a project and want something changed, the route is to ask Texter — this keeps every assistant safe, consistent, and within platform limits.
:::

---

## Where settings live

A project's AI settings are stored centrally in **a managed configuration database** that Texter operates. Each project has its own configuration entry, and the [background automation workflows](/docs/q-ai-bot/workflows) read from it on every turn.

Storing settings centrally (rather than in the bot YAML) means:

- The same setting is read consistently by every workflow — the live reply loop, the re-engagement ladder, and the knowledge pipelines all see the same values.
- A change takes effect for the **next** turn without redeploying anything.
- Secrets and connection details never appear in public bot YAML.

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

The **system prompt** is the assistant's standing instructions: who it is, what it helps with, the tone it uses, and the rules it must follow. It is the single biggest lever on how the AI behaves.

The prompt is **not** edited directly in the configuration database. Instead, each project has a **system-prompt document** — a starting template that is personalized per project. When that document is edited and saved, the file-sync workflow picks up the change and updates the project's stored prompt automatically. The full mechanism (where the document lives and how the change flows in) is documented in [Knowledge Files](/docs/q-ai-bot/knowledge-files).

:::tip[Why a document, not a database field]
Keeping the prompt in an editable document means it can be written, reviewed, and revised like any other piece of writing — no database access required — and the change still flows safely into the live assistant.
:::

### Model + creativity

Each project is configured with a specific **model** and a **creativity** setting:

- **Model** — the AI that does the reasoning (a GPT-5.2-class model via the OpenAI Responses API; see [How It Works](/docs/q-ai-bot/how-it-works)). The same model is used across projects by default.
- **Creativity** — how much the AI varies its wording and reasoning. Lower means more precise and repeatable answers; higher means more varied, conversational ones.

Most projects keep the default creativity. It is occasionally lowered for projects that need especially careful, consistent answers. This is a Texter support change.

### Per-conversation message limit

The **message limit** caps how many turns the AI will handle in a single conversation before it hands the chat back to a human. It is a safety valve: if a conversation runs long without resolving, a person steps in rather than letting the AI loop indefinitely.

When the limit is reached, the chat is handed back to a human (the same handoff path described in [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)).

:::info Pricing tier
The message limit also sets the project's **pricing tier** (10 messages vs 25) — see **[Pricing](/docs/q-ai-bot/pricing)**.
:::

:::note[Hypothetical example]
A project might set its message limit so the AI handles, say, the first **8** back-and-forth turns of a chat. If the person is still chatting after that, the conversation moves to a human. The exact number is chosen per project by Texter support.
:::

### Response schema

The **response schema** is the fixed shape that every AI answer must follow. Because the answer always comes back in the same structure, the bot YAML can read it reliably — knowing exactly where to find the reply text and the signal for whether to hand the chat back.

You usually do not need to touch this; the default schema works for most projects. A small number of projects use a customized schema to capture extra structured details. See **[Response Schema](/docs/q-ai-bot/response-schema)** for the full field-by-field breakdown.

### Knowledge base

The **knowledge base** is the material the AI searches when it answers — so its answers reflect the project's own information instead of generic web knowledge. It is built from two sources that stay in sync automatically:

- **Files** the project provides — see [Knowledge Files](/docs/q-ai-bot/knowledge-files).
- **Website pages** from a curated URL list — see [Website Scraping](/docs/q-ai-bot/website-scraping).

The knowledge base content is managed by adding, updating, or removing files and URLs; the pipelines do the syncing. For the full picture, see the **[Knowledge Base](/docs/q-ai-bot/knowledge-base)** overview.

### Re-engagement ladder

The **re-engagement ladder** controls what happens when someone stops replying mid-conversation. It is an ordered list of timed steps — for example, a gentle reminder after a while, then an AI-written follow-up, then closing the session and handing the chat back to the normal bot.

The ladder is configured per project so each business can decide how patient and how persistent the follow-up should be. The full behavior is documented in **[Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system)**.

:::caution[There is a platform cap]
A project's ladder cannot stretch follow-ups out indefinitely — the delays across all steps must add up to **at most 12 hours**. This keeps re-engagement within a sensible, bounded period. See [Abandoned Bot System](/docs/q-ai-bot/abandoned-bot-system) for how the cap is enforced.
:::

---

## Who changes what — at a glance

The **Changed by** column in the settings table above is the full picture. In short:

- **Driven by the business's own content:** the **system prompt** (through its prompt document) and the **knowledge base** (through its files and URL list).
- **Operated by Texter support:** the **model + creativity**, the **message limit**, the **response schema**, and the **re-engagement ladder**.

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
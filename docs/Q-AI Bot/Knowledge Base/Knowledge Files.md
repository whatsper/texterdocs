---
title: Knowledge Files (Drive Sync)
sidebar_position: 2
slug: /q-ai-bot/knowledge-files
description: How uploaded documents flow from a project's Google Drive folders into its OpenAI vector store, kept in sync automatically by a Drive-watcher and the AI File Management workflow.
---

# Knowledge Files (Drive Sync)

Uploaded **knowledge files** are documents you control directly — price lists, policies, FAQs, brochures, anything you want the bot to answer from. You manage them in one place: the project's **Google Drive folder**. A watcher notices your changes and keeps the project's [vector store](/docs/q-ai-bot/knowledge-base) in step automatically.

:::info[Where this fits]
This is one of the two ways content enters a project's knowledge base. The other is [Website Scraping](/docs/q-ai-bot/website-scraping). Both feed the same vector store, which the bot searches at answer time. See [Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base) for the big picture.
:::

---

## The Drive folder structure

Every project gets its own **root folder** in Google Drive, created during onboarding (see [Onboard AI Bot](/docs/tools/onboard-ai-bot)). Inside that root are three subfolders, each with a clear job:

| Subfolder | What goes here |
| --- | --- |
| **knowledge-base** | The documents the bot answers from. Files here are synced into the project's vector store. |
| **reports** | The project's evaluation report sheet (the *Generic Response Evaluation Report*), where answers are logged for review. |
| **instructions** | The system-prompt document for the project (a clone of the *Generic System Prompt* doc). Editing it updates how the assistant behaves. |

:::tip
To add or change what the bot knows, work in the **knowledge-base** subfolder. To change how the bot *behaves* (tone, rules, persona), edit the system-prompt doc in **instructions** — covered below.
:::

---

## The Drive-watcher

You never touch the vector store directly. Instead, a small **Apps Script** — a script that runs on the Google side, attached to the project's Drive folder — acts as a watcher. Its only job is to notice a change and raise a signal:

- A file was **created** in the knowledge-base subfolder.
- A file was **updated** (replaced or edited).
- A file was **deleted**.

When the watcher sees one of these events, it triggers the **AI File Management** workflow — one of the Q-AI Bot's background automation workflows — and hands off the rest of the work.

:::note
The watcher is the bridge between "I dropped a file in Drive" and "the bot can now answer from it." It does not do the syncing itself; it detects the change and lets AI File Management do the heavy lifting.
:::

---

## What AI File Management does

The **AI File Management** workflow keeps the vector store matched to the Drive folder. It reacts to the watcher's signal and maps each kind of change to one action:

| Drive event | What the workflow does |
| --- | --- |
| **Create** | Uploads the new file and **attaches** it to the project's vector store, then records it in the knowledge-base index. |
| **Update** | **Replaces** the file in the vector store with the new version. |
| **Delete** | **Removes** the file from the vector store. |

The result: the project's knowledge base always reflects what is currently in the Drive folder. Drop in a new policy and the bot can answer from it; delete an outdated brochure and the bot stops answering from it.

:::caution[Give the sync a moment]
Syncing runs in the background a short time after you change a file in Drive. If you just uploaded something and the bot doesn't seem to know it yet, wait a little and try again before assuming something is wrong.
:::

---

## The system prompt lives in Drive too

The assistant's **system prompt** — the instructions that set its persona, rules, and tone — is *not* hand-edited in the managed configuration database. Instead, it is maintained as a document in the **instructions** subfolder (the project's own copy of the **Generic System Prompt** doc, cloned and filled in during onboarding).

When you edit that document, AI File Management picks up the change and writes the new instructions into the project's configuration for you. This keeps prompt edits in one friendly place — a Google Doc — instead of in the database. The system prompt is the *only* assistant setting changed this way; for the full picture of which settings are edited where, see [Per-Project Settings](/docs/q-ai-bot/per-project-settings).

:::tip[Behavior vs. knowledge]
- Want the bot to **know** a new fact? Add a file to **knowledge-base**.
- Want the bot to **behave** differently? Edit the system-prompt doc in **instructions**.

Both flow through the same Drive sync, but they change different things.
:::

---

## Where to go next

- **[Website Scraping](/docs/q-ai-bot/website-scraping)** — the other way to fill the knowledge base, for content that lives on the web.
- **[Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base)** — how the bot searches everything at answer time.
- **[Onboard AI Bot](/docs/tools/onboard-ai-bot)** — provisions the Drive folder tree and the vector store for a new project.

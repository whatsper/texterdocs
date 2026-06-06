---
title: Knowledge Base & Retrieval
sidebar_position: 1
slug: /q-ai-bot/knowledge-base
description: How the Q-AI Bot answers from a per-project knowledge base using retrieval-augmented generation (RAG) over an OpenAI vector store, and the two ways content gets in.
---

# Knowledge Base & Retrieval

Every project gets its own **knowledge base**: a searchable library of that business's content that the assistant looks things up in at answer time. New here? Start with the [Q-AI Bot overview](/docs/q-ai-bot/overview).

---

## How retrieval works, briefly

On each turn the assistant uses **retrieval-augmented generation (RAG)**: it searches the project's knowledge base, pulls back the most relevant passages, and grounds its answer in them rather than in what the model learned in training. The content lives in a single **vector store** per project (its own search index, so businesses never see each other's content), created automatically at onboarding. Retrieval happens via a built-in tool, **`file_search`**: as long as the right content is in the store, the bot finds it.

:::tip[Want the mechanics?]
For how content becomes searchable (chunking, embeddings, vector search), why we recommend splitting content into separate files, and the model settings that shape answers, see **[RAG & OpenAI Concepts](/docs/q-ai-bot/rag-and-openai-concepts)**.
:::

---

## Two ways content gets into the knowledge base

A project's vector store is filled from two independent pipelines. Both end up in the **same** store, and the bot searches across everything at answer time.

| Source | What it is | Best for | Set up in |
| --- | --- | --- | --- |
| **Uploaded files** | Documents you place in the project's Google Drive folders (PDFs, docs, text, etc.) | Stable reference material you control directly: price lists, policies, FAQs, brochures | [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files) |
| **Curated websites** | A hand-picked list of web pages, fetched as markdown | Content that already lives on the public site and changes over time | [Website Scraping](/docs/q-ai-bot/website-scraping) |

Most projects use both. For a fuller decision guide, see [When to use website content vs uploaded files](/docs/q-ai-bot/website-scraping#when-to-use-website-content-vs-uploaded-files).

---

## Keeping the index fresh

Both pipelines keep the vector store in step with the source material:

- **Files**: a Drive-watcher notices when a file is added, changed, or removed and syncs the store to match. See [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files).
- **Websites**: a scheduled run re-fetches the curated pages, detects which ones changed, and updates only those. See [Website Scraping](/docs/q-ai-bot/website-scraping).

:::caution[Stale content is the #1 cause of bad answers]
If the bot gives an outdated answer, check whether the source file or page was updated and whether the sync has run since. A correct knowledge base that is out of date will confidently return the old facts.
:::

---

## Where to go next

- **[Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files)**: manage uploaded documents through the project's Google Drive folders.
- **[Website Scraping](/docs/q-ai-bot/website-scraping)**: keep curated web pages in sync with the vector store.
- **[Onboard AI Bot](/docs/tools/onboard-ai-bot)**: provision a new project, including its vector store.

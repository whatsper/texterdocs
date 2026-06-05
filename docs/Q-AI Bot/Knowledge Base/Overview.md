---
title: Knowledge Base & Retrieval
sidebar_position: 1
slug: /q-ai-bot/knowledge-base
description: How the Q-AI Bot answers from a per-project knowledge base using retrieval-augmented generation (RAG) over an OpenAI vector store, and the two ways content gets in.
---

# Knowledge Base & Retrieval

Every project gets its own **knowledge base** — a searchable library of that business's content — and the assistant looks things up in it at the moment it answers, rather than relying on what the underlying model memorized. New here? Start with the [Q-AI Bot overview](/docs/q-ai-bot/overview).

---

## Retrieval-Augmented Generation (RAG) in one paragraph

**Retrieval-augmented generation (RAG)** means the assistant retrieves relevant material from a knowledge base *first*, then writes its answer using that material — rather than relying only on what the underlying model learned during training. When a visitor asks a question, the bot searches the project's knowledge base, pulls back the most relevant passages, and uses them as grounding for its reply. This keeps answers accurate, current, and specific to the business, even though the model itself was never trained on that business's data.

---

## Vector stores and file_search

Each project's knowledge base lives in a single **vector store** — a search index built by the OpenAI Responses API. A vector store holds the project's content broken into passages and indexed by *meaning*, so the bot can match a visitor's question to the right passages even when the wording is different.

- **One store per project.** Every project has its own vector store, so businesses never see each other's content. The store is created automatically when a project is onboarded (see [Onboard AI Bot](/docs/tools/onboard-ai-bot)).
- **Retrieval at answer time.** The assistant reasons with a GPT-5.2-class model via the OpenAI Responses API. On each turn it uses a built-in tool called **`file_search`**, which queries the project's vector store and returns the most relevant passages for the question being asked.
- **Grounded answers.** The model writes its reply from the retrieved passages, so the answer is anchored to the project's real content rather than invented.

Retrieval happens per turn, automatically — as long as the right content is in the vector store, the bot finds it.

---

## Two ways content gets into the knowledge base

A project's vector store is filled from two independent pipelines. Both end up in the **same** store, and the bot searches across everything at answer time.

| Source | What it is | Best for | Set up in |
| --- | --- | --- | --- |
| **Uploaded files** | Documents you place in the project's Google Drive folders (PDFs, docs, text, etc.) | Stable reference material you control directly — price lists, policies, FAQs, brochures | [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files) |
| **Curated websites** | A hand-picked list of web pages, fetched as markdown | Content that already lives on the public site and changes over time | [Website Scraping](/docs/q-ai-bot/website-scraping) |

In short: use uploaded files when you own the source document and want it stored verbatim; use website scraping when the canonical version lives on the site and you'd rather keep it in sync than re-upload by hand. Most projects use both. For a fuller decision guide, see [When to use website content vs uploaded files](/docs/q-ai-bot/website-scraping#when-to-use-website-content-vs-uploaded-files).

---

## Keeping the index fresh

A knowledge base is only as good as how current it is. Both pipelines are built to keep the vector store in step with the source material:

- **Files** — a Drive-watcher notices when a file is added, changed, or removed and syncs the store to match. See [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files).
- **Websites** — a scheduled run re-fetches the curated pages, detects which ones actually changed, and updates only those. See [Website Scraping](/docs/q-ai-bot/website-scraping).

:::caution[Stale content is the #1 cause of bad answers]
If the bot gives an outdated answer, check whether the source file or page was updated and whether the sync has run since. A correct knowledge base that is out of date will confidently return the old facts.
:::

---

## Where to go next

- **[Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files)** — manage uploaded documents through the project's Google Drive folders.
- **[Website Scraping](/docs/q-ai-bot/website-scraping)** — keep curated web pages in sync with the vector store.
- **[Onboard AI Bot](/docs/tools/onboard-ai-bot)** — provision a new project, including its vector store.

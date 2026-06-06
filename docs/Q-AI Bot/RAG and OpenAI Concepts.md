---
title: RAG & OpenAI Concepts
sidebar_position: 6
slug: /q-ai-bot/rag-and-openai-concepts
description: "A plain-language look under the hood: how the assistant finds the right knowledge (chunking, embeddings, vector search) and the model settings (model, temperature, verbosity) that shape its answers."
---

# RAG & OpenAI Concepts

This page is the **under-the-hood explainer**: how the assistant actually finds the right piece of knowledge before it answers, and the handful of model settings that shape how it writes. You do not need any of this to operate the bot, but it explains *why* the system is set up the way it is, including why we recommend splitting your knowledge into separate, focused files.

For the operational view (what content goes in and how), see the [Knowledge Base overview](/docs/q-ai-bot/knowledge-base). This page goes one level deeper.

---

## The core idea: retrieve, then answer

The model behind the assistant was never trained on your business. It does not "know" your prices, policies, or services. Instead, on each turn it **looks them up** in the project's knowledge base and writes its answer from what it found. That two-step move (retrieve relevant material, then generate an answer grounded in it) is **Retrieval-Augmented Generation (RAG)**.

Three things have to happen for that to work well: the content has to be broken into searchable pieces, those pieces have to be searchable *by meaning*, and the right pieces have to be pulled back at answer time. The rest of this page walks those three.

---

## 1. Chunking: from documents to passages

When a file or web page enters the knowledge base, it is automatically split into smaller passages called **chunks**, each a few paragraphs long. The assistant never retrieves a whole file; it retrieves **chunks**. This is the single most important thing to understand, because it drives how you should organize your content:

:::tip[Split distinct subjects into separate files]
Because retrieval pulls only the few most relevant chunks, a file that mixes many unrelated subjects produces muddled, half-on-topic chunks, while a file covering **one subject** produces clean, focused ones. So keep one topic per file (pricing in one, the cancellation policy in another, each service in its own) and structure each file with clear headings. "One big document with everything in it" is the worst case and "a tidy set of focused files" is the best case, even at the same total word count.
:::

---

## 2. Embeddings: searching by meaning, not keywords

Each chunk is converted into an **embedding**: a long list of numbers (a vector) that captures the *meaning* of the text rather than its exact words. Chunks with similar meaning end up with similar vectors, sitting close together in that numeric space.

At answer time, the visitor's question is turned into an embedding the same way, and the system finds the chunks whose vectors are **closest** to the question's. This is **semantic search**, and it is why the bot can match a question to the right passage even when they share no words: "how much is an ADHD test" can find a chunk titled "assessment pricing" because the *meanings* line up.

A plain keyword search would miss that. Embeddings are what make the lookup robust to how people actually phrase things.

---

## 3. The vector store: the searchable index

All of a project's chunk embeddings live in one **vector store** (a kind of vector database). There is exactly **one per project**, so businesses never see each other's content, and it is created automatically when a project is onboarded.

On every turn, the assistant calls a built-in tool, **`file_search`**, which:

1. turns the current question into an embedding,
2. finds the closest chunks in the project's vector store (a **small handful** of the most relevant ones, not the whole library), and
3. hands those chunks back to the model as grounding for its reply.

If the right content is in the store and chunked cleanly, the bot finds it; if it is buried in a noisy, mixed file, retrieval gets hit-or-miss.

:::note[You don't tune the chunking or embeddings]
The chunking and embedding are handled automatically by the knowledge-base infrastructure. You do not set chunk sizes or pick an embedding model. What you *do* control, and what matters most, is **how you organize the source content**.
:::

---

## The model settings that shape answers

Retrieval finds the facts; the **model** turns them into a reply. A few per-project settings shape how it writes. They live in the [per-project configuration](/docs/q-ai-bot/per-project-settings):

| Setting | What it does | Typical value |
| --- | --- | --- |
| **Model** | The reasoning model (a GPT-5.2-class model via the OpenAI Responses API) that reads the question, the retrieved chunks, and the conversation so far, then writes the reply. | The same model across projects |
| **Temperature** (creativity) | How much the wording varies from one run to the next. Lower is more precise and repeatable; higher is more varied and conversational. Support-style bots want it on the lower side. | Around 0.5, lowered for projects that need especially careful answers |
| **Verbosity** | How long and detailed the replies tend to be. Lower keeps answers short and to the point, which suits WhatsApp. | Low |
| **Structured output** | The model is constrained to return the project's [response schema](/docs/q-ai-bot/response-schema), so every answer comes back in a fixed, machine-readable shape. | On (strict) |
| **Retrieved chunks per turn** | How many of the most-relevant chunks `file_search` pulls back to ground each answer. | A few |
| **Message limit** | How many turns the AI handles before handing the chat back to a human. | See [Per-Project Settings](/docs/q-ai-bot/per-project-settings) |

---

## What to take away

- **Organize for chunking.** One subject per file, clear headings. This does more for answer quality than any setting.
- **Meaning, not keywords.** Content is matched semantically, so write naturally; no need to stuff in keywords.
- **Keep it current.** Stale content is the most common cause of wrong answers: an outdated chunk gets answered from just as confidently as a correct one (see [Knowledge Base](/docs/q-ai-bot/knowledge-base#keeping-the-index-fresh)).
- **Settings are a fine-tune.** Model, temperature, and verbosity adjust *how* the assistant writes; they cannot fix missing or messy knowledge.

---

## Where to go next

- **[Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base)**: the operational overview of the knowledge base.
- **[Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files)** and **[Website Scraping](/docs/q-ai-bot/website-scraping)**: the two ways content gets in.
- **[Per-Project Settings](/docs/q-ai-bot/per-project-settings)**: where the model, temperature, and the rest are configured.
- **[Response Schema](/docs/q-ai-bot/response-schema)**: the structured output the model is constrained to.

---
title: Website Scraping
sidebar_position: 3
slug: /q-ai-bot/website-scraping
description: How a curated list of web pages is fetched as markdown, change-detected with content hashing, and synced into a project's OpenAI vector store by the website-scraping workflows.
---

# Website Scraping

**Website scraping** keeps a project's public web content inside its [knowledge base](/docs/q-ai-bot/knowledge-base) without anyone re-uploading pages by hand. You hand the system a curated list of URLs; it fetches each page, notices what actually changed, and keeps the project's [vector store](/docs/q-ai-bot/knowledge-base) in step. This is one of the [two ways content enters the knowledge base](/docs/q-ai-bot/knowledge-base); the other is [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files).

---

## When to use website content vs uploaded files

Both sources are valid, and most projects use a mix. Choose based on **where the canonical version of the content lives**:

| Use **website scraping** when... | Use **[uploaded files](/docs/q-ai-bot/knowledge-files)** when... |
| --- | --- |
| The content already lives on the public site and is maintained there | You own the source document directly (a price list, a policy PDF) |
| It changes over time and you'd rather keep it in sync than re-upload | The material is stable and you want it stored verbatim |
| You want a single source of truth: edit the page, the bot follows | The content isn't published on the web at all |

:::tip
A good rule of thumb: if updating a fact means editing the website anyway, scrape it. If updating a fact means editing a document, upload it.
:::

---

## How it works

The mechanism is driven entirely by a **curated URL list** — there is no crawling.

1. **Curated URL list.** The list of pages is maintained by hand in a **Google Sheet** — up to **50 URLs** per project — and is the single source of truth for what's in the knowledge base from the web.
2. **Fetch as markdown.** Each page on the list is fetched and converted into clean **markdown** — readable text without the site's navigation and styling — which is what the vector store indexes.
3. **Content-hash change detection.** The system computes a content hash (a short fingerprint) of each page's markdown and compares it to the fingerprint stored from last time. If they match, the page is unchanged and **skipped**. If they differ, the page is updated.
4. **Create / update / delete in the vector store.** Based on the comparison between the curated list and what's already indexed, each page is created, updated, or removed.

---

## The workflows behind it

Website scraping is run by a small family of **background automation workflows**, on a recurring schedule per project:

- **Scraping Websites for AI - Main Loop** — the coordinator. It compares the curated URL list against what's already indexed and routes each page to one of three sub-workflows: new to the list goes to **Create**, on both list and index goes to **Update**, dropped off the list goes to **Delete**.
- **Create One Page** — fetches a brand-new URL, indexes it, and records its fingerprint.
- **Update One Page** — re-fetches an already-indexed page and only re-indexes it **if** the content hash changed. (The hash check lives inside this sub-workflow, not in the Main Loop.)
- **Delete One Page** — removes a page that has dropped off the curated list.

---

## Change detection keeps it efficient

Because each page carries a content-hash fingerprint, a scheduled run only does real work on pages that actually changed since last time — so re-running over a large site is fast and inexpensive.

:::caution[The list defines the knowledge base]
The system never crawls, follows links, or discovers pages on its own: what's on the curated list is what's in the knowledge base. If a page is missing from the bot's answers, first check whether its URL is on the list — a page that exists on the website but isn't listed will never be scraped.
:::

---

## Updates never leave a gap

When a page changes, **Update One Page** adds the new version to the vector store **before** removing the old one (an *add-before-remove* sequence). The new version is searchable the instant it lands and the old one is only cleared afterward, so a refresh never leaves a moment where the bot can't retrieve that page.

---

## Where to go next

- **[Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files)** — the other way to fill the knowledge base, for documents you control directly.
- **[Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base)** — how the bot searches everything at answer time.
- **[Onboard AI Bot](/docs/tools/onboard-ai-bot)** — provisions a new project's vector store.

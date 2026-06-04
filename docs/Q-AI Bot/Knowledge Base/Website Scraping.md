---
title: Website Scraping
sidebar_position: 3
slug: /q-ai-bot/website-scraping
description: How a curated list of web pages is fetched as markdown, change-detected with content hashing, and synced into a project's OpenAI vector store by the website-scraping workflows.
---

# Website Scraping

**Website scraping** keeps a project's public web content inside its [knowledge base](/docs/q-ai-bot/knowledge-base) without anyone re-uploading pages by hand. You hand the system a curated list of URLs; it fetches each page, notices what actually changed, and keeps the project's [vector store](/docs/q-ai-bot/knowledge-base) in step.

:::info[Where this fits]
This is one of the two ways content enters a project's knowledge base. The other is [Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files). Both feed the same vector store, which the bot searches at answer time. See [Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base) for the big picture.
:::

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

The mechanism is deliberately simple, and it is driven entirely by a **curated URL list** — there is no crawling.

1. **Curated URL list.** The list of pages to include is maintained by hand in a **Google Sheet** — up to **50 URLs** per project. It is the single source of truth for what's in the knowledge base from the web. Nothing is discovered automatically; if a page isn't on the list, it isn't scraped.
2. **Fetch as markdown.** Each page on the list is fetched and converted into clean **markdown** — readable text without the site's navigation and styling — which is what the vector store indexes.
3. **Content-hash change detection.** The system computes a content hash (a short fingerprint) of each page's markdown and compares it to the fingerprint stored from last time. If they match, the page is unchanged and **skipped**. If they differ, the page is updated.
4. **Create / update / delete in the vector store.** Based on the comparison between the curated list and what's already indexed, each page is created, updated, or removed.

---

## The workflows behind it

Website scraping is run by a small family of **background automation workflows**, on a recurring schedule per project:

- **Scraping Websites for AI - Main Loop** — the coordinator. It compares the curated URL list against what's already in the knowledge base and routes each page to one of the three sub-workflows: a page that's new to the list goes to **Create**, a page on both the list and the index goes to **Update**, and a page that has dropped off the list goes to **Delete**.
- **Create One Page** — fetches a brand-new URL, indexes it, and records its fingerprint.
- **Update One Page** — always runs for pages that are already indexed. It re-fetches the page and only re-indexes it **if** the content hash changed; otherwise it leaves the page as-is. (The hash check lives inside this sub-workflow, not in the Main Loop.)
- **Delete One Page** — removes a page that has dropped off the curated list.

---

## Change detection keeps it efficient and safe

Two design choices make scraping cheap to run often and safe to run unattended:

- **Unchanged pages are skipped.** Because each page carries a content-hash fingerprint, a scheduled run only does real work on pages that actually changed since last time. Re-running over a large site is fast and inexpensive.
- **The curated list is the source of truth — no crawling.** The system never follows links or discovers new pages on its own. What's on the list is what's in the knowledge base. To add a page, add its URL; to drop one, remove it.

:::caution[The list defines the knowledge base]
If a page is missing from the bot's answers, the first thing to check is whether its URL is on the curated list. A page that exists on the website but isn't listed will never be scraped.
:::

---

## Updates never leave a gap

When a page changes, **Update One Page** adds the new version to the vector store **before** removing the old one (an *add-before-remove* sequence). This means there is never a moment where the page is missing from the knowledge base mid-update, so the bot can always retrieve content for that page — even while a refresh is in progress.

:::note
Add-before-remove is why a routine refresh never causes a visible "the bot forgot this page" gap. The new version is searchable the instant it lands; the old one is only cleared afterward.
:::

---

## Where to go next

- **[Knowledge Files (Drive Sync)](/docs/q-ai-bot/knowledge-files)** — the other way to fill the knowledge base, for documents you control directly.
- **[Knowledge Base & Retrieval](/docs/q-ai-bot/knowledge-base)** — how the bot searches everything at answer time.
- **[Onboard AI Bot](/docs/tools/onboard-ai-bot)** — provisions a new project's vector store.

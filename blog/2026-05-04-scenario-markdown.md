---
title: Rich Scenario Cards + Shared Markdown
date: 2026-05-04
tags: [feature, scenarios, site, docs]
---

Scenario Marketplace cards now render Markdown so setup notes can link straight into the YAML docs, the Ask AI panel shares the same renderer for consistent navigation, and the YAML Adapters sidebar lists **Salesforce** before **Senzey**.

<!-- truncate -->

## Added

- **Shared `Markdown` component** — GFM rendering with Docusaurus internal links, optional hard line breaks for multi-line snippets, and an optional click handler (used by Ask AI to close the panel when you follow an in-site link).
- **Scenario Marketplace** — each card’s main description and “What to configure” items support Markdown: links, emphasis, inline and fenced code, and lists, with tuned styles for body text and inline code.

## Improved

- **Ask AI** — assistant messages use the shared Markdown layer so link behavior matches the rest of the site.
- **Scenario copy** — broad pass on marketplace text for clearer SLA, Q-AI, Salesforce, Rapid, and cron setup guidance, including cross-links to Data Injection, Notify, and related docs.
- **YAML Adapters sidebar** — Salesforce appears before Senzey in the docs navigation order.

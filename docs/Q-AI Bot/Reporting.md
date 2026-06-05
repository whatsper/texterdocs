---
title: Reporting & Evaluation
sidebar_position: 10
slug: /q-ai-bot/reporting
description: How the Q-AI Bot logs every turn for human review — the per-project evaluation report, cross-project usage logging, and how to read the Generic Response Evaluation Report.
---

# Reporting & Evaluation

The Q-AI Bot logs what it does so answers can be reviewed and improved. Every turn produces two records: an **evaluation record** (so a human can judge whether the answer was good) and a **usage record** (cost and volume across all projects).

Both are written by the **[Update AI Report Sheets](/docs/q-ai-bot/workflows)** workflow, which the live reply loop calls in the background once per turn. It is "fire-and-forget": the conversation never waits on logging, so reporting never slows down a reply.

---

## What gets logged on every turn

Each turn writes to two destinations — the **project's evaluation report** (one per project) and a **shared usage log** (one for all projects). The evaluation row captures:

- **The question** the person asked.
- **The answer** the AI sent back.
- **The model's reasoning** — a short, internal explanation of *why* it answered that way. For reviewers only; never shown in the chat.
- Basic context such as the contact's name and phone, so a reviewer can find the conversation.

Two columns are left **blank on purpose**: an **accuracy** mark and free-form **notes** for a human to fill in. Patterns in those notes drive improvements — a better [system prompt](/docs/q-ai-bot/per-project-settings), a missing [knowledge file](/docs/q-ai-bot/knowledge-files), or a fix to a [scraped page](/docs/q-ai-bot/website-scraping).

:::tip[Read the reasoning, not just the answer]
When an answer looks wrong, the model's reasoning column usually tells you *why*. Often the answer is reasonable given what the AI could find — which points at a knowledge-base gap rather than a prompt problem. Fixing the knowledge is usually the higher-leverage change.
:::

Test turns run on the [AI Assistant - Dev Sandbox](/docs/q-ai-bot/workflows) are logged the same way, so the sandbox doubles as a place to check answer quality before a change reaches real conversations.

---

## The Generic Response Evaluation Report

The **Generic Response Evaluation Report** is the **template** — there is one of it. Every project gets its own **clone** of it: when a project is set up by [AI New Customer Onboarding](/docs/q-ai-bot/onboarding), the template is copied to create that project's evaluation report, so every project has the same familiar layout. "Evaluation report" elsewhere on this page always means a project's clone, not the template.

How to read it:

- **Each row is one turn.** Rows are appended in order as conversations happen, so the report reads top-to-bottom as a timeline.
- **The AI fills the left side** — the question, the answer it sent, the reasoning behind it, and the contact context.
- **A human fills the right side** — the accuracy mark and the notes. Blank cells in those columns simply mean a turn has not been reviewed yet.
- **Work the unreviewed rows.** Scoring the blanks is the regular evaluation task; the filled-in accuracy and notes are what turn raw logs into improvements.

---

## Usage logging across projects

Alongside the per-project evaluation report, *Update AI Report Sheets* also records **usage** to a shared log that spans every project. This is the ledger used to understand **cost and volume**: how much the AI is being used and roughly what it is costing, across all projects in one place.

Where the evaluation report answers *"was this answer good?"*, the usage log answers *"how much are we using, and where?"* — useful for spotting a project whose volume or cost has jumped.

---

## Where to go next

- **[Workflows & Automations](/docs/q-ai-bot/workflows)** — where *Update AI Report Sheets* sits in the bigger picture.
- **[Per-Project Settings](/docs/q-ai-bot/per-project-settings)** — the prompt, model, and knowledge settings that evaluation feedback helps you tune.
- **[Knowledge Files](/docs/q-ai-bot/knowledge-files)** and **[Website Scraping](/docs/q-ai-bot/website-scraping)** — fix the source material when reviews reveal a gap.

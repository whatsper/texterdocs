---
title: Multi-Select Filters + Mobile Nav Fixes
date: 2026-05-11
tags: [scenarios, site, docs, yaml]
---

The Scenario Marketplace tag filter is now multi-select with OR by default and an explicit **Match all** toggle for AND; the mobile hamburger drawer covers the viewport cleanly on phones; and the landing page no longer churns on 120 Hz Macs.

<!-- truncate -->

## Added

- **Multi-select scenario filters** — pick more than one tag; matching defaults to OR (any selected tag) with a **Match all** checkbox that switches to AND when 2+ tags are active. An active-filters strip below the chip row shows the current selection with `×` removable chips and a one-click **Clear all**.
- **Q-AI: Disable External Bot On Pending Chat** — 7th scenario in the Q-AI suite. Fires when a chat is set to pending (e.g. an agent reassigns to another agent during an AI session) and ends the AI handoff cleanly.
- **Remember Last Agent on Chat Assigned** — writes the assigned agent's UID and display name into the `ChatsLastAgent` data storage collection so a bot or follow-up scenario can route the next inbound message back to the same agent. Configurable collection name, TTL (max 7 days), and stored fields.
- **`data-storage` tag** — applied to every scenario that reads or writes data storage (the SLA suite, plus the new last-agent scenario), so the marketplace filter can surface them as a group.
- **`preserveOriginalAttachmentFilenames`** — new `sendEmail` parameter. When `true`, email attachments use the original uploaded filename (falling back to the file's stored `originalName`, then to the message caption) instead of the chat caption. A new **Attachment filenames** section in the Send Mail page documents the behavior.
- **`parseJson` transformer alias** — accepted as a synonym for `jsonParse`. Both names work identically.

## Improved

- **Filtered scenarios sort alphabetically** — the marketplace still shuffles for discovery when no filters are applied, but as soon as a search query or tag is active the list switches to alphabetical order.
- **Send Mail params layout** — required and optional parameter lists are now tables with a dedicated **Default** column for optional params, matching the tables used elsewhere on the page.
- **Landing page performance** — removed a hero background animation that was causing scroll lag on 120 Hz Macs. All static visuals (gradient, glow, grid lines) are unchanged.

## Fixed

- **Sticky navbar** — the top navigation no longer disappears when scrolling.
- **Mobile hamburger drawer** — multiple bugs resolved on phones: the drawer now has an opaque background instead of bleeding through to the navbar, covers the full viewport width (previously left a strip of the page visible on the right), and its secondary sub-menu panel slides in cleanly over the primary one (previously left a gap on the side).

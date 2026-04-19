---
title: Monday adapter & Zoho `closeTicket` Updates
date: 2026-04-19
tags: [adapters, docs, yaml]
---

New Monday.com adapter docs, and an updated Zoho `closeTicket` that now writes the chat transcript as a Note on the contact.

<!-- truncate -->

## Added

- **Monday.com adapter** — full documentation for the new Monday adapter: `getCustomerDetails`, `createItem`, `updateItem`, `changeStatus`, and `crmGetFields`. Covers the required `crmConfig` (`authToken`, `boardId`, `groupId`, `phoneColumnId`, `statusColumnId`, `workspaceUrl`), column-ID vs. column-title gotchas, per-column-type value formats (status, dropdown, date, phone, email, text), phone-format flags (`useNationalDigits` / `useFullPhoneNumber`), and the `additionalFieldsQuery` / `additionalFieldsVariables` hooks for pulling extra item columns onto `crmData`.

## Improved

- **Zoho `closeTicket`** — now writes the chat transcript as a **Note on the contact** by default (Zoho Create Notes API), using a new stable `crmData.contactId` so the note always lands on the original contact even after later `createRecord` / `updateRecord` calls move `recordId` to another module. The record `PUT` only runs when there's something to update (`crmConfig.closeTicketDateField` set, or YAML `params` passed) — no more spurious updates on agent-resolved chats. New `crmConfig` options: `disableCloseTicketNote` to opt out of the note, and `closeTicketNoteTitle` to override the note-title prefix (default `שיחת ווצאפ`).

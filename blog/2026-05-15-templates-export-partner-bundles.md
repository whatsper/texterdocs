---
title: Templates Export + Partner Bundles
date: 2026-05-15
tags: [feature, docs, site]
---

The Templates page picks up Export, three Partner Bundle starter sets, Draft mode, and inline editing of bundled templates — among a stack of UX fixes.

<!-- truncate -->

## Added

- **Export mode** — new tab that downloads every WhatsApp template from a Texter account as JSON, either as a `<projectId>_templates.json` file or printed inline for copy-paste.
- **Partner Bundles** — third input mode that opens a picker for pre-built starter sets: **Rapid** (15 templates for clinics on Rapid), **Optima** (5 templates for dental clinics on Optima), and **CPA Assist** (2 templates for accounting offices). Tick a bundle or individual templates, hit Save.
- **Inline template editing** — each partner template can be expanded in the picker to edit title / name / body before importing.
- **Seed input for Optima** — single field above the templates that string-replaces every `שם הקליניקה` placeholder across the selected templates on Save.
- **Draft mode** — submit-mode toggle that creates + localizes templates without submitting for WhatsApp approval, so they stay editable in the Texter UI.
- **Paste JSON mode** — alternative to file upload; parses on each keystroke.
- **Per-call progress + error summary** — bars advance per API call (not per template), with a configurable delay between every call to dodge rate limits and an end-of-run errors list naming each failure.
- **Help tooltips** — every config field shows a `?` button with field-specific guidance, including the required Texter API scope.

## Improved

- **URL** — slug is now `/docs/templates-import-export`. Old `/templates-import` and `/docs/tools/template-json-import` redirect.
- **Progress UI** — outcome-driven colors (green / orange / red / striped grey), and the Result/Progress card height tracks the form card so the bottoms stay aligned.

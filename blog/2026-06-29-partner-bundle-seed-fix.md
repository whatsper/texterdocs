---
title: Partner Bundle Seed Fix + Optima Address & General Templates
date: 2026-06-29
tags: [fix, templates, site]
---

The Templates tool's partner-bundle seed inputs now apply on import instead of only in the preview, Optima gains a clinic-address field on its appointment templates, and two general-purpose templates join the Optima bundle.

<!-- truncate -->

## Fixed

- **Partner Bundle seed inputs**: the value you type (like `שם הקליניקה`) now actually replaces the placeholder on import. Until now the picker preview showed the filled-in value, but the import still created the template with the raw placeholder. The seed inputs and the preview are back in sync.

## Added

- **Optima address field**: a new `כתובת` seed input that fills the clinic address into the `תזכורת לתור` (a1) and `תור עתידי` (a5) templates, the same way the clinic-name field works.
- **General templates**: two new inbox + utility templates in the Optima bundle, `general_1` and `general_2`, for free-text notices and updates.

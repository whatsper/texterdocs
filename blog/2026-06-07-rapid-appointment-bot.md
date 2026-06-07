---
title: Rapid Appointment Bot Recipe
date: 2026-06-07
tags: [docs, yaml, adapters]
---

A full copy-paste appointment-scheduling bot for Rapid clinics, end to end, plus a pointer to it from the Rapid adapter page.

<!-- truncate -->

## Added

- **Rapid Appointment Bot recipe**: new Bot Recipes entry covering the whole flow. Asks who the appointment is for and identifies the patient (chat phone, an explicit phone, or ת.ז), shows existing appointments or books a new one, walks treatment plans or the branch/department/service/doctor funnel with 0 / 1 / many handling, searches slots by timeframe (including a weekday-aware "next week") with paging, and creates new patients only at the moment of booking.
- **Rapid adapter page**: the Appointments section now links to the new recipe for a ready-to-paste implementation.

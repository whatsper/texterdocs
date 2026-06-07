---
title: Arbox Adapter
date: 2026-06-08
tags: [adapters, docs, yaml]
---

Documentation for the Arbox CRM adapter — member/lead lookup, lead and task creation, and scheduled WhatsApp reminders for gyms, studios, and fitness boxes.

<!-- truncate -->

## Added

- **Arbox adapter** — documentation for `getCustomerDetails`, `newOpportunity`, `openTask`, and the scheduled `sendReminders` batch method (configured as a `CrmMethodTask`, with a real Sun–Thu / Friday class-reminder example, supported reports, and the filter operators). Includes the `crmConfig` fields (`apiKey`, `server`, `customIdField`, `vendorsToken`), the official Arbox API reference link, and onboarding steps for obtaining the API key.

## Changed

- **Rapid adapter onboarding** — added a step for obtaining the default price list (`defaultPriceListCode`) via Rapid's "Get Default Price list" endpoint, noting it's required for the appointments flow only.

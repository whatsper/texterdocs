---
title: Google Sheet Adapter
date: 2026-04-10
tags: [adapters, docs, yaml]
---

New Google Sheet adapter docs — look up customers from a CSV file hosted in Google Drive.

<!-- truncate -->

## Added

- **Google Sheet adapter** — full documentation for `getCustomerDetails` (and its `getCustomerDetailsCSV` alias), including phone-based and ID-based lookups, `filterField`/`filterValue` narrowing, the `crmConfig` field mapping (`customers_csv_*`), how the 10-minute refresh works, how to update the customer list (upload a new CSV — don't edit in place), and supported phone formats

---
title: Airtable Adapter + Adapter Doc Corrections
date: 2026-05-16
tags: [adapters, docs, yaml]
---

A new Airtable adapter page, plus an audit pass over the existing adapter docs to fix a handful of inaccuracies caught against the live server code.

<!-- truncate -->

## Added

- **Airtable adapter** — full documentation for `getCustomerDetails`, `newOpportunity` / `createRecord`, and `updateRecord`, including the required `crmConfig` (`baseId`, `tableId`, `viewId`, `authToken`, `phoneColumn`), per-call overrides for base/table/view, and notes on the auto-injected phone column.
- **Rapid `crmGetFields`** — undocumented op that returns the hardcoded Hebrew status list used by Texter's `changeStatus` dropdowns.
- **Senzey `crmConfig`** — config table (`server`, `username`, `password`) was missing from the page; now included.
- **Tazman `crmConfig`** — config table (`server`, `token`, plus the four `result*Field` overrides) was missing from the page; now included.

## Fixed

- **Rapid `crmGetAppointments`** — `datesRangeTo` is a window **length** in days, not an end-day index (`0, 14` searches today through 14 days out).
- **Rapid `crmCreateAppointment`** — result is `crmData.appointmentId` (string), not an array.
- **Rapid `uploadFile`** — result now documents `crmData.uploadedFile` shape.
- **Rapid `closeTicket`** — returns `on_failure` when `crmData.cardCode` is missing (was vaguely worded).
- **Senzey `getCustomerDetails`** — `deepLink` is only set when `user_type` is `2` or `3`; the adapter always sends `incl_pclient=TRUE` so both clients and potential clients are searched.
- **GoogleSheet `getCustomerDetails`** — dashed phone variant assumes Israeli format; raw CSV columns spread onto `crmData` after mapped fields can overwrite `name` / `phone` / `id` / `status` if column headers collide.
- **Powerlink** — `showDuplicates` fires on a single contact-fallback match too (not only on multi-account matches); `displayExistingData` writes `accountid` (lowercase) regardless of the config-key casing; `setOwner` failure conditions documented.
- **Provet** — removed the `closeTicket` section; the op is effectively a no-op that doesn't call Provet at all.
- **Lead.IM** — display-mode edge case where `crmData` exists without `aid`/`lid` (or `pp_aid`/`pp_lid`) still returns success but with no `id` and a bare-base `deepLink`.
- **Salesforce `getCustomerDetails`** — warned that `contactObjectCustomFields` is a **total replacement** of the default field list, so omitting `Id` / `AccountId` / `Name` / etc. silently drops the corresponding `crmData` keys; `crmData.Accounts` is a numeric-keyed object, not an array.
- **Zoho** — `orgId` is optional (only used to build `deepLink`); documented `fieldsOverride` and its total-replacement caveat; clarified that an empty-row query returns `success: true` with `crmData.queryResult: {}`, not `on_failure`.

---
sidebar_position: 1
---

# Google Sheet

The Google Sheet adapter lets Texter look up customer records from a **CSV file hosted in Google Drive**. Rather than connecting to a dedicated CRM API, it periodically downloads the latest CSV from a configured Drive folder, caches the rows locally, and serves fast lookups against that cache.

:::tip[Read-only adapter]
This adapter only supports `getCustomerDetails`. Creating leads, closing tickets, or writing back to the sheet is not supported.
:::

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `customers_csv_folder` | **Yes** | — | Google Drive folder ID (from the folder URL). The adapter picks the most-recently uploaded CSV file in this folder (sorted by creation time). |
| `customers_csv_name_field` | No | `''` | CSV column header whose value becomes `crmData.name`. If omitted, `crmData.name` is an empty string. |
| `customers_csv_phone_field` | No | `phone` | CSV column header to match the phone against (and map to `crmData.phone`). Defaults to a column named `phone`. |
| `customers_csv_id_field` | No | — | CSV column header mapped to `crmData.id`. Also used as the lookup field for `id_node` lookups. If omitted, `crmData.id` is not set. |
| `customers_csv_status_field` | No | — | CSV column header mapped to `crmData.status`. If omitted, `crmData.status` is not set. |
| `customers_csv_phone_fields_list` | No | — | Array of column headers to search when phone numbers may appear in more than one column. Overrides `customers_csv_phone_field` for matching (but not for `crmData.phone` mapping). |
| `delimiter` | No | `,` | CSV delimiter character. Change to `;` or `\t` if the file uses a different separator. |

---

## Adapter functions

### `getCustomerDetails`

Looks up the first matching row in the cached CSV by phone number (default) or by a collected ID value.

**When it runs:** At the start of the flow to identify whether the sender is a known contact. The CSV is refreshed from Google Drive at most once every **10 minutes** — when a new file is found, the adapter rebuilds a local database collection from it. Lookups always run against that cached collection, not directly against Drive.

**Basic**

```yaml
  gs_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|-------|----------|-------|
| `id_node` | No | Name of a bot state node whose `.text` value is used as the lookup value (matched against `crmConfig.customers_csv_id_field`). When provided, phone lookup is skipped entirely. |
| `customers_csv_id_field` | No | Overrides `crmConfig.customers_csv_id_field` for this specific `id_node` lookup only. |
| `filterField` | No | CSV column header for an additional filter applied after the phone/ID match. |
| `filterValue` | No | Required value for `filterField`. Only rows where `row[filterField] == filterValue` survive the filter. |

:::tip[Phone format matching]
When looking up by phone, the adapter tries several variations of the contact's number simultaneously (with and without dashes, with and without the country-code prefix, E.164 with and without the leading `+`). This covers most CSV phone formats without any special config — the column value just has to contain one of the variations as a substring.

If phone numbers are split across multiple columns (e.g. `phone_home` and `phone_mobile`), set `customers_csv_phone_fields_list` in `crmConfig` to an array of those column names.
:::

**Result:** On success, `crmData` is populated with **all columns from the matched row**, plus the following mapped fields:

| `crmData` field | Source |
|-----------------|--------|
| `name` | Value of the `crmConfig.customers_csv_name_field` column |
| `phone` | Value of the `crmConfig.customers_csv_phone_field` column (falls back to formatted phone if the column is not mapped) |
| `id` | Value of the `crmConfig.customers_csv_id_field` column |
| `status` | Value of the `crmConfig.customers_csv_status_field` column |
| `amount` | Number of rows that matched (post-`filterField` count — equals the raw match count when no filter is used) |
| *(all other columns)* | Spread directly from the CSV row under their original column header names |

Returns `on_failure` if: no matching row is found (`reason: no_customer`), or the CSV download or parse fails (`reason: invalidCSV`).

**Advanced — lookup by collected ID**

```yaml
  gs_lookup_by_id:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      id_node: ask_id_number
    on_complete: known_customer
    on_failure: unknown_customer
```

The node `ask_id_number` must have already collected a value before this node runs. The adapter reads `botState["ask_id_number"].text` and searches the CSV for a row where `crmConfig.customers_csv_id_field` equals that value.

**Advanced — filter results by an additional field**

```yaml
  gs_lookup_filtered:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      filterField: status
      filterValue: active
    on_complete: known_customer
    on_failure: unknown_customer
```

Useful when multiple rows can share the same phone number and you need to narrow down by a secondary column (e.g. `status`, `branch`, `plan`). The first row that survives the filter becomes the match — `amount` reflects how many rows passed the filter.

:::tip[`getCustomerDetailsCSV` alias]
The op name `getCustomerDetailsCSV` is an exact alias — both names run identical logic. Either works.
:::

---

## Out of Adapter Scope

This adapter has no write operations (`newOpportunity`, `closeTicket`, `updateRecord`, etc.) — it only reads from the CSV cache. If write-back to a sheet is needed, handle it outside the bot (e.g. a backend webhook or n8n workflow).

---

## Updating the customer list

To update the data the adapter serves, **upload a new CSV file** to the same Google Drive folder — do not edit the existing file in place. Editing an existing file in Drive will not trigger a new download. Texter always picks the **most recently uploaded** CSV from the folder, so the filename does not matter as long as the column headers are identical.

Changes are picked up within **10 minutes** of uploading the new file (the adapter checks for a newer file at most once every 10 minutes).

**CSV requirements:**

- One row per customer, one tab/sheet exported as CSV — multi-tab or multi-sheet setups are not supported.
- Column headers must match exactly what is configured in `crmConfig` (`customers_csv_name_field`, `customers_csv_phone_field`, etc.).
- Phone numbers can appear in any common format — the adapter tries multiple variations as substring matches. For an Israeli number, any of these will work:

| Format | Example |
|--------|---------|
| Local with dashes | `058-650-3100` |
| Local digits only | `0586503100` |
| Without leading zero | `586503100` |
| International with `+` | `+972586503100` |
| International digits only | `972586503100` |

---

## Google Sheet Onboarding (for Texter Support)

Ask the customer to create a Google Drive folder and share it with the Texter Google account (editor access). Once the folder is shared, get its ID from the URL and store it as `customers_csv_folder` in the customer DB.

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `customers_csv_folder` | **Yes** | Google Drive folder ID (the long string in the folder URL). The adapter always picks the most-recently **uploaded** CSV in that folder (sorted by creation time). |
| `customers_csv_name_field` | No | CSV column header for the customer's name. Without it `crmData.name` is empty. Agree with the customer which column to use. |
| `customers_csv_phone_field` | No | CSV column header for phone. Default `phone`. Set if the customer's CSV uses a different header. |
| `customers_csv_id_field` | No | CSV column header for the unique ID (e.g. national ID, member number). Required if bots will use `id_node` lookups. |
| `customers_csv_status_field` | No | CSV column header for status — exposed as `crmData.status` in the Texter CRM panel. |
| `customers_csv_phone_fields_list` | No | Array of column headers — use when phone numbers can appear in more than one column. |
| `delimiter` | No | Defaults to `,`. Set to `;` for European-locale CSVs. |

---
sidebar_position: 1
---

# Airtable

[Airtable](https://airtable.com/) is a spreadsheet-database hybrid used to store contacts, leads, and any structured records in a configurable table view.

**Official Airtable API docs** (for deeper reference):

- [List records](https://airtable.com/developers/web/api/list-records) — `getCustomerDetails` (`GET /v0/{baseId}/{tableId}`)
- [Create records](https://airtable.com/developers/web/api/create-records) — `newOpportunity` / `createRecord` (`POST /v0/{baseId}/{tableId}`)
- [Update record](https://airtable.com/developers/web/api/update-record) — `updateRecord` (`PATCH /v0/{baseId}/{tableId}/{recordId}`)
- [Personal access tokens](https://airtable.com/developers/web/guides/personal-access-tokens) — how to mint the `authToken`

---

## CRM config (`crmConfig`)

All five fields are required for the adapter to load. If any is missing, **every** op returns `on_failure`.

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `baseId` | **Yes** | — | Airtable base ID (starts with `app...`). |
| `tableId` | **Yes** | — | Table ID inside the base (starts with `tbl...`). |
| `viewId` | **Yes** | — | View ID (starts with `viw...`). Used only to build `crmData.deepLink`. |
| `authToken` | **Yes** | — | Airtable Personal Access Token (PAT). Sent as `Authorization: Bearer …`. Must have `data.records:read` and `data.records:write` scopes on the base. |
| `phoneColumn` | **Yes** | — | Name of the column in your table that stores the contact's phone number (e.g. `Phone`, `Mobile`, `טלפון`). Used for lookup and auto-set on create/update. |
| `nameField` | No | `Name` | Column used as `crmData.name` in `getCustomerDetails`. |
| `statusField` | No | `Lead Status (from Leads)` (first element if array) | Column used as `crmData.status` in `getCustomerDetails`. |
| `idField` | No | Airtable record ID | Column used as `crmData.id` in `getCustomerDetails`. If unset or the field is missing, falls back to the Airtable record ID. |

:::tip[Per-call overrides]
`baseId`, `tableId`, `viewId`, `phoneColumn`, `nameField`, `statusField`, and `idField` can also be passed as YAML `params` on any op. The param value, when present, **overrides** the matching `crmConfig` field for that single call. Useful when a single bot needs to read from one table and write to another.
:::

---

## Adapter functions

### `getCustomerDetails`

Looks up a record in the configured Airtable table by phone number.

**When it runs:** At the start of the flow to identify whether the sender already has a row in the table, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  airtable_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

No params required — phone is taken from the chat's channel number automatically. The adapter searches by `OR({phoneColumn}=...)` against three phone formats (E.164, formatted, digits-only) so the column can hold any of them.

| Param | Required | Notes |
|-------|----------|-------|
| `baseId` | No | Override `crmConfig.baseId` for this call. |
| `tableId` | No | Override `crmConfig.tableId` for this call. |
| `viewId` | No | Override `crmConfig.viewId` for this call (affects `deepLink` only). |
| `phoneColumn` | No | Override `crmConfig.phoneColumn` for this call. |
| `nameField` | No | Override `crmConfig.nameField` for this call. |
| `statusField` | No | Override `crmConfig.statusField` for this call. |
| `idField` | No | Override `crmConfig.idField` for this call. |

**Result:** On success, `crmData` is populated with:

| `crmData` field | Source |
|-----------------|--------|
| `id` | `fields[idField]` if set, otherwise the Airtable record ID (`rec...`) |
| `name` | `fields[nameField]` if set, otherwise `fields.Name`, otherwise `""` |
| `phone` | `fields[phoneColumn]` if set, otherwise `fields.Phone`, otherwise `""` |
| `status` | `fields[statusField]` if set, otherwise `fields['Lead Status (from Leads)'][0]`, otherwise `""` |
| `deepLink` | `https://airtable.com/{baseId}/{tableId}/{viewId}/{id}` |

Returns `on_failure` if: any required `crmConfig` field is missing, the API call errors, or no record matches the phone number.

:::tip[Only the first match is used]
If multiple rows share the same phone number, the adapter takes the first record Airtable returns and ignores the rest. Add a unique constraint or filter to the source view if duplicates are possible.
:::

---

### `newOpportunity` / `createRecord`

Creates a new record in the configured Airtable table. Both `func_id` names hit the same handler — pick whichever reads better in your flow.

**When it runs:** When the sender is **not** identified as an existing record by `getCustomerDetails`, so a new row needs to be created.

**Basic**

```yaml
  airtable_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      Name: "%chat:title%"
      Source: "WhatsApp Bot"
    on_complete: lead_created
    on_failure: lead_failed
```

**How params map to the request body:** every YAML `params` key (except the metadata keys `phoneColumn`, `nameField`, `statusField`, `idField`, `recordId`) is placed verbatim into Airtable's `fields` object. Use the **exact column name** as it appears in Airtable (case-sensitive, spaces and special characters allowed).

In addition, the `phoneColumn` is **auto-set** to the chat's digits-only phone — you don't need to pass it.

| Param | Required | Notes |
|-------|----------|-------|
| *(any column name)* | No | Becomes a field on the new record. E.g. `Email: "%state:node.ask_email.text%"` → `fields.Email`. |
| `baseId` / `tableId` / `viewId` / `phoneColumn` / `nameField` / `statusField` / `idField` / `recordId` | No | Metadata — stripped from the body. See [CRM config overrides](#crm-config-crmconfig). |

**Result:** `crmData.id` = the API response's `id`. Returns `on_failure` if the API call errors.

:::tip[Phone column is always populated]
The adapter automatically adds `{ [phoneColumn]: <chat phone, digits only> }` to every create/update.
:::

:::tip[Column names are case-sensitive]
Airtable matches field names exactly. `email` is **not** the same column as `Email`. Copy the column header from Airtable verbatim into your YAML keys.
:::

**Advanced — write into a different table**

```yaml
  airtable_log_activity:
    type: func
    func_type: crm
    func_id: createRecord
    params:
      tableId: "tblActivityLog"
      phoneColumn: "Customer Phone"
      Subject: "WhatsApp inquiry"
      Notes: "%state:node.ask_message.text%"
    on_complete: logged
    on_failure: log_failed
```

---

### `updateRecord`

Updates an existing record in the configured Airtable table.

**Basic**

```yaml
  airtable_update:
    type: func
    func_type: crm
    func_id: updateRecord
    params:
      recordId: "%chat:crmData.id%"
      Status: "Contacted"
      LastMessage: "%state:node.ask_message.text%"
    on_complete: updated
    on_failure: update_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| `recordId` | **Yes** | Airtable record ID (`rec...`) to update. Usually `%chat:crmData.id%` from a prior `getCustomerDetails`. |
| *(any column name)* | No | Updates that field on the record. |
| `baseId` / `tableId` / `viewId` / `phoneColumn` / `nameField` / `statusField` / `idField` | No | Metadata — stripped from the body. |

**Result:** `crmData.id` = the API response's `id`. Returns `on_failure` if the API call errors.

:::tip[`crmData.id` must be the Airtable record ID]
`updateRecord` uses `recordId` as the PATCH URL segment. If `crmConfig.idField` resolves to a custom field value, `crmData.id` will hold that value — **not** the `rec...` ID needed here. Either keep `idField` unset (so `crmData.id` is the record ID) or pass `recordId` explicitly from a different source.
:::

---

## Airtable Onboarding (for Texter Support)

Ask the customer to provide:

| Field | Where it comes from |
|-------|---------------------|
| `baseId` | Airtable base URL: `https://airtable.com/{baseId}/...` — starts with `app`. |
| `tableId` | Same URL, second segment — starts with `tbl`. |
| `viewId` | Same URL, third segment — starts with `viw`. |
| `authToken` | Customer creates a [Personal Access Token](https://airtable.com/create/tokens) scoped to the base, with `data.records:read` and `data.records:write`. |
| `phoneColumn` | Column header in the table that stores phone numbers. Confirm the format the customer uses (E.164 vs local digits) — Airtable's filter matches on string equality. |

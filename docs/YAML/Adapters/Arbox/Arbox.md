---
sidebar_position: 1
---

# Arbox

[Arbox](https://www.arboxapp.com/) is a management platform for gyms, studios, and fitness boxes — handling members, leads, classes, and schedules.

**Official Arbox API docs** (for deeper reference):

- [Arbox API reference (Swagger)](https://arboxserver.arboxapp.com/docs/api#/) — full endpoint catalog and schemas.

Endpoints this adapter uses:

- Member / lead lookup and writes go to the customer instance base URL (default `https://api.arboxapp.com/index.php`) — `getCustomerDetails` (`/api/v2/searchUser`, `/api/v2/searchLead`), `newOpportunity` (`/api/v2/leads`), `openTask` (`/api/v2/tasks`).
- Scheduled reminders pull from the Arbox **vendors report** endpoint `https://arboxserver.arboxapp.com/api/v2/vendors/report/<report>` — `sendReminders`.

API access is partner/vendor managed — credentials are obtained from Arbox during onboarding.

---

## CRM config (`crmConfig`)

| Field          | Required                | Default                              | Use                                                                                                       |
| -------------- | ----------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `apiKey`       | **Yes**                 | —                                    | Arbox API key. Sent as the `apiKey` header on every call. If missing, all operations fail immediately.    |
| `server`       | No                      | `https://api.arboxapp.com/index.php` | Base URL for `getCustomerDetails`, `newOpportunity`, and `openTask`.                                       |
| `customIdField` | No                     | —                                    | Field name on the Arbox user record to use as `crmData.id` in `getCustomerDetails` (instead of `user.id`). |
| `vendorsToken` | **Yes** (for reminders) | —                                    | Arbox vendors token. Sent as the `AuthorizationKey` header for `sendReminders`. Without it, `sendReminders` fails. |

---

## Adapter functions

### `getCustomerDetails`

Looks up an Arbox **user** by phone number and enriches `crmData` with their profile. If the user is a lead, it also fetches the lead status.

**When it runs:** At the start of the flow to identify whether the sender is a known member or lead, and whenever a chat is opened via Texter UI.

**Basic**

```yaml
  arbox_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param           | Required | Notes                                                                                                                |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `customIdField` | No       | Overrides `crmConfig.customIdField` for this call. Field name on the Arbox user record to use as `crmData.id`. If the field is absent on the record, falls back to `user.id`. |

The phone looked up is the chat's local phone (digits only, no dashes); it is passed to Arbox as the `user` query param on `/api/v2/searchUser`.

**Result:** On success, `crmData` contains:

- `crmData.id`: the value of `customIdField` on the user if present, otherwise `user.id`
- `crmData.name`: `first_name + ' ' + last_name`
- `crmData.phone`: `user.phone`
- `crmData.status`: `מנוי` (member) — or, if the user's `role` is `lead`, the lead's `lead_status` (fetched from `/api/v2/searchLead`)
- `crmData.deepLink`: `https://manage.arboxapp.com/user-profile/<user_fk>`
- plus all raw user fields returned by Arbox (spread into `crmData`) — including `user_fk` and `locations_box_fk`, which [`openTask`](#opentask) reuses

Returns `on_failure` if: `crmConfig.apiKey` is missing, the API errors, or no user matches the phone.

---

### `newOpportunity`

Creates a new **lead** in Arbox.

**When it runs:** Most often when the sender is not identified as an existing member — so Arbox gets a new lead record.

**Basic**

```yaml
  arbox_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

| Param        | Required | Notes                                                                                                       |
| ------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `first_name` | No       | Defaults to the chat title.                                                                                  |
| `phone`      | No       | Defaults to the chat's local phone (digits only).                                                            |
| `email`      | No       | Defaults to `noemail@noemail.com`.                                                                           |
| Any other param | No    | Forwarded as-is (stringified) to the Arbox `POST /api/v2/leads` query (e.g. lead source, box, custom fields). |

**Result:** On success, sets `crmData.lastRecordId` to the new lead's `id`.

Returns `on_failure` if: the API errors, or the response is not `statusCode 200` with a `data` object.

**Advanced**

```yaml
  arbox_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      email: "%state:node.ask_email.text%"
      location_box_fk: 2725 
      status_fk: 12420
      source_fk: 59913
    on_complete: lead_created
    on_failure: lead_failed
```

---

### `openTask`

Creates a follow-up **task** (reminder) in Arbox for the member, dated to the next working day.

**When it runs:** After a chat where a staff follow-up is needed. Requires a prior [`getCustomerDetails`](#getcustomerdetails) so the member's `user_fk` and `locations_box_fk` are on `crmData`.

**Basic**

```yaml
  arbox_open_task:
    type: func
    func_type: crm
    func_id: openTask
    on_complete: task_created
    on_failure: task_failed
```

| Param           | Required | Notes                                                                                                          |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `targetableId`  | No       | Defaults to `crmData.user_fk` (from `getCustomerDetails`). The Arbox user the task is attached to.             |
| `locationBoxFk` | No       | Defaults to `crmData.locations_box_fk`. The Arbox location/box for the task.                                   |
| Any other param | No       | Forwarded as-is (stringified) to the Arbox `POST /api/v2/tasks` query.                                          |

:::tip[`reminderDate` is computed automatically]
The task's `reminderDate` is set to the **next day** in `dd-mm-yyyy` format — except on **Fridays**, where it skips to **Sunday** (+2 days) to avoid landing on Saturday.
:::

**Result:** On success, sets `crmData.lastRecordId` to the new task's `id`.

Returns `on_failure` if: the API errors, or the response is not `statusCode 200` with a `data` object.

---

### `sendReminders`

:::warning[`sendReminders` — scheduled tasks only]
Do **not** enable this CRM method from normal **bot YAML** (states, triggers, or per-chat `func` nodes). It is meant to run only as a **scheduled / batch job** — configured as a `CrmMethodTask` with a cron `expr` in customer task config (Nihul). Calling it from live bot flows can cause unintended bulk sends and is not supported as a per-message pattern.
:::

Pulls records from an Arbox **vendors report** for a target date, optionally filters/orders/de-duplicates them, and sends a WhatsApp **template message** to each record's phone.

**When it runs:** Scheduled/batch reminder sending only — configured as a `CrmMethodTask` in customer task config (Nihul), not from bot YAML.

| Param              | Required | Default  | Notes                                                                                                                                                  |
| ------------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accountId`        | **Yes**  | —        | WhatsApp account ID to send from.                                                                                                                       |
| `report`           | **Yes**  | —        | Arbox report name. Must be one of the [supported reports](#supported-reports).                                                                          |
| `templateName`     | **Yes**  | —        | Texter template name to send.                                                                                                                           |
| `daysBefore`       | No*      | —        | How many days **ahead** to query the report (a reminder sent `daysBefore` days before the event). `1` → tomorrow's records. See the tip below.          |
| `daysAfter`        | No*      | —        | How many days **back** to query the report. Used only if `daysBefore` is not set.                                                                       |
| `filters`          | No       | —        | Filter the report rows — either an array of `{ field, operator, value }` objects, or a Filtrex expression string. See [Filters](#filters).              |
| `body`             | No       | —        | Array of field paths used as template BODY parameters (dot-path lookup, e.g. `first_name`, `date`, `time`). Missing values become empty.                |
| `crmData`          | No       | —        | Array of field paths to copy into the chat's `crmData` for templating. Keys are camelCased (e.g. `id` → `crmData.id`).                                  |
| `dateField`        | No       | —        | A field on each row to reformat to `dd.mm.yy` (Hebrew locale) before templating.                                                                        |
| `distinct`         | No       | `true`   | If true, de-duplicates rows by `phone`.                                                                                                                  |
| `orderByField`     | No       | `time`   | Field used to order rows.                                                                                                                                |
| `orderByDirection` | No       | `desc`   | Order direction (`asc` / `desc`).                                                                                                                        |
| `language`         | No       | `he`     | Template localization language.                                                                                                                          |

\* At least one of `daysBefore` / `daysAfter` is required (along with `accountId`, `templateName`, `report`).

:::tip[How the target date and sending work]

- **Target date**: the report is queried for a single day (`fromDate = toDate`), computed as **today + `daysBefore`** (or **today − `daysAfter`** when `daysBefore` is not set). So `daysBefore: 1` fetches tomorrow's records — i.e. a reminder the day before.
- **`vendorsToken` required**: `sendReminders` sends `crmConfig.vendorsToken` as the `AuthorizationKey` header. Without it the method fails.
- **Per-row processing**: for each row the adapter trims `time` to `hh:mm`, reformats `dateField` to `dd.mm.yy`, and falls back to `additional_phone` when `phone` is empty (rows with no phone at all are skipped).
- **`body` fields**: each entry is resolved with dot-path lookup against the row. Missing values become an empty string.
- **`crmData` fields**: copied into the chat's `crmData`, with **camelCased keys**.

:::

#### Filters

`filters` can be either:

1. An **array of filter objects** — `[{ field, operator, value }]`. Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `re` (regex), `contain`, `not_contain`, `in`, `not_in`. A row must satisfy **all** filters.
2. A **Filtrex expression string** — evaluated via Texter's `matchObject(...)` engine.

#### Supported reports

`birthdayReport`, `expiringMembershipsReport`, `trialClassesReport`, `membersOnHoldReport`, `shiftSummaryReport`, `transactionsReport`, `expiringSessionsReport`, `convertedLeadsReport`, `activeMembershipsReport`, `sessionsReport`, `absenceReport`.

#### Real-life scheduled-task example (`CrmMethodTask`)

This is what a production reminder job looks like when scheduled via the customer task scheduler (cron expression + `CrmMethodTask`). The example sends a class reminder one day ahead on Sun–Thu, and a two-day-ahead reminder on Fridays (covering Sunday classes):

```json
"schedule": [
  {
    "task": "CrmMethodTask",
    "expr": "0 9 * * 0-4",
    "params": {
      "method": "sendReminders",
      "params": {
        "report": "shiftSummaryReport",
        "daysBefore": 1,
        "templateName": "inbox_utility_155",
        "accountId": "YOUR_WHATSAPP_ACCOUNT_ID",
        "dateField": "date",
        "body": ["first_name", "date", "time"],
        "crmData": ["id"],
        "filters": [
          { "field": "role_fk", "operator": "eq", "value": 3 },
          { "field": "box_category_type", "operator": "eq", "value": "class" }
        ],
        "orderByDirection": "asc"
      }
    }
  },
  {
    "task": "CrmMethodTask",
    "expr": "0 9 * * 5",
    "params": {
      "method": "sendReminders",
      "params": {
        "report": "shiftSummaryReport",
        "daysBefore": 2,
        "templateName": "inbox_utility_169",
        "accountId": "YOUR_WHATSAPP_ACCOUNT_ID",
        "dateField": "date",
        "body": ["first_name", "date", "time"],
        "crmData": ["id"],
        "filters": [
          { "field": "role_fk", "operator": "eq", "value": 3 },
          { "field": "phone", "operator": "ne", "value": null },
          { "field": "box_category_type", "operator": "eq", "value": "class" }
        ],
        "orderByDirection": "asc"
      }
    }
  }
]
```

**Result:** Returns `success: true` after sending to all matched rows.

Returns `on_failure` if: `crmConfig.vendorsToken` is missing, required params are missing, `report` is not a supported report, the template/adapter cannot be resolved, the report API errors, or any individual send fails.

---

## Arbox Onboarding (for Texter Support)

### Obtain the `apiKey`

The customer can retrieve their Arbox API key from their account:

1. Log in to the Arbox account.
2. In the left sidebar, click **Settings**.
3. In the **Integrations** section, copy the **API Key** value.

This value goes into `crmConfig.apiKey`.

:::note[`vendorsToken` is separate]
The `vendorsToken` used by `sendReminders` is **not** the Integrations API key — it is a vendor/partner token issued by Arbox separately. Request it from Arbox during onboarding if the customer needs scheduled reminders.
:::

**Customer DB — `crmConfig` fields**

| Field          | Required                | Use                                                                            |
| -------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `apiKey`       | Yes                     | Arbox API key (`apiKey` header) — used by all operations.                      |
| `server`       | No                      | Override the API base URL if the customer is on a non-default Arbox host.       |
| `customIdField` | No                     | Field on the Arbox user record to surface as `crmData.id`.                      |
| `vendorsToken` | Yes (only if reminders) | Arbox vendors token (`AuthorizationKey` header) — required for `sendReminders`. |

Scheduled `sendReminders` jobs are configured as `CrmMethodTask` entries in the customer's task schedule (Nihul), not in bot YAML — see the example above.

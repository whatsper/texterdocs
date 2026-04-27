---
sidebar_position: 1
---

# Provet

[Provet Cloud](https://www.provetcloud.com/) is a veterinary practice management system (PMS) with a REST API.

**Official Provet Cloud API docs** (for deeper reference):

- [Authentication (OAuth 2.0)](https://developers.provetcloud.com/restapi/authentication_oauth2.html)
- [REST API Reference (v0.1)](https://developers.provetcloud.com/restapi/0.1/)

---

## CRM config (`crmConfig`)


| Field                | Required | Default | Use                                                                                                                         |
| -------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `server`             | **Yes**  | —       | Provet instance base URL. Must end with `/` (or Texter will append it). Used to build REST API URLs like `api/0.1/client/`. |
| `sortBy`             | No       | `id`    | Sort key used when multiple clients match the same phone in `getCustomerDetails`.                                           |
| `sortDirection`      | No       | `asc`   | Sort direction (`asc` / `desc`) used with `sortBy` in `getCustomerDetails`.                                                 |
| `toranClientId`      | No       | —       | Provet client ID used by `getToranNumber`.                                                                                  |
| `toranDefaultNumber` | No       | —       | Fallback phone number used by `getToranNumber` when no phone is found on that Provet client.                                |


---

## Adapter functions

### `getCustomerDetails`

Looks up a Provet **client** by phone number, and enriches `crmData` with the client’s non-archived patients and (if present) the patient health plan validity.

**When it runs:** At the start of the flow to identify whether the sender is a known client, and whenever a chat is opened via Texter UI.

**Basic**

```yaml
  provet_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```


| Param             | Required | Notes                                                                                                                                                     |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `phoneNumber`     | No       | Phone to look up. Defaults to the chat’s `clientPhoneE164` (E.164), and the adapter uses the Provet query filter `phonenumbers.phone_number__is`.         |
| `verify_by_nodes` | No       | Comma-separated bot state node names. If provided, the adapter tries to parse each node’s `text` as a phone number, and uses the last valid one it finds. |
| `sortBy`          | No       | Overrides `crmConfig.sortBy` for this call.                                                                                                               |
| `sortDirection`   | No       | `asc` / `desc`. Overrides `crmConfig.sortDirection` for this call.                                                                                        |


**Result:** On success, `crmData` contains:

- **Client basics**
  - `crmData.phone`: the phone used for lookup
  - `crmData.name`: `firstname + ' ' + lastname`
  - `crmData.clientId`: Provet `client.id`
  - `crmData.id`: Provet `client.id_number`
  - `crmData.deepLink`: `${crmConfig.server}/client/${client.id}`
  - plus all raw client fields returned by Provet (spread into `crmData`)
- **Patients**
  - `crmData.patients`: array of non-archived patients.
  - Each patient is extended with:
    - `title`: `${species} - ${name} ${breed}`
    - `crm_id`: boolean used by bots to iterate patients (true when the health plan is considered valid; false otherwise)
    - If a health plan is found: `health_plan.health_plan_valid` (boolean)

Returns `on_failure` if: `crmConfig.server` missing, phone is missing/invalid, the API returns an error, or no client matches the phone.

---

### `closeTicket`

Does not call Provet. Returns `success: true` with `lastMessageStoredInCRMTimestamp` set to the timestamp of the last chat message passed to the adapter.

**When it runs:** When a chat is resolved (used as a generic “transcript stored” marker in some integrations).

**Basic**

```yaml
  provet_close_ticket:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
    on_failure: done
```

No params.

**Result:** `lastMessageStoredInCRMTimestamp` (number / unix seconds as provided by the message object).

---

### `getToranNumber(Legacy)`

:::danger

This function is deprecated and used only by one customer, texter-tidhar, do not use.

:::

Fetches a Provet client (from `crmConfig.toranClientId`) and returns a phone number derived from that client’s phone list, with a fallback.

**When it runs:** Used in a customer-specific setup (“tidhar”) to get a routing/toran phone.

**Basic**

```yaml
  provet_get_toran:
    type: func
    func_type: crm
    func_id: getToranNumber
    on_complete: next
    on_failure: fallback
```

No params.

**Result:** Adds `crmData.toranPhone` (string) to existing chat `crmData`.

Returns `on_failure` if: Provet API errors, OAuth credentials are missing, or `crmConfig.server` is not set.

---

### `appointmentReminders`

Fetches upcoming appointments for a given day range and sends a WhatsApp **template message** to each appointment’s client (optionally filtered, ordered, and de-duplicated).

**When it runs:** Scheduled/batch reminder sending (not a typical per-chat bot flow).

**Basic**

```yaml
  provet_appointment_reminders:
    type: func
    func_type: crm
    func_id: appointmentReminders
    params:
      accountId: "YOUR_WHATSAPP_ACCOUNT_ID"
      templateName: "your_template_name"
      daysBefore: 1
      body:
        - "client.name"
        - "patientName"
        - "appointment.start_date"
        - "appointment.start_time"
    on_complete: done
    on_failure: failed
```


| Param              | Required | Default    | Notes                                                                                                                    |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `accountId`        | **Yes**  | —          | WhatsApp account ID to send from.                                                                                        |
| `templateName`     | **Yes**  | —          | Texter template name to send.                                                                                            |
| `daysBefore`       | No       | `1`        | Days from “now” to target appointments (adapter fetches between that date and +1 day).                                   |
| `language`         | No       | `he`       | Template localization language.                                                                                          |
| `dateFormat`       | No       | `dd/MM/yy` | Used for `appointment.start_date` formatting.                                                                            |
| `maxAmount`        | No       | `100`      | Page size for fetched appointments.                                                                                      |
| `demoNumber`       | No       | —          | If provided, sends only once (first result) to this number and then stops.                                               |
| `filters`          | No       | —          | Filter expressions evaluated against the appointment object (Filtrex-style). If set, at least one expression must match. |
| `distinct`         | No       | `true`     | If true, de-duplicates results by phone.                                                                                 |
| `orderByField`     | No       | `start`    | Field used to order appointments.                                                                                        |
| `orderByDirection` | No       | `asc`      | Order direction.                                                                                                         |
| `query`            | No       | —          | Extra Provet query params to apply when fetching appointments (added to request query string).                           |
| `body`             | No       | —          | Array of field paths used as template BODY parameters (e.g. `client.name`, `patientName`, `appointment.start_date`).     |
| `crmData`          | No       | —          | Array of field paths to copy into the chat’s `crmData` for templating. Keys are camelCased.                              |


**Result:** Returns `success: true` with `results` (the computed send targets) and `appointments` (raw API results).

Returns `on_failure` if: adapter/template cannot be resolved, Provet API errors, or OAuth credentials are missing.

---

### `sendReminders`

Fetches Provet reminders for a planned sending date and sends template messages based on a mapping from Provet reminder template title → Texter template name.

**When it runs:** Scheduled/batch reminder sending (not a typical per-chat bot flow).

**Basic**

```yaml
  provet_send_reminders:
    type: func
    func_type: crm
    func_id: sendReminders
    params:
      accountId: "YOUR_WHATSAPP_ACCOUNT_ID"
      templatesDict:
        defaultTemplate: "your_default_template"
        "Reminder template title from Provet": "your_specific_template"
      daysBefore: 0
      body:
        - "client.name"
        - "patient.name"
        - "expiry_date"
    on_complete: done
    on_failure: failed
```


| Param                                | Required | Default                | Notes                                                                                                                 |
| ------------------------------------ | -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `accountId`                          | **Yes**  | —                      | WhatsApp account ID to send from.                                                                                     |
| `templatesDict`                      | **Yes**  | —                      | Map of Provet reminder template **title** → Texter template name. Must include `defaultTemplate` as a fallback.       |
| `daysBefore`                         | No       | `0`                    | Shifts the planned sending date (format `yyyy-MM-dd`) used in the Provet reminder query.                              |
| `language`                           | No       | `he`                   | Template localization language.                                                                                       |
| `dateFormat`                         | No       | `dd/MM/yy`             | Used for `expiry_date` formatting.                                                                                    |
| `maxAmount`                          | No       | `100`                  | Page size for fetched reminders.                                                                                      |
| `demoNumber`                         | No       | —                      | If provided, sends only once (first result) to this number and then stops.                                            |
| `filters`                            | No       | —                      | Filter expressions evaluated against the reminder object (Filtrex-style). If set, at least one expression must match. |
| `distinct`                           | No       | `true`                 | If true, de-duplicates results by phone.                                                                              |
| `orderByField`                       | No       | `planned_sending_date` | Field used to order reminders.                                                                                        |
| `orderByDirection`                   | No       | `asc`                  | Order direction.                                                                                                      |
| `checkFutureAppointments`            | No       | `false`                | If true, skips reminders for clients that have future appointments in the configured day range.                       |
| `daysToCheckFutureAppointmentsStart` | No       | `0`                    | Start of the future-appointment check range (days from “now”).                                                        |
| `daysToCheckFutureAppointmentsEnd`   | No       | `14`                   | End of the future-appointment check range (days from “now”).                                                          |
| `query`                              | No       | —                      | Extra Provet query params to apply when fetching reminders.                                                           |
| `reminderTemplatesQuery`             | No       | `{ page_size: '200' }` | Extra query params for fetching Provet reminder templates.                                                            |
| `body`                               | No       | —                      | Array of field paths used as template BODY parameters (e.g. `client.name`, `patient.name`, `expiry_date`).            |
| `crmData`                            | No       | —                      | Array of field paths to copy into the chat’s `crmData` for templating. Keys are camelCased.                           |


**Result:** Returns `success: true` with `results`.

Returns `on_failure` if: default/specific template cannot be resolved, Provet API errors, or OAuth credentials are missing.

---

## Provet Onboarding (for Texter Support)

This adapter uses **OAuth 2.0** (server-managed credentials). Bot YAML does not provide Provet secrets.

:::info[Hebrew onboarding doc]
Internal Hebrew reference: [Provet Cloud integration](https://docs.google.com/document/d/1fP9TyXziQMToH-z7IM8RdIgKBQxiSOG6F7LQ-0VNsiU/edit?tab=t.d9wt5p699cbt)
:::

### 1) Collect the customer Provet instance URL (`provetId`)

Provet uses a 4-digit **`provetId`** in the customer environment URL. Example:

- `https://provetcloud.com/1234` → `provetId = 1234`

### 2) Ask Provet Support to enable our application for the customer

To onboard a new Provet customer, we need Provet Support to add/enable **our application** in the customer’s Provet environment.

- Email: `support@provet.com`
- App name to request: **`Texterchat - WhatsApp integration`**
- This is typically handled by **Gil** (Provet approvals can be involved).

Once Provet completes the setup, our app should appear in the customer’s Provet integrations/app list.

### 3) Enable the integration request inside Provet

In the customer’s Provet environment:

- Go to **Settings → Integrations → Free API Access**
- Click **Add Request**
- Select **Texterchat - WhatsApp integration**

![Finding the Texter app in Provet](/img/adapters/provet/provet-app-list.png)

If the app is not visible, follow up with Provet Support until it appears.

### 4) Obtain `clientId` / `clientSecret` for this customer

After the app is enabled in Provet, obtain the OAuth app credentials:

- `clientId`
- `clientSecret`

This is typically retrieved via the n8n workflow [Get OAuth Credentials](https://n8n.texter.chat/workflow/mbJSHlQKVUohmOoR).



### 5) Configure Texter OAuth service + CRM config

After credentials are obtained, add a new row to the [Provet Data Table](https://n8n.texter.chat/projects/YzYpPkMyySeB6MDD/datatables/zfRGeCa1n321aZnQ) in n8n.

Ensure the customer config contains the Provet OAuth service config:

```json
"oauthServices": {
  "provet": {
    "enabled": true,
    "config": {
      "orgHost": "https://provetcloud.com/PROVET_ID/",
      "clientId": "CLIENT_ID",
      "redirectUri": "https://n8n.texter.chat/webhook/auth/oauth/v2/authorize-callback/?provet_id=PROVET_ID",
      "clientSecret": "CLIENT_SECRET"
    }
  }
}
```

:::caution[Why `redirectUri` is required]
Our Provet app uses a **fixed redirect URI** (partner constraint). We route customer-specific OAuth callbacks via two n8n workflows:

1. [Get OAuth Credentials](https://n8n.texter.chat/workflow/mbJSHlQKVUohmOoR) — receives a webhook after the app is registered and stores `clientId` / `clientSecret`.
2. [OAuth Redirector](https://n8n.texter.chat/workflow/VxGXesTzBQmvw6xr) — receives the authorization callback and redirects to the correct customer inbox URL based on the data table row.
:::

And add to CRM config the Provet server for adapter calls:

```json
{
  "crm": "provet",
  "section": "crm",
  "server": "https://provetcloud.com/PROVET_ID"
}
```

---

## Useful Tips

### Provet Request Filters and Exposeable Fields
<br/>
:::tip[Reading Provet REST API docs: filters and \"expose_*\"]
On each endpoint page (for example `https://provetcloud.com/4444/api/0.1/appointment/`), Provet lists:

- **Filterable fields**: used as query params (often with double-underscores, e.g. `id__is_not`, `start__range`, etc.).
- **Exposable fields**: add query params like `expose_patient=true` (or `expose_<field>`) to expand nested objects in the response instead of getting only URLs.
:::

Example page ( `.../api/0.1/appointment/` ):

![Provet API docs page showing filters/exposable fields](/img/adapters/provet/provet-api-docs-page.png)

---

### Creating Access Token For Debugging
:::tip[Getting an access token (internal troubleshooting)]
If you need to test Provet API calls manually, generate an access token using **Client Credentials** with the customer’s `provetId`, `clientId` and `clientSecret`.

```bash
curl --location \
  'https://provetcloud.com/PROVET_ID/oauth2/token/' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=CLIENT_ID' \
  --data-urlencode 'client_secret=CLIENT_SECRET'
```

Use the returned `access_token` as a Bearer token in API requests.
:::

![Oauth postman token request](/img/adapters/provet/postman-token-request.png)
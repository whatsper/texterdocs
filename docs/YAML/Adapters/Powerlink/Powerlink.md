---
sidebar_position: 1
---

# Powerlink (Fireberry)

[Powerlink](https://www.powerlink.co.il/) — also branded **Fireberry** — is an Israeli CRM. This page documents **Texter’s Powerlink adapter** (`func_type: crm`): `params`, `crmConfig`, and what lands on `crmData`.

**Official doc hubs (for deeper reference):**

- [Fireberry REST API — getting started](https://developers.fireberry.com/reference/getting-started-with-rest-api) — main vendor API reference (accounts, contacts, tickets, query, metadata, etc.).
- [Powerlink CRM REST API (GitHub)](https://github.com/powerlink/Rest-API) — patterns Texter’s adapter follows (`/api/record/{ObjectType}`, `/api/query`, operators).
- [Powerlink support — REST API (Hebrew KB)](https://support.powerlink.co.il/support/kb/%D7%94%D7%AA%D7%9E%D7%9E%D7%A9%D7%A7%D7%95%D7%99%D7%95%D7%AA/Rest_API)

:::tip Field names and queries

Use the **API field names** from the customer’s org (often lowercase: `accountname`, `telephone1`, `statuscode`, custom `pcfsystemfield…`). In **query** bodies, **string literals must use single quotes** — see the [Rest-API Query section](https://github.com/powerlink/Rest-API/blob/master/README.md#query) and the adapter’s `customQuery` comment.

:::

---

## Powerlink REST API

Powerlink’s REST API uses a numeric **object type** in the path ([GitHub README — Create / Update](https://github.com/powerlink/Rest-API); see also [Fireberry REST API](https://developers.fireberry.com/reference/getting-started-with-rest-api) for the current product reference):

- **Create:** `POST https://api.powerlink.co.il/api/record/{ObjectType}` with a JSON body of field names → values.
- **Update:** `PUT https://api.powerlink.co.il/api/record/{ObjectType}/{id}` with the fields to patch.
- **Read (search):** `POST https://api.powerlink.co.il/api/query` with `objecttype`, `query`, `fields`, paging — not the same as `/record/{n}`, but `objecttype` uses the **same numbering**.

Documented examples in the [README](https://github.com/powerlink/Rest-API) include **Account = 1**, **Contact = 2**, **Cases = 5**. The Texter adapter also uses these **object types** in code:

| `ObjectType` | Entity (typical) | Used in adapter |
|----------------|------------------|-----------------|
| **1** | Account | `newAccount`, `changeStatus`, lookups, `assignChat` |
| **2** | Contact | Contact query; `newAccount` creates/finds contact via `createContact` helper |
| **4** | Opportunity | `newOpportunity` |
| **5** | Case (ticket) | `openTicket` |
| **7** | Note / activity | `addActivity`, `syncActivityData` (notes) |
| **9** | Users (system users) | `addActivity`, `assignChat` (load users by email) |
| **10** | Task | `openTask`, `closeTicket` |

And more. Custom entities use **other numbers** (e.g. **1000+**) — your customer’s Powerlink admin / API docs list them.

---

## CRM config (`crmConfig`)

These values are set **once** per customer environment (not in public bot YAML). `token` is required for all API calls. The customer creates or copies the **TokenID** in Fireberry/Powerlink under **Settings → Tools → API forms** ([direct link](https://api.powerlink.co.il/app/settings/tools/apiforms)).

| Field | Required | Default (if unset) | Use |
|--------|----------|---------------------|-----|
| `token` | **Yes** | — | `TokenID` header for `https://api.powerlink.co.il/...`. Obtained in-app: [Settings → Tools → API forms](https://api.powerlink.co.il/app/settings/tools/apiforms). |
| `inboxUrl` | **Yes** | — | Base URL for Texter **Inbox** links inside `description` / task text (`newOpportunity`, `openTicket`, `openTask`, `closeTicket`). |
| `idField` | No | — | Maps a custom Account field to what Texter shows as ID in the CRM panel. |
| `showDuplicates` | No | `false` | If `true`, appends a Hebrew duplicate marker (`\| כפול`) to `crmData.phone` when **either** the account query returns more than one record **or** the fallback contact query returns at least one record (i.e. fires on a single contact match too). |
| `displayExistingData` | No | — | If `true` and `dataFields` is set, `getCustomerDetails` can still **succeed** when Powerlink finds **no** account/contact — see below. |
| `dataFields` | No | — | Used **with** `displayExistingData`: maps `contact.crmData` paths → CRM panel fields — see below. |
| `contactQueryFields` | No | `mobilephone1`, `mobilephone2`, `telephone1` | Array of phone fields used in **contact** query. |
| `accountQueryFields` | No | `telephone1` | Array of phone fields used in **account** query. |
| `accountFields` | No | `*` | Field list for the account query. |
| `originatingLeadCode` | No | `5` | New **account** (`newAccount`). |
| `newAccountStatusCode` | No | `0` | New **account** `statuscode`. |
| `taskTypeCode` | No | `6` | `openTask` / `closeTicket` `tasktypecode`. |

#### `displayExistingData` and `dataFields`

Normally `getCustomerDetails` fails when no **Account** or **Contact** matches the chat phone. If `displayExistingData` is `true` and `dataFields` is an object, the adapter does not treat that as failure: it builds `crmData` from whatever is already on the chat’s `contact.crmData` (e.g. values saved earlier in the flow or from another integration).

`dataFields` is not a list of Powerlink API names. It has **exactly four keys** — `name`, `phone`, `id`, `accountId` — and each value is a path into `contact.crmData` (lodash-style, so dotted paths work for nested keys). The adapter reads those paths and writes them onto `crmData` as `name`, `phone`, `id`, and `accountid` (note: the output key is lowercase `accountid` to match the normal-flow lookup, even though the config key is `accountId`). If `accountid` resolves to a value, a `deepLink` to that Powerlink account is added.

**Fallbacks:** missing `name` → chat title; missing `phone` → chat E.164 phone; missing `id` / `accountId` → empty string.

**Example** (customer env JSON — not bot YAML):<br/>
if `contact.crmData` might look like 
```json
{ "customer_display_name": "…", "wa_phone": "…", "loyalty_number": "…", "pl_account_guid": "…" }
```
you could set:

```json
"displayExistingData": true,
"dataFields": {
  "name": "customer_display_name",
  "phone": "wa_phone",
  "id": "loyalty_number",
  "accountId": "pl_account_guid"
}
```

---

## Adapter functions

### `getCustomerDetails`

Finds the **account** (and if needed the **contact**) for the chat’s phone: runs `POST /api/query` on **accounts** (object type **1**) using phone variants on `accountQueryFields`, then **contacts** (type **2**) if no account match.

**When it runs:** From bot YAML, and the **CRM panel** in the Texter UI can rely on the same kind of lookup when a chat is opened (phone must be present on the chat).

**Basic**

```yaml
  powerlink_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|--------|----------|--------|
| *(none)* | — | Uses the chat’s **E.164** phone only. |

**Result:** `success` drives `on_complete` / `on_failure`. On match: `exist`, `crmAccount`, full `crmData` from Powerlink (+ `id` if `idField`). If no match but `displayExistingData` + `dataFields`: `success` with a small `crmData` only (see [above](#displayexistingdata-and-datafields)). Else `success: false`.

---

### `newOpportunity`

Creates an **Opportunity** (`POST /api/record/4`). If there is no `crmData.accountid`, an **account** is created first (minimal fields from chat + `crmConfig`; this step does not use this op’s `params`). Then `params` are merged into the opportunity body (same key in YAML **replaces** the default; values are stringified).

Most fields have sensible defaults — only pass `params` to override specific values.

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `name` | פנייה מהווצאפ + chat title | — | Yes |
| `statuscode` | `1` | — | Yes |
| `description` | Chat messages + newline + Inbox link | `inboxUrl` (in link) | Yes |
| `accountid` | After create / from chat | — | Yes |
| Other Powerlink fields | — | — | Yes (e.g. `pcfsystemfield…`) |

**When it runs:** e.g. logging a lead after intake.

**Basic**

```yaml
  powerlink_new_opp:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_logged
    on_failure: lead_failed
```

| Param | Required | Notes |
|--------|----------|--------|
| *(any)* | No | Opportunity (type **4**) fields. |

**Result:** `crmData.opportunityid`, `crmLastTicketId`, `crmLastObjectType` (`4`) so later `openTask` / `closeTicket` can attach to the same “last object” chain.

**Advanced**

```yaml
  powerlink_new_opp_with_fields:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      pcfsystemfield100: "WhatsApp"
    on_complete: lead_logged
```

---

### `customQuery`

Runs `POST /api/query` with a free-form `query` string (operators `AND`, `OR`, `=`, etc. — [README query table](https://github.com/powerlink/Rest-API/blob/master/README.md#query)) and an `objecttype`. Use this when `getCustomerDetails` is not enough: list rows of any entity, filter by fields, paginate (adapter uses `page_size` 50, `page_number` 1).

**Basic**

```yaml
  powerlink_query:
    type: func
    func_type: crm
    func_id: customQuery
    params:
      objectTypeCode: 1
      query: "(telephone1 = '0500000000')"
      fields: "*"
      resultKey: "myRows"
    on_complete: next_step
```

| Param | Required | Notes |
|--------|----------|--------|
| `query` | **Yes** | Powerlink query; **strings in single quotes** per adapter + API expectations. |
| `objectTypeCode` | **Yes** | **Number** (YAML: `1` not `"1"`). |
| `fields` | No | Default `*`. |
| `resultKey` | No | Key on `crmData` for `data.Data` (default `customQueryResult`). |

**Result:** `{ success: true, crmData: { [resultKey]: DataArray } }`.

---

### `createRecord`

`POST /api/record/{recordNumber}` ([README](https://github.com/powerlink/Rest-API/blob/master/README.md#create)). Body comes **only** from YAML: all keys stringified except `recordNumber` / `descriptionField`; if `descriptionField` is set, that named field gets the chat transcript.

**When it runs:** When you need to create a record on any Powerlink entity type not covered by the other ops.

**Basic**

```yaml
  powerlink_create_generic:
    type: func
    func_type: crm
    func_id: createRecord
    params:
      recordNumber: 5
      subject: "Follow-up from WhatsApp"
      descriptionField: "notetext"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `recordNumber` | **Yes** | Positive integer — **object type** for `/api/record/{recordNumber}`. |
| `descriptionField` | No | If set, that field receives the **chat session messages**. |
| *other keys* | No | Other fields on the new record. |

**Result:** `crmData` = `{ ...contact.crmData, ...response.data.Record }`.

---

### `newAccount`

Creates an **Account** (`POST /api/record/1`) if `crmData.accountid` is missing; otherwise returns the existing account. Ensures a **contact** first and links `primarycontactid`. Optional `company_node` / `name_node` / `email_node` are **node names** — values come from `userState`, then those keys are stripped; **all other** `params` merge into the account body (same key replaces default).

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `telephone1` | Formatted chat phone | — | Yes |
| `accountname` | Chat title | — | Yes |
| `firstname` | Chat title | — | Yes |
| `emailaddress1` | (empty) | — | Yes |
| `originatingleadcode` | — | `originatingLeadCode` or `5` | Yes |
| `statuscode` | — | `newAccountStatusCode` or `0` | Yes |
| `primarycontactid` | From contact step | — | Yes |

**When it runs:** e.g. after `getCustomerDetails` → `on_failure`.

**Basic**

```yaml
  powerlink_new_account:
    type: func
    func_type: crm
    func_id: newAccount
    on_complete: main_menu
    on_failure: creation_failed
```

| Param | Required | Notes |
|--------|----------|--------|
| `company_node` | No | Maps to `accountname`. |
| `name_node` | No | Maps to `firstname`. |
| `email_node` | No | Maps to `emailaddress1`. |
| *other* | No | Any account field. |

**Result:** `crmData` with `accountid`, `phone`, `name`, `deepLink`. If `crmData.accountid` already exists, returns that account without duplicating.

**Advanced**

```yaml
  powerlink_register_lead:
    type: func
    func_type: crm
    func_id: newAccount
    params:
      name_node: collect_display_name
      company_node: collect_company
      statuscode: 2
      originatingleadcode: 6
    on_complete: main_menu
```

---

### `openTicket`

Creates a **Case** (`POST /api/record/5`). If there is no `crmData.accountid`, an **account** is created first (title only from chat; **not** from this op’s `params`). Then defaults are set and **your `params` are merged** (same key overwrites).

Most fields have sensible defaults — only pass `params` to override specific values.

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `title` | פנייה מהווצאפ | — | Yes |
| `statuscode` | `"1"` | — | Yes |
| `description` | Transcript + Inbox link | `inboxUrl` (in link) | Yes |
| `casetypecode` | `"1"` | — | Yes |
| `pcfsystemfield534` | Inbox URL + `/contact/` + phone | `inboxUrl` | Yes |
| `pcfsystemfield487` | `"10"` (WhatsApp) | — | Yes |
| `accountid` | New or existing | — | Yes |
| `contactid` | If needed after create | — | Yes |

**When it runs:** e.g. opening a support case from the bot.

**Basic**

```yaml
  powerlink_open_case:
    type: func
    func_type: crm
    func_id: openTicket
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(any)* | No | Case (type **5**) fields. |

**Result:** `crmData.casesid`, `crmLastTicketId`, `crmLastObjectType` (`5`).

---

### `updateField`

Updates **one field** on **one record**: `PUT /api/record/{objecttypecode}/{objectid}` with a body `{ [fieldname]: fieldvalue }`.

**When it runs:** After `getCustomerDetails` — to patch a single field on an existing account or contact.

**Basic**

```yaml
  powerlink_patch_field:
    type: func
    func_type: crm
    func_id: updateField
    params:
      objecttypecode: 1
      objectid: "%chat:crmData.accountid%"
      fieldname: "description"
      fieldvalue: "Updated from bot"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `objecttypecode` | **Yes** | Target entity type (e.g. **1** account). |
| `objectid` | **Yes** | Record id. |
| `fieldname` | **Yes** | Single field API name. |
| `fieldvalue` | **Yes** | New value (must be present; falsy can fail validation in code). |

**Result:** `{ success: true }` on API success.

---

### `changeStatus`

Sets the **account’s** `statuscode` only: `PUT /api/record/1/{accountid}` using `crmData.accountid` from the chat. Use [`crmGetFields`](#crmgetfields) (or Powerlink UI) to map labels → numeric codes.

**When it runs:** After `getCustomerDetails` — to update the account status.

**Basic**

```yaml
  powerlink_set_status:
    type: func
    func_type: crm
    func_id: changeStatus
    params:
      crmStatusCode: 2
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(prerequisite)* | — | `crmData.accountid` must be on the chat. |
| `crmStatusCode` | **Yes** | Value for `statuscode` on the account. |

**Result:** `{ success: true }` on API success.

---

### `openTask`

Creates a **Task** (`POST /api/record/10`). Defaults below; then `params` are merged when `crmData` exists on the chat. Value `crmData_someKey` → replaced with `crmData.someKey` before send.

Most fields have sensible defaults — only pass `params` to override specific values.

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `subject` | "צ'ט עם לקוח בווצאפ - משימה לביצוע" | — | Yes |
| `objecttitle` | Chat title (or account name when linked to account) | — | Yes |
| `statuscode` | `1` | — | Yes |
| `description` | Inbox link | `inboxUrl` | Yes |
| `objectid` | Last ticket id, else account/contact id | — | Yes |
| `objecttype` | `1` | — | Yes |
| `objecttypecode` | With account/contact fallback | — | Yes |
| `tasktypecode` | — | `taskTypeCode` or `6` | Yes |

**When it runs:** e.g. after `openTicket` / `newOpportunity`.

**Basic**

```yaml
  powerlink_open_task:
    type: func
    func_type: crm
    func_id: openTask
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(any)* | No | Task fields. Any value of `crmData_<key>` is replaced at runtime with `crmData.<key>` — e.g. `ownerid: crmData_ownerid` pulls the owner from `crmData`. |

**Result:** `lastMessageStoredInCRMTimestamp`, `crmData.lastRecordId`.

**Advanced**

```yaml
  powerlink_task_with_crm:
    type: func
    func_type: crm
    func_id: openTask
    params:
      ownerid: crmData_ownerid
    on_complete: done
```

---

### `closeTicket`

Logs the closed chat as a **Task** (`POST /api/record/10`). **No `params`.** Uses chat transcript, `crmLastTicketId` / `crmData`, and `crmConfig`.

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `subject` | "צ'ט עם לקוח בווצאפ - " + \{\{last message time\}\} | — | No |
| `objecttitle` | Chat / account title | — | No |
| `statuscode` | `10` (done) | — | No |
| `description` | Inbox link + transcript | `inboxUrl` | No |
| `objectid` / `objecttype` / `objecttypecode` | From last ticket or account/contact | — | No |
| `tasktypecode` | — | `taskTypeCode` or `6` | No |

**When it runs:** e.g. when a chat is resolved.

**Basic**

```yaml
  powerlink_close_log:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(none)* | — | — |

**Result:** `lastMessageStoredInCRMTimestamp`, `crmData.lastRecordId`.

---

### `crmGetFields`

Fetches **picklist values** for **account** `statuscode`: `GET .../metadata/records/1/fields/statuscode/values`. Use to populate choices or validate `changeStatus` / `newAccount` codes.

**When it runs:** When configuring `changeStatus` and you need to look up the numeric code for a given status label.

**Basic**

```yaml
  powerlink_statuses:
    type: func
    func_type: crm
    func_id: crmGetFields
    on_complete: use_statuses
```

| Param | Required | Notes |
|--------|----------|--------|
| *(none)* | — | No `params`. |

**Result:** `{ data: { statuses: [...] } }` on success; else `{ success: false }`.

---

### `addActivity`

**Note** on the account (`POST /api/record/7`). Account must already exist (phone lookup). Only YAML keys `text` (required) and `email` (optional owner lookup) — no free-form merge.

**When it runs:** After `getCustomerDetails` — to add a note to the account record.

| Field | Code | `crmConfig` | `params` |
|-------|------|-------------|----------|
| `objecttypecode` | `1` (account) | — | No |
| `objectid` | Account id from query | — | No |
| `notetext` | — | — | Yes (`text`) |
| `ownerid` | When `email` matches a user | — | `email` in YAML (not `ownerid`) |

**Basic**

```yaml
  powerlink_add_note:
    type: func
    func_type: crm
    func_id: addActivity
    params:
      email: "agent@example.com"
      text: "Customer asked about delivery"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `email` | No | If set and matched on `GET /api/record/9`, sets `ownerid`. |
| `text` | **Yes** | Maps to `notetext`. |

**Result:** `{ success: true, record: {...} }`; also upserts into Texter’s activities store in code.

---

### `assignChat`

Sets account **owner** by `PUT /api/record/1/{accountid}` with `ownerid` from the user list (`GET /api/record/9`) where `emailaddress1` equals `params.email`.

**When it runs:** After `getCustomerDetails` — to assign the account to a specific Powerlink user.

**Basic**

```yaml
  powerlink_assign:
    type: func
    func_type: crm
    func_id: assignChat
    params:
      email: "owner@example.com"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(prerequisite)* | — | `crmData.accountid` must be on the chat. |
| `email` | **Yes** | Must match a user’s `emailaddress1`. |

**Result:** `{ success: true }` when the assign goes through. Returns `{ success: false }` (routing to `on_failure`) when `params.email` does not match any Powerlink user or when the account lookup is empty.

---

### `getCustomerCustomObject` - Legacy

Same transport as `customQuery` (`POST /api/query`), but the `query` string can include placeholders `crmData[key]` and `botData[key]` replaced from `contact.crmData` and `userState[key].text`. If rows are returned, the adapter also builds `customQueryList` for **choice** UIs using **hard-coded** field names in code (`subject`, `scheduledstart`, `pcfsystemfield466`) — **only suitable** if your object matches that shape; otherwise use `customQuery` or extend the product.

**Basic**

```yaml
  powerlink_custom_object:
    type: func
    func_type: crm
    func_id: getCustomerCustomObject
    params:
      objecttypecode: 1000
      fields: "*"
      query: "(accountid = crmData[accountid])"
    on_complete: pick_row
```

| Param | Required | Notes |
|--------|----------|--------|
| `objecttypecode` | **Yes** | `objecttype` in the query body. |
| `query` | **Yes** | After placeholder replacement. |
| `fields` | No | Default `*`. |

**Result:** `crmData` includes `customQueryList` plus merged `responseData` and `contact.crmData`.

---

## Powerlink onboarding (for Texter Support)

**Ask the customer** to open [API forms (TokenID)](https://api.powerlink.co.il/app/settings/tools/apiforms) while signed into Fireberry/Powerlink (`Settings → Tools → API forms`) and provide the token Texter should store server-side.

**You / the customer should agree on:**

| Topic | Notes |
|--------|--------|
| `token` | **TokenID** from Settings → Tools → API forms - https://api.powerlink.co.il/app/settings/tools/apiforms |
| `inboxUrl` | Texter Inbox base URL for links in descriptions. |
| **Phone fields** | `accountQueryFields` / `contactQueryFields` if defaults don’t match the org. |
| **Object types** | Confirm numeric ids for **custom** entities when using `createRecord` / `customQuery`. |
| **Tasks** | `taskTypeCode` for `openTask` / `closeTicket`. |

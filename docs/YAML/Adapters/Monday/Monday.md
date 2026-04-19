---
sidebar_position: 1
---

# Monday

[monday.com](https://monday.com/) is a Work OS that can be used as a lightweight CRM — contacts/leads are **items** on a **board**, grouped into **groups**, with typed **columns** (phone, status, text, dropdown, etc.). The adapter talks to monday's [GraphQL API v2](https://developer.monday.com/api-reference/) (`https://api.monday.com/v2`).

**Official monday.com API docs** (for deeper reference):

- [Create an item](https://developer.monday.com/api-reference/reference/items#create-an-item) — `createItem`
- [Items page by column values](https://developer.monday.com/api-reference/reference/items-page-by-column-values) — `getCustomerDetails`
- [Changing column values](https://developer.monday.com/api-reference/docs/change-column-values) — format guide, read this before wiring `updateItem` / `createItem` params
- [Column types reference](https://developer.monday.com/api-reference/reference/column-types-reference) — exact JSON shape per column type (phone, email, status, dropdown, date, etc.)
- [Change multiple column values](https://developer.monday.com/api-reference/reference/columns#change-multiple-column-values) — `updateItem`
- [Change a simple column value](https://developer.monday.com/api-reference/reference/columns#change-a-simple-column-value) — `changeStatus`
- [Status column reference](https://developer.monday.com/api-reference/reference/status) — status label / index resolution

---

## CRM config (`crmConfig`)

All fields below marked **Yes** are validated up front for every operation — if any is missing or the wrong type, the adapter returns `on_failure` immediately.

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `authToken` | **Yes** | — | monday.com API token. Sent as-is as the `Authorization` header. |
| `boardId` | **Yes** | — | Numeric ID of the board to read/write. Accepts either a number or a numeric string. |
| `groupId` | **Yes** | — | ID of the group within the board where new items are created by `createItem`. |
| `phoneColumnId` | **Yes** | — | Column ID of the board's phone column — used both as the lookup key in `getCustomerDetails` and as the default-populated column in `createItem`. |
| `statusColumnId` | **Yes** | — | Column ID of the board's status column — used by `getCustomerDetails` (to resolve the status label), `changeStatus`, and `crmGetFields`. |
| `workspaceUrl` | **Yes** | — | Workspace URL prefix (e.g. `https://your-workspace.monday.com`). Concatenated with each item's `relative_link` to produce `crmData.deepLink`. |
| `idColumnId` | No | `id` | Name of the field on the fetched item whose value is exposed as `crmData.id`. Default is monday's built-in item `id`. Can also point to a custom column ID — but only if `additionalFieldsQuery` requests `column_values { id text value }`, since the adapter resolves custom columns by flattening `column_values[].id → column_values[].text` onto the item first. If the referenced field is not present on the item, `crmData.id` silently falls back to the item's built-in `id`. |
| `useNationalDigits` | No | `false` | If `true`, the phone used for lookup/creation is only the **local** part (no country code). |
| `useFullPhoneNumber` | No | `false` | If `true`, the phone used for lookup/creation is the full E.164 number **without** the leading `+`. |
| `additionalFieldsQuery` | No | — | Extra GraphQL fragment injected inside the `items { ... }` selection of `getCustomerDetails`. Typically requests `column_values { id text value }` to pull specific item columns back onto `crmData`. Can also be overridden per-call via YAML `params.additionalFieldsQuery`. |
| `additionalFieldsVariables` | No | — | Object of extra GraphQL variables used by `additionalFieldsQuery`. Each key becomes a `String!` variable (e.g. `{ "myColId": "text_xyz" }` → `$myColId: String!`). Can be overridden per-call via YAML `params.additionalFieldsVariables`. |

:::tip[Phone format priority]
Only **one** of `useNationalDigits` / `useFullPhoneNumber` takes effect — `useNationalDigits` wins if both are set. If neither is set, the adapter falls back to the customer's **country-formatted phone** with all non-digit characters stripped (for an Israeli number `+972525551234`, that's typically `0525551234` — national-format digits with the local prefix kept). The exact output depends on the customer-country formatter. Make sure the format you pick matches how phone numbers are actually stored in the monday **phone column**, otherwise `getCustomerDetails` will never find matches.
:::

---

## Column IDs and value formats

Every YAML param key in `createItem` and `updateItem` is a monday **column ID** — not the column's display title. The column value is whatever you pass as the param value.

### How to find a column ID

For columns created via monday's UI since Feb 2024, the ID is the title lower-cased with spaces replaced by underscores (titles ≤20 chars). So a column titled `Lead Source` → `lead_source`, `Email` → `email`. Long titles get auto-generated IDs like `text__1`, `status_abc123` — in those cases you need to fetch them:

```graphql
query { boards(ids: [YOUR_BOARD_ID]) { columns { id title type } } }
```

Try this in monday's [API Playground](https://monday.com/developers/v2/try-it-yourself) or via `crmGetFields` patterns.

### Value formats by column type

monday expects **different JSON shapes** depending on column type. The adapter does **not** reshape your values — every YAML param is `JSON.stringify`'d and sent as-is inside monday's `column_values`. The adapter only routes to `on_failure` when monday's GraphQL response has an `errors` array; if monday accepts the mutation but silently ignores a malformed column value (which can happen), the adapter reports `success: true`. In short: **you are responsible for passing the exact shape monday expects**.

YAML **can** produce nested objects, so complex formats are fully supported. The most common ones:

| Column type | YAML value | Produces JSON |
|-------------|------------|---------------|
| Text / long text | `"Hello"` | `"Hello"` |
| Numbers | `"42"` | `"42"` |
| Status | `"Done"` **or** `{ label: "Done" }` **or** `{ index: 1 }` | `"Done"` / `{"label":"Done"}` / `{"index":1}` |
| Phone | `{ phone: "+12025550169", text: "+12025550169" }` | `{"phone":"+12025550169","text":"+12025550169"}` |
| Email | `{ email: "a@b.com", text: "a@b.com" }` | `{"email":"a@b.com","text":"a@b.com"}` |
| Date | `{ date: "2026-04-19" }` | `{"date":"2026-04-19"}` |
| Dropdown | `{ labels: ["Marketing", "Design"] }` | `{"labels":["Marketing","Design"]}` |
| Link | `{ url: "https://...", text: "Click me" }` | `{"url":"https://...","text":"Click me"}` |
| Checkbox | `{ checked: "true" }` | `{"checked":"true"}` |
| People | `{ personsAndTeams: [{ id: 123, kind: "person" }] }` | `{"personsAndTeams":[{"id":123,"kind":"person"}]}` |

The full reference is on monday's [Column types reference](https://developer.monday.com/api-reference/reference/column-types-reference) — read that before wiring anything non-trivial.

:::tip[Status: label vs index (updateItem / createItem only)]
`{ label: "Done" }` is human-readable but **breaks** if a board admin renames the label. `{ index: 1 }` uses the label's numeric ID (visible in the status column's settings) and is resilient to renames — prefer it for long-lived YAML. This only applies to `updateItem` and `createItem` (which go through `change_multiple_column_values`); [`changeStatus`](#changestatus) is always label-only — see that section for details.
:::

:::warning[Phone column on createItem]
The adapter auto-sets the phone column (`crmConfig.phoneColumnId`) to the formatted phone **as a plain string** — never as the nested `{phone, text}` object. If the board's phone column rejects plain strings, override the auto-set value by passing the same column ID as a param with a nested object:

```yaml
  monday_create_item:
    type: func
    func_type: crm
    func_id: createItem
    params:
      phone:  # this key must match crmConfig.phoneColumnId
        phone: "%chat:channelInfo.id%"
        text: "%chat:channelInfo.id%"
    on_complete: item_created
    on_failure: item_failed
```

Any param whose key matches `phoneColumnId` replaces the adapter's default string.
:::

---

## Adapter functions

### `createItem`

Creates a new item on the configured board + group. The item's **name** is set to the chat title, its **phone column** is set to the formatted phone, and any YAML `params` are passed through as-is as additional column values.

**When it runs:** Typically when the sender is not already a known item — e.g. first-time visitor whose phone doesn't exist on the board. Often used where other CRMs would use `newOpportunity`.

**Basic**

```yaml
  monday_create_item:
    type: func
    func_type: crm
    func_id: createItem
    on_complete: item_created
    on_failure: item_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| *(any column ID)* | No | Each key is a **monday column ID** and its value is written to that column. See [Column IDs and value formats](#column-ids-and-value-formats) for the expected JSON shape per column type. |

The adapter always sets the phone column (from `crmConfig.phoneColumnId`) to the formatted phone; do not duplicate it in `params` unless you want to override it. The item's display name is always the chat title (`contact.title`).

**Result:** `{ success: true }` on success. The new item's monday ID is **not** exposed on `crmData` — call `getCustomerDetails` afterwards if you need it.

Returns `on_failure` if: required `crmConfig` fields are missing, the phone could not be resolved, or the GraphQL response contains `errors`.

**Advanced — create with text, email, status, and date columns**

Assuming the board has columns with IDs `email`, `status`, `lead_source`, `date`, `notes` (as they'd be auto-assigned from column titles `Email`, `Status`, `Lead Source`, `Date`, `Notes`):

```yaml
  monday_create_item:
    type: func
    func_type: crm
    func_id: createItem
    params:
      email:
        email: "%state:node.ask_email.text%"
        text: "%state:node.ask_email.text%"
      status:
        label: "New lead"
      lead_source: "whatsapp_bot"
      date:
        date: "2026-04-19"
      notes: "Came in via WhatsApp main channel"
    on_complete: item_created
    on_failure: item_failed
```

- `email` is a **nested object** because monday's email column requires `{email, text}`.
- `status` uses `{label: "..."}` — swap to `{index: 1}` once the label ID is known (more resilient to renames).
- `lead_source`, `notes` are plain strings because they're text columns.
- `date` requires `{date: "YYYY-MM-DD"}`.

---

### `getCustomerDetails`

Looks up an item on the board by matching its phone column against the chat's phone. Returns the first match only (`limit: 1`).

**When it runs:** At the start of the flow to identify whether the sender is a known item before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  monday_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|-------|----------|-------|
| `additionalFieldsQuery` | No | GraphQL fragment injected inside the matched item's selection. Overrides `crmConfig.additionalFieldsQuery`. Typical value: `"column_values { id text value }"`. |
| `additionalFieldsVariables` | No | Object of extra GraphQL variables referenced by `additionalFieldsQuery`. Overrides `crmConfig.additionalFieldsVariables`. Each key is declared as `String!`. |

**Result:** On success, `crmData` is populated with:

| `crmData` field | Source |
|-----------------|--------|
| *(all item fields returned by the query)* | Every top-level field fetched on the item is spread directly (`name`, `state`, `relative_link`, `id`, and anything added via `additionalFieldsQuery`). |
| *(each column's `text` by column ID)* | When `additionalFieldsQuery` requests `column_values`, each returned column is flattened so `crmData.<columnId>` = the column's `text`. |
| *(each column's parsed `value` under `<columnId>_value`)* | When a column has a `value` (dropdowns, statuses, etc.), it is JSON-parsed and stored under `crmData.<columnId>_value`. |
| `phone` | Phone used for lookup (see phone-format options above). |
| `id` | `customerData[idColumnId]` if that key exists on the item, else the item's built-in `id`. With the default `idColumnId: "id"` this is always the built-in id. Pointing `idColumnId` at a custom column requires `additionalFieldsQuery` to fetch `column_values` — otherwise the lookup key isn't on the item and the adapter silently falls back to the built-in id. |
| `name` | Item name. |
| `deepLink` | `crmConfig.workspaceUrl` + item `relative_link`. |
| `status` | Initially the item's `state` (which is monday's **lifecycle state** — `"active"` / `"archived"` / `"deleted"` — not a status column value). Then overwritten with the status column's resolved **label text** from a second GraphQL query against `statusColumnId`. If that second query fails or returns no text, `crmData.status` keeps the lifecycle state — so seeing `"active"` here is a sign the status lookup didn't resolve (wrong `statusColumnId`, no label set on the item, or API error). |

Returns `on_failure` if: required `crmConfig` fields are missing, the phone could not be resolved, the GraphQL response contains `errors`, or no item matched the phone.

**Advanced — pulling extra columns onto `crmData`**

```yaml
  monday_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      additionalFieldsQuery: "column_values { id text value }"
    on_complete: known_customer
    on_failure: unknown_customer
```

With the fragment above, every column on the matched item is accessible as `%chat:crmData.<columnId>%` (its text) or `%chat:crmData.<columnId>_value%` (its parsed JSON value — useful for dropdowns, statuses, and other typed columns).

:::tip[Setting `additionalFieldsQuery` once, globally]
If you always want the same extra columns back, put the fragment in `crmConfig.additionalFieldsQuery` during onboarding instead of every YAML call. YAML `params` still override it when present.
:::

---

### `updateItem`

Updates one or more columns on an existing item. Requires that `getCustomerDetails` has already populated `crmData.id`.

**When it runs:** After `getCustomerDetails` — to write back data collected during the conversation (email, notes, a custom field, etc.) to the item.

**Basic**

```yaml
  monday_update_email:
    type: func
    func_type: crm
    func_id: updateItem
    params:
      email:
        email: "%state:node.ask_email.text%"
        text: "%state:node.ask_email.text%"
    on_complete: item_updated
    on_failure: update_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| *(any column ID)* | Yes (in practice) | Each key is a **column ID**; each value is the new column value. See [Column IDs and value formats](#column-ids-and-value-formats) for per-type JSON shapes. The adapter does **not** enforce that params are provided — calling `updateItem` with no `params` sends an empty `column_values: {}` mutation and monday returns success with nothing written. So "no params" silently no-ops rather than failing. |

Internally the adapter bundles all params into monday's `change_multiple_column_values` mutation in a single request. You can update any mix of column types in one call.

**Result:** `{ success: true }` on success. `crmData` is not modified.

Returns `on_failure` if: `crmData.id` is missing (usually because `getCustomerDetails` did not run or did not match), or the GraphQL response contains `errors`.

**Advanced — write back a full profile**

```yaml
  monday_update_profile:
    type: func
    func_type: crm
    func_id: updateItem
    params:
      email:
        email: "%state:node.ask_email.text%"
        text: "%state:node.ask_email.text%"
      city: "%state:node.ask_city.text%"
      interested_in:
        labels:
          - "Plan A" 
          - "Plan B"
      last_contact:
        date: '%time:now("yyyy-MM-dd","ist")%'
    on_complete: profile_saved
    on_failure: save_failed
```

---

### `changeStatus`

Updates the board's **status column** on the current item to a specific label.

**When it runs:** After `getCustomerDetails` — to move the item through its status pipeline (e.g. `New lead` → `Contacted` → `Qualified`).

**Basic**

```yaml
  monday_set_status:
    type: func
    func_type: crm
    func_id: changeStatus
    params:
      crmStatusCode: "Contacted"
    on_complete: status_updated
    on_failure: status_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| `crmStatusCode` | **Yes** | The status **label** to set (e.g. `"Contacted"`). Sent as-is to monday's `change_simple_column_value` mutation, which accepts the label string directly. Use [`crmGetFields`](#crmgetfields) to list the available labels for the configured `statusColumnId`. |

**Result:** `{ success: true }` on success. `crmData` is not modified.

Returns `on_failure` if: `crmStatusCode` is missing, `crmData.id` is missing (usually because `getCustomerDetails` did not run or did not match), or the GraphQL response contains `errors`.

:::warning[Label changes break this call]
`changeStatus` uses the status **label text**, not its numeric index. If a board admin renames the label in monday (e.g. `"Contacted"` → `"First contact"`), every YAML flow referencing the old name starts failing silently. This is a limit of the adapter's mutation wiring: it hard-codes the GraphQL variable as `String!` and uses `change_simple_column_value`, so you can only pass a label string. If you need rename-resilience, use `updateItem` instead and write the status column with `{index: N}`.
:::

---

### `crmGetFields`

Fetches the list of **status labels** configured on the board's status column. Used primarily by Texter's configuration UI (and by anyone debugging `changeStatus`) to see what `crmStatusCode` values are valid.

**When it runs:** Not typically called from bot YAML — it's exposed here for completeness and UI use.

**Basic**

```yaml
  monday_statuses:
    type: func
    func_type: crm
    func_id: crmGetFields
    on_complete: use_statuses
    on_failure: statuses_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| *(none)* | — | No params. |

**Result:** `{ success: true, data: { statuses: [{ name, value }, ...] } }`. Both `name` and `value` in each entry are the label's **text** (e.g. `{ name: "Contacted", value: "Contacted" }`) — the numeric `index` is discarded by the adapter. If you need the index for the `{index: N}` format in `updateItem`, you have to read it from the status column's settings in monday's UI (or query the column's `settings_str` directly). The result is returned in the adapter payload, **not** written to `crmData`.

Returns `on_failure` if: required `crmConfig` fields are missing, or the GraphQL response contains `errors`.

---

## Out of Adapter Scope

The adapter does **not** implement `closeTicket` / `openTicket` — there is no built-in way to push a conversation transcript onto a monday item. If you need that, call monday's [`create_update` mutation](https://developer.monday.com/api-reference/reference/updates) via [`request`](/docs/YAML/Types/Func/System/Request) to post the transcript as an update on the item.

```yaml
  monday_push_update:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://api.monday.com/v2"
      method: post
      json: true
      keepResponse: true
      headers:
        Content-Type: application/json
        Authorization: "YOUR_MONDAY_API_TOKEN"
      data:
        query: "mutation ($itemId: ID!, $body: String!) { create_update(item_id: $itemId, body: $body) { id } }"
        variables:
          itemId: "%chat:crmData.id%"
          body: "<p>WhatsApp transcript: %state:transcript_node.text%</p>"
    on_complete: transcript_pushed
    on_failure: transcript_failed
```

Notes:

- `body` is **HTML** (per monday's [Updates API](https://developer.monday.com/api-reference/reference/updates)). Plain text works, but newlines require `<br/>` or `<p>` tags.
- The `Authorization` header takes the raw monday API token (no `Bearer` prefix ) - same as the token stored in `crmConfig.authToken`.

---

## Monday Onboarding (for Texter Support)

Ask the customer to create a monday API token ([monday docs — Authentication](https://developer.monday.com/api-reference/docs/authentication)) and share the board they want Texter to read/write.

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `authToken` | **Yes** | monday API token. Must have read + write access to the target board. |
| `boardId` | **Yes** | Board ID (from monday's URL or API explorer). |
| `groupId` | **Yes** | Group ID within the board where new items should be created. |
| `phoneColumnId` | **Yes** | Column ID of the phone column on the board. |
| `statusColumnId` | **Yes** | Column ID of the status column on the board. |
| `workspaceUrl` | **Yes** | Workspace URL prefix — used to build deep links to items. |
| `idColumnId` | No | Set only if the customer tracks a business ID in a column and wants that exposed as `crmData.id` instead of monday's internal item id. |
| `useNationalDigits` / `useFullPhoneNumber` | No | Pick whichever matches how phone numbers are stored on the monday phone column. Default (neither set) matches country-formatted digits without `+`. |
| `additionalFieldsQuery` / `additionalFieldsVariables` | Recommended | Set a default `column_values { id text value }` fragment so `getCustomerDetails` always pulls the board's columns onto `crmData`. Agree with the customer which columns they need. |

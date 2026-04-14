---
sidebar_position: 1
---

# Plando

[Plando](https://plando.co.il/) is an Israeli CRM for managing contacts, leads, activities, and documents.

**Official Plando API docs (for deeper reference):**

- [Contact Details API](https://docs.google.com/document/d/1141_JhZJkNQj6DRYBbH7nqgjSgFDv_rkVeursC-5jy0/edit?tab=t.0) — `getCustomerDetails` (`/contact_details`)
- [Lead Form API](https://docs.google.com/document/d/1BvAIX-QkOy25tCDvHyZ2Y7c7z0H_63Lr/edit) — `newOpportunity` (`/contacts/lead_form1`)

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `token` | **Yes** | — | API access key (`access_key`). Required for all operations. |
| `chat` | **Yes** | — | Plando chat ID. Required for `newOpportunity`. |
| `customerId` | No | Customer Texter project ID | Allowes overriding the current project ID with something else. Used in `openTicket`/`closeTicket` — sets `formal_whatsapp_url` to `{customerId}.texterchat.com`. |
| `defaultEmail` | No | — | Fallback agent email for `openTicket`/`closeTicket` when no agent is assigned to the chat. |
| `closeTicketMaxMessagesCount` | No | `30` | Max number of messages to include in the transcript pushed by `openTicket`/`closeTicket`. |
| `failOnMultipleContacts` | No | `false` | If `true`, `getCustomerDetails` returns `on_failure` when the phone matches more than one contact. |
| `statusField` | No | `id` | Plando contact field name whose value is mapped to `crmData.status`. |
| `idField` | No | `id` | Plando contact field name whose value is mapped to `crmData.id`. |
| `attrFields` | No | — | Comma-separated contact attribute field names to request (e.g. `"category_1,category_2"`). Merged with `pullContactByField`, `idField`, `statusField` into the API's `attr` param. |
| `pullContactByField` | No | — | `{ "fieldName": "expectedValue" }`. When set, selects the first contact where `fieldName === expectedValue`. If `expectedValue` is empty, selects the first contact where `fieldName` is non-empty. Falls back to the first contact if none match. |

---

## Adapter functions

### `getCustomerDetails`

Looks up a **contact** in Plando by phone (or other search options).

**When it runs:** At the start of the flow to identify whether the sender is a known contact before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  plando_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

All YAML params (except `phoneNumber`) are forwarded as-is into the API's `search_options` object.

| Param | Notes |
|-------|-------|
| `phoneNumber` | Phone to look up. Defaults to the chat's **formatted channel phone**. |
| `contact_id` | Search by Plando contact ID instead of phone. |
| `contact_mail` | Search by email. |
| `contact_p_id` | Search by personal / national ID. |
| `contact_name` | Search by full name. Per Plando docs: only relevant when `contact_mail` is also present. |
| `from_contact_id` | Return contacts starting from this Plando contact ID. |
| `created_at` | Search contacts created from this datetime (`"YYYY-MM-DD HH:mm"`). |
| `created_at_to` | Upper bound for `created_at` range. |
| `updated_at` | Search contacts updated from this datetime (`"YYYY-MM-DD HH:mm"`). |
| `updated_at_to` | Upper bound for `updated_at` range. |
| `customer_status` | Filter by status. Possible values: `0` = Potential customer, `1` = Customer, `2` = Not interested. Multiple values comma-separated. Only relevant with `updated_at` or `created_at`. |
| `extra_params` | Object `{ field_name: value }` for filtering by a specific contact field. Only relevant with `updated_at` or `created_at`. |
| `input_id` | Set to `1` to return categories and tags by **ID** instead of name. Default `0`. |
| `extra_objects_ids` | Comma-separated type IDs — retrieves extra linked object details. |
| *(attr)* | **Not a YAML param.** Always set by the adapter from `crmConfig.attrFields`, `idField`, `statusField`, and `pullContactByField`. |

**Result:** On success, `crmData` is populated with:

| `crmData` field | Source |
|-----------------|--------|
| *(all contact fields)* | All raw Plando contact fields spread directly (e.g. `first_name`, `last_name`, `category_1`, `category_30`, etc.) |
| `contact_id` | `contact.id` |
| `name` | `first_name + ' ' + last_name` |
| `status` | Value of `crmConfig.statusField` on the contact (default field: `id`) |
| `id` | Value of `crmConfig.idField` on the contact (default field: `id`) |
| `phone` | Phone used for lookup |
| `deepLink` | `https://plando.co.il/contacts/show/{contact.id}` |

Returns `on_failure` if: `token`/`chat` missing from config, phone is unavailable, API returns an error, no contact is found, or `failOnMultipleContacts: true` and multiple contacts match.

**Advanced — lookup by custom phone**

```yaml
  plando_lookup_by_collected_phone:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      phoneNumber: "%state:node.collect_phone.text%"
    on_complete: known_customer
    on_failure: unknown_customer
```

:::tip[Requesting custom attribute fields]
Use `crmConfig.attrFields` to specify which Plando category/attribute fields should be fetched (comma-separated). These are then accessible on `crmData` under their Plando field name.

```yaml
attrFields: "category_1,category_9,category_17,category_30,invoices_archive,last_open_invoice,signed_form"
```

Access them in YAML as `%chat:crmData.category_30%`, `%chat:crmData.last_open_invoice%`, etc.
:::

---

### `newOpportunity`

Creates a new contact/lead in Plando. Can also **update** an existing contact when `updateContact` is set.

**Basic**

```yaml
  plando_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

The adapter always sends `chat` (from `crmConfig.chat`), `access_key` (from `crmConfig.token`), and `no_redirect: 1`. These are not YAML params.

| Param (YAML) | Sent to API as | Required | Code default | Notes |
|--------------|----------------|----------|--------------|-------|
| `name` | `name` | Yes* | Chat title | Full name. *Defaults to chat title if omitted. Can use `contact_first_name` + `contact_last_name` instead. |
| `phoneNumber` | `phone` | No | Formatted phone, digits only | Mobile phone. Formatted channel phone (no dashes) used if omitted. |
| `email` | `email` | No | — | Valid email address. |
| `legacy_id` | `legacy_id` | No | — | External system ID. |
| `is_org` | `is_org` | No | `0` | `1` to create an **organization** instead of a contact. |
| `updateContact` | `update_contact` | No | — | Set to `1` to update an existing contact. Identification requires `id` + at least one of each pair: `phone`/`email`, `name`/`legacy_id`. |
| `id` | `id` | No* | — | *Required when `updateContact` is set. Plando contact ID to update. |
| `approve_mailing` | `approve_mailing` | No | — | `0` to opt the contact out of mailing. |
| `tags` | `tags` | No | — | Keywords, comma-separated. |
| `refer_email` | `refer_email` | No | — | Comma-separated email(s) to notify with lead details. Set to `0` to suppress the notification email. |
| `contact_first_name` | `contact[first_name]` | No | — | First name. Can be used instead of `name`. |
| `contact_last_name` | `contact[last_name]` | No | — | Last name. Can be used instead of `name`. |
| `contact_remark` | `contact[remark]` | No | — | Note / remark. |
| `contact_main_city` | `contact[main_city]` | No | — | City. |
| `contact_main_address` | `contact[main_address]` | No | — | Address. |
| `contact_customer_cat_id` | `contact[customer_cat_id]` | No | — | Customer category ID. `0` = potential customer. Get IDs from Plando item categories. |
| `contact_customer_sales_person_id` | `contact[customer_sales_person_id]` | No | — | Plando system ID of the assigned sales person / team member. |
| `contact_lead_status_cat_id` | `contact[lead_status_cat_id]` | No | — | Numeric ID of the lead process status (from Plando item categories). |
| `contact_lead_origin_cat_id` | `contact[lead_origin_cat_id]` | No | — | Numeric ID of the lead origin source (from Plando item categories). |
| *(any `contact_*`)* | `contact[*]` | No | — | Any custom Plando contact field. E.g. `contact_category_9: "123"` → `contact[category_9]=123`. |
| *(any other param)* | same key | No | — | Any remaining params are passed as-is to the form body. |

**Result:** `{ success: true, crmData: { id: contact_id } }`. The new/updated contact's Plando ID is accessible as `%chat:crmData.id%`.

The op returns `on_failure` if the API responds with `err !== "0"` or does not return a `contact_id`.

**Advanced — new lead with custom category fields**

```yaml
  plando_new_lead_with_fields:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      contact_first_name: "%state:node.ask_name.text%"
      contact_lead_origin_cat_id: "724240"
      contact_lead_status_cat_id: "323140"
      contact_customer_sales_person_id: "4512"
      tags: "whatsapp,bot"
    on_complete: lead_created
    on_failure: lead_failed
```

**Advanced — update existing contact**

```yaml
  plando_update_contact:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      updateContact: 1
      id: "%chat:crmData.contact_id%"
      email: "%state:node.ask_email.text%"
      name: "%chat:crmData.name%"
      contact_lead_status_cat_id: "601305"
    on_complete: contact_updated
    on_failure: update_failed
```

---

### `openTicket` / `closeTicket`

Pushes today's conversation transcript to Plando. Both `openTicket` and `closeTicket` use the **same handler** (`POST /contacts/parse_whatsapp_session`) and behave identically.

**When it runs:** Most commonly triggered **automatically** when an agent resolves a chat (if the integration is configured to do so). Can also be called manually from bot YAML to push a transcript mid-flow.

**Basic**

```yaml
  plando_push_transcript:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
    on_failure: done
```

| Param | Required | Notes |
|-------|----------|-------|
| `email` | No | Override the agent email used as `user_email`. If omitted, uses the assigned agent's email, then falls back to `crmConfig.defaultEmail`. |

**What is sent:**

| Field | Value |
|-------|-------|
| `user_email` | Resolved agent email (see above) |
| `formal_whatsapp_url` | `{customerId}.texterchat.com` |
| `phone` | Formatted channel phone (digits only) |
| `msg` | JSON array of **today's** messages — includes `message` (text), `timestamp`, `from`, `to`, and `media` (with 7-day shared download links for files) |

Returns `on_failure` if: no email can be resolved, `customerId` is missing from config, or the API returns a non-200 result code.

---

## Out of Adapter Scope

The following endpoints are not covered by the adapter. Use the [`request`](/docs/YAML/Types/Func/System/Request) func instead.

### Create activity record on a contact

Log an activity (e.g. "came from Meta ad", "sent template") on an existing Plando contact using a pre-configured record type.

```yaml
  plando_log_activity:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://plando.co.il/contacts/crm_form"
      method: post
      keepResponse: true
      useProxy: true
      headers:
        Content-Type: "application/x-www-form-urlencoded; charset=utf-8"
      data:
        phone: "%chat:channelInfo.id%"
        record[record_type_id]: YOUR_RECORD_TYPE_ID
        access_key: "YOUR_ACCESS_KEY"
        no_redirect: 1
    on_complete: next_node
    on_failure: fallback_node
```

**Contact identification** — provide at least one of: `phone`, `contact_id`, or `email`.

| Field | Required | Notes |
|-------|----------|-------|
| `phone` | One of the three | Contact's phone number. |
| `contact_id` | One of the three | Plando contact ID — available as `%chat:crmData.contact_id%` after `getCustomerDetails`. |
| `email` | One of the three | Contact's email address. |
| `record[record_type_id]` | **Yes** | Activity/record type ID (number). Defined in Plando — get from the customer's Plando account. |
| `access_key` | **Yes** | API token (`crmConfig.token`). |
| `no_redirect` | **Yes** | Always `1`. |
| `record[description]` | No | Free-text description of the activity record. |
| `record[actual_date]` | No | Date of the activity. |
| `record[start_time]` | No | Activity start time. Format: `"dd/mm/yyyy HH:MM"`. |
| `record[end_time]` | No | Activity end time. Format: `"dd/mm/yyyy HH:MM"`. |
| `task_details` | No | Free text attached to the activity (custom per-record notes). |
| `send_email` | No | Set to `1` to send an email notification for this activity. |
| `org_custom_value[field_name]` | No | Pass a custom org field value. Replace `field_name` with the Plando field name. |
| `record_id` | No | Existing Plando record ID. Only needed when updating or deleting a record (used with `mark_to_delete`). |
| `mark_to_delete` | No | Set to `1` to delete the record specified by `record_id`. |

**Response:** On success (`err: "0"`), the API returns `contact_id` and `record_id`. Accessible via `%state:node.plando_log_activity.*%` when `keepResponse: true`.

### Upload a file to a contact

Attach a file to a Plando contact after sharing it with [`shareFile`](/docs/YAML/Types/Func/System/Share%20File).

```yaml
  share_file:
    type: func
    func_type: system
    func_id: shareFile
    params:
      file_node: upload_doc_user
    on_complete: plando_upload_file

  plando_upload_file:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://plando.co.il/api/upload_contact_file"
      method: post
      keepResponse: true
      json: true
      useProxy: true
      headers:
        Content-Type: application/json
        X-Access-Key: "YOUR_ACCESS_KEY"
      data:
        contact_id: "%chat:crmData.contact_id%"
        title: "%state:node.upload_doc_user.text%"
        url: "%state:node.share_file.link%"
    on_complete: upload_done
    on_failure: upload_failed
```

| Field | Notes |
|-------|-------|
| `contact_id` | Contact's Plando ID — available as `%chat:crmData.contact_id%` after `getCustomerDetails`. |
| `title` | Document title shown in Plando. |
| `url` | Shared file URL from the `shareFile` node — use `%state:node.<shareFile_node_name>.link%`. |
| `X-Access-Key` | API token (`crmConfig.token`). |

:::tip
`shareFile` generates a temporary download link valid for **7 days**. Make sure `plando_upload_file` runs immediately after `shareFile` so Plando can fetch the file while the link is still active.
:::

---

## Plando Onboarding (for Texter Support)

Ask the customer to send us the credentials.

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `token` | **Yes** | API access key (`access_key`). Provided by the customer from their Plando account. |
| `chat` | **Yes** | Plando chat ID. Provided by the customer. |
| `customerId` | For `openTicket`/`closeTicket` | Texter tenant subdomain (e.g. `mycompany` → `mycompany.texterchat.com`). |
| `defaultEmail` | For `openTicket`/`closeTicket` (recommended) | Fallback agent email for transcript push. |
| `attrFields` | Recommended | Comma-separated list of contact attribute fields to fetch in `getCustomerDetails`. Agree with the customer which Plando category fields they use. |
| `statusField` | No | Contact field to expose as `crmData.status` in the Texter CRM panel. |
| `idField` | No | Contact field to expose as `crmData.id` in the Texter CRM panel. |
| `pullContactByField` | No | `{ "fieldName": "value" }` — used when multiple contacts can share the same phone and you need to select by a specific field. |
| `failOnMultipleContacts` | No | Set `true` to hard-fail on ambiguous phone matches. |
| `closeTicketMaxMessagesCount` | No | Max messages in transcript. Default `30`. |

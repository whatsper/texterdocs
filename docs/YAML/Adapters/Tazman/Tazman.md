---
sidebar_position: 1
---

# Tazman

[Tazman](https://tazman.co.il/) is a CRM primarily used for managing classes, studios, and educational institutions.

**Official Tazman doc hubs** (For deeper reference):

- [Tazman Extended API Documentation](https://documenter.getpostman.com/view/15160070/2sA3kPoPtZ#b9dd3990-9a5f-4c80-9d01-4eee39668aee)

---

## CRM config (`crmConfig`)

| Field | Required | Use |
|-------|----------|-----|
| `server` | **Yes** | Base URL of the customer's Tazman instance (e.g. `https://app.tazman.co.il`). Used as the prefix for every API call. |
| `token` | **Yes** | Authentication token. V1 sends it in the request body; V2 sends it as an `Authorization: Bearer` header. |
| `apiVersion` | No | Set to `'v2'` to use the new Tazman API for `newOpportunity` (different endpoint, body shape, and auth header). Absent → legacy V1 path. |
| `resultPhoneField` / `resultNameField` / `resultIdField` / `resultStatusField` | No | Lodash paths into the Tazman customer object that remap which raw field powers `crmData.phone`/`name`/`id`/`status`. Defaults: the raw `phone`/`name`/`id`/`state` fields. Can also be overridden per-call as YAML `params` of the same names. |

:::tip[Always use V2 for new customers]
From now on, always include `apiVersion: 'v2'` in `crmConfig` for newly onboarded Tazman customers. The legacy V1 path is retained only for back-compat with already-onboarded customers; new bots should default to V2.
:::

---

## Adapter Functions

### `getCustomerDetails`

Looks up a **customer** by **phone**.

**When it runs:** At the start of the flow to identify the customer before routing.

**Basic**

```yaml
  tazman_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|--------|----------|--------|
| `phoneNumber` | No* | *If omitted, uses the chat’s **formatted channel phone** (when present). |
| `minimalFields` | No | By default `false` - if set to `true` will **exclude** the `additional_fields` param. |

**Result:** Merges mapped fields (`id`, `name`, `phone`, `status` mapped from `state`, `locationId` mapped from `location_id`, and `deepLink`) plus the raw Tazman customer object into `crmData`.

:::tip[Phone retry behavior]
If the first lookup returns nothing, the adapter automatically retries once with all dashes stripped from the phone number before reporting failure.
:::

**Advanced**

```yaml
  tazman_lookup_by_phone:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      phoneNumber: "%state:node.collect_phone.text%"
    on_complete: known_customer
    on_failure: unknown_customer
```

---

### `newOpportunity`

Creates a new lead/client. Most commonly used when the sender is not identified or when capturing lead details.

**When it runs:** When `getCustomerDetails` returns `on_failure` — to register an unknown sender as a lead.

The behavior depends on `crmConfig.apiVersion`:

- **V2** (`apiVersion: 'v2'`) — `POST /manager-api/external/clients` with `Authorization: Bearer ${token}` header. **Recommended for all new customers.**
- **V1** (legacy, no `apiVersion`) — `POST /manager-api/zapier/clients/save` with token + fields in the body. Retained for back-compat with existing customers only.

#### V2 (recommended)

Requires `apiVersion: 'v2'` in `crmConfig`.

**Basic**

```yaml
  tazman_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

| Param | Required | Notes |
|--------|----------|--------|
| `name_f` | No\* | \*First name. If omitted, uses `chat.title`. Must resolve to a non-empty string — the call fails otherwise. |
| `name_s` | No | Last name. |
| `phone` | No\* | \*If omitted, uses chat's formatted phone. |
| `phone2` | No | Secondary phone. |
| `email` | No | |
| `id_num` | No | National ID. |
| `birthday` | No | `YYYY-MM-DD`. |
| `sex` | No | e.g. `male` / `female`. |
| `address` | No | |
| `city_other` | No | |
| `index` | No | Postal index. |
| `fax` | No | |
| `add_sms_phone1` / `add_sms_phone2` | No | Extra phones to register for SMS. |
| `parent_client_id` | No | |
| `location_id` | No | |
| `state_id` | No | Found in Tazman settings > customer state IDs. |
| `password` | No | |
| `comment` | No | |
| `ext_acc_id` | No | External account ID. |
| `tags` | No | Array of `{ tag_id, tag_value }` objects. |
| `additional_fields` | No | Array of `{ field_id, field_value }` objects. |
| `invoice_id_num` / `invoice_name` | No | Invoice details. |

**Result:** Returns the raw Tazman response payload (`response.data.data`) as `crmData`.

**Advanced**

```yaml
  tazman_new_lead_extras:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      name_f: "John"
      name_s: "Doe"
      email: "john.doe@example.com"
      city_other: "Tel Aviv"
      comment: "Lead arriving from WhatsApp bot"
      tags:
        - tag_id: 40612
          tag_value: true
        - tag_id: 40662
          tag_value: true
      additional_fields:
        - field_id: 1
          field_value: "Additional Value 1"
    on_complete: lead_created
    on_failure: lead_failed
```

#### V1 (legacy)

:::warning[Legacy path]
Used by customers onboarded before V2. Set `apiVersion: 'v2'` in `crmConfig` to use the V2 path above. Do not use V1 for new customers.
:::

**Basic**

```yaml
  tazman_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

| Param | Required | Notes |
|--------|----------|--------|
| `phone` | No\* | *If omitted, uses chat **formatted phone**. |
| `first_name` | No* | \*If omitted, uses `chat.title`. |
| `last_name` | No | |
| `email` | No | |
| `phone2` | No | |
| `state_id` | No | Found in Tazman settings > customer state IDs|
| `fax` | No | |
| `gender` | No | e.g., `male` |
| `id_num` | No | |
| `city` | No | |
| `index` | No | |
| `address` | No | |
| `password` | No | |
| `comment` | No | |
| `tags` | No | Object with key-value pairs where the key is the tag ID and the value is its state |
| `additional` | No | Object with key-value pairs where the key is the additional field ID and the value is its state |

**Result:** Success and returns the raw `crmData` response directly from Tazman.

**Advanced**

```yaml
  tazman_new_lead_extras:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      comment: "Lead arriving from WhatsApp bot"
      email: "user@example.com"
      city: "Tel Aviv"
      tags:
        "40612": 1
        "40662": 1
    on_complete: lead_created
    on_failure: lead_failed
```

---

## Tazman Onboarding (for Texter Support)

Message our [contact at Tazman](https://ninja.texterchat.com/contact/whatsapp/972586640430/972533672724/).

**You send:**
- Project ID
- API token with **View** + **Send Template Messages** scopes
- WhatsApp phone number

**Customer DB — `crmConfig` fields**

| Field | Provided by Tazman? | Req / extra | Use |
|-------|-------------|-------------|-----|
| `server` | Yes | Required | Base URL of the customer's Tazman instance (e.g. `https://app.tazman.co.il`) |
| `token` | Yes | Required | Authentication token (sent as `Authorization: Bearer` header for V2, in the body for legacy V1) |
| `apiVersion` | No (set by us) | Required for new customers | Set to `'v2'` for every new Tazman onboarding. Existing customers without this stay on legacy V1. |


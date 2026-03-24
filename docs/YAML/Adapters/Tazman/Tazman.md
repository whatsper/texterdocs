---
sidebar_position: 1
---

# Tazman

[Tazman](https://tazman.co.il/) is a CRM primarily used for managing classes, studios, and educational institutions.

**Official Tazman doc hubs** (For deeper reference):

- [Tazman Extended API Documentation](https://documenter.getpostman.com/view/15160070/2sA3kPoPtZ#b9dd3990-9a5f-4c80-9d01-4eee39668aee)

---

## Adapter Functions

### `getCustomerDetails`

Looks up a **customer** by **phone**.

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
| `phoneNumber` | No\* | \*If omitted, uses the chat’s **formatted channel phone** (when present). |

**Result:** Merges mapped fields (`id`, `name`, `phone`, `status` mapped from `state`, `locationId` mapped from `location_id`, and `deepLink`) plus the raw Tazman customer object into `crmData`.

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

-----

### `newOpportunity`

Creates a new lead/client. Most commonly used when the sender is not identified or when capturing lead details.

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
| `first_name` | No* | \*If omitted, uses **`chat.title`**. |
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

-----

## Out of Adapter Scope

### Extended Customer Lookup

The native adapter `getCustomerDetails` fetches the standard customer object. If you need **extended** client details by requesting `additional_fields: 1`, you must use the `request` node instead of the CRM adapter.

**Endpoint:** `POST https://tazman.co.il/manager-api/external/clients`

**Authorization:** Passed in the JSON body via `token`. You must paste the token directly into your YAML data block, as the `request` node does **not** read CRM config by itself.

**Example:**

```yaml
  tazman_extended_lookup:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://tazman.co.il/manager-api/external/clients"
      method: "post"
      keepResponse: true
      headers:
        Content-Type: "application/json"
      data:
        token: "<tazman_token>"
        phone: "%state:node.collect_phone.text%"
        additional_fields: 1
    on_complete: check_customer_exists
    on_failure: lookup_failed

  check_customer_exists:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: "length > 0"
      length: "%state:node.tazman_extended_lookup.response.data|length%"
    on_complete: customer_found
    on_failure: customer_not_found
```

----

## Tazman Onboarding (for Texter Support)

Message our [contact at Tazman](https://ninja.texterchat.com/contact/whatsapp/972586640430/972533672724/).

**You send:** 
- Project ID
- API token with **View** + **Send Template Messages** scopes
- WhatsApp phone number

**Customer DB — `crmConfig` fields**

| Field | Provided by Tazman? | Req / extra | Use |
|-------|-------------|-------------|-----|
| `token` | Yes | Required | Authentication token injected in the body of requests |


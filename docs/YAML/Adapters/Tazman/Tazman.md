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
| `token` | Yes | Required | Authentication token injected in the body of requests |


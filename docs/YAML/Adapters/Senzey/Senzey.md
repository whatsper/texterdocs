---
sidebar_position: 1
---

# Senzey

[Senzey](https://senzey.com/) is a CRM used for managing leads, clients, and activity logs.

**Official Senzey doc hubs** (For deeper reference):

- [Senzey Contacts API](https://senzey.com/contacts-api)

---

## Adapter Functions

### `getCustomerDetails`

Looks up a contact by phone number.

**When it runs:** At the start of the flow to identify whether the sender is a known contact before routing, and whenever a chat is opened via Texter UI.

**Basic**

```yaml
  senzey_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|--------|----------|--------|
| `phoneNumber` | No* | *If omitted, uses the chat's local phone number. |
| `fields` | No | Extra fields to request beyond the default set (`name,id,user_type,phone,mobile`). Must include a leading comma (e.g., `,email1,address`). Field names match Senzey's internal contact field names. |
| Any other param | No | Forwarded as-is to the Senzey API query. |

**Result:** On success sets `crmData.name`, `crmData.id`, `crmData.phone` (falls back to `mobile`), `crmData.status` (Senzey `user_type`), and `crmData.deepLink`. <br/> 
Any extra fields requested via `fields` are also returned in `crmData` under their Senzey field names (e.g., `crmData.email1`, `crmData.city`). <br/>
Returns `on_failure` if no match found.

**Advanced**

```yaml
  senzey_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      fields: ",email1,address,city"
    on_complete: known_customer
    on_failure: unknown_customer
```

---

### `newOpportunity`

Creates a new client or potential client in Senzey.

**Basic**

```yaml
  senzey_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: client_created
    on_failure: client_failed
```

| Param | Type | Required | Notes |
|--------|------|----------|-------|
| `usePclient` | bool | No | Default `false` — posts to `client/add.php`. Set to `true` to post to `pclient/add.php` (potential client/lead). |
| `x_name` | string | — | Auto-sent from chat title. Override only if needed. |
| `x_phone` | string | — | Auto-sent as formatted phone. Override only if needed. |
| `x_content` | string | — | Auto-sent as conversation messages. Override only if needed. |
| `x_email1` | string | No | Client email. |
| `x_mobile` | string | No | Mobile number. |
| `x_identify_number` | string | No | ID document number. |
| `x_birthday` | date | No | Format: `dd/mm/yyyy`. |
| `x_address` | string | No | Client address. |
| `x_city` | string | No | City. |
| `x_comments` | string | No | Free-text notes. |
| `client_type_label` | string | No | Client category label as configured in Senzey. |
| `client_status_label` | string | No | Client status label as configured in Senzey. |

And more uncommon params can be found in [Senzey API docs](https://senzey.com/contacts-api)

**Result:** Returns `crmData` with the raw Senzey response.

**Advanced**

```yaml
  senzey_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      usePclient: true
      x_email1: "%state:node.ask_email.text%"
      x_comments: "מתעניין חוג"
    on_complete: lead_created
```

---

### `closeTicket`

Logs the conversation as an activity record on the contact.

**When it runs:** When a chat is resolved — records the transcript as an activity on the contact in Senzey.

**Basic**

```yaml
  senzey_close:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
    on_failure: done
```

No params. Automatically sends `x_name`, `x_phone`, the full conversation as `x_content`, and a fixed Hebrew subject (`תיעוד פניה ואטסאפ עסקי`).

**Result:** `success: true` with `lastMessageStoredInCRMTimestamp`.

---

## Senzey Onboarding (for Texter Support)

Message our [contact at Senzey](https://ninja.texterchat.com/contact/whatsapp/972586640430/972539820030/).

**You send:**
- Project ID
- API token with **View + Send Template Messages** scopes
- WhatsApp phone number

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `server` | Yes | Base URL of the customer's Senzey instance (e.g., `https://client.senzey.com`) |
| `username` | Yes | Received from Senzey during onboarding |
| `password` | Yes | Received from Senzey during onboarding |

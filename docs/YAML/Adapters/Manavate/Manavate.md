---
sidebar_position: 1
---

# Manavate

[Manavate](https://www.manavate.com/) is a CRM for managing customers, leads, tickets, and tasks — used primarily by Israeli professional services and trade businesses.

**Official Manavate API docs**: [manavate.com/developers](https://www.manavate.com/developers).

Relevant endpoints:

- `GET /api/customers/get` — `getCustomerDetails`
- `POST /api/leads/create` — `newOpportunity`
- `POST /api/tickets/create` — `openTicket` / `closeTicket`

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `server` | **Yes** | — | Base URL of the customer's Manavate instance (e.g. `https://app.manavate.com`). Trailing slash is added automatically if missing. |
| `token` | **Yes** | — | Manavate API token. Sent as the `auth-token` request header. |

If `server` or `token` is missing, every op returns `on_failure`.

---

## Adapter functions

### `getCustomerDetails`

Looks up a Manavate customer by phone number.

**When it runs:** At the start of the flow to identify whether the sender is a known customer before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  manavate_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

The adapter calls `GET /api/customers/get` with `{ mainContact: { phone: <phone> } }`. Manavate's server-side phone filter is unreliable, so the adapter pulls the response array and **filters again locally**, matching the chat phone (E.164, formatted, and digits-only variants) against both `customer.phone` and `customer.mainContact.cell`.

| Param | Required | Notes |
|-------|----------|-------|
| `phoneNumber` | No | Phone to look up. Defaults to the chat's **formatted channel phone**. |

**Result:** On success, `crmData` is **merged into** the chat's existing `crmData` (existing keys are preserved, then overwritten by the fields below):

| `crmData` field | Source |
|-----------------|--------|
| `id` | Customer `ID` |
| `name` | Customer `name`, or `mainContact.firstName` if `name` is empty |
| `phone` | First non-empty of `customer.phone`, `mainContact.phone`, `mainContact.cell` |
| `email` | Customer `email` |
| `mainContact` | Full `mainContact` object — `{ mail, firstName, lastName, title, phone, email, cell }` |
| `deepLink` | `{server}/customers/details?cid={id}` |
| *(every key of `customFields`)* | Spread directly onto `crmData` under the Manavate custom-field key name |

Returns `on_failure` if: `server`/`token` missing, no phone available, the API does not return an array, or no record matches any of the phone variants.

:::tip[Manavate's server-side phone filter is unreliable]
The adapter is **defensive on purpose** — it asks Manavate to filter by phone, but then refilters locally before picking a result. If you see lookups returning the wrong record, that's a sign Manavate's server-side filter is silently broadening the search; the local refilter should catch it.
:::

**Advanced — lookup by collected phone**

```yaml
  manavate_lookup_by_collected_phone:
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

Creates a new lead in Manavate via `POST /api/leads/create`.

**Basic**

```yaml
  manavate_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

The adapter always sends:

- `firstname` — from `params.name` if provided, otherwise the chat title.
- `phone` — from `params.phoneNumber` if provided, otherwise the chat's digits-only formatted phone.
- `customFields` — object built from any `c_*` params (see below).

| Param (YAML) | Sent to API as | Required | Notes |
|--------------|----------------|----------|-------|
| `name` | `firstname` | No | Defaults to the chat title. |
| `phoneNumber` | `phone` | No | Defaults to the chat's digits-only phone. |
| `c_<fieldName>` | `customFields.<fieldName>` | No | Any param prefixed `c_` is placed inside the `customFields` object. E.g. `c_source: "WhatsApp"` → `customFields.source = "WhatsApp"`. |
| *(any other param)* | same key | No | Forwarded as-is to the top-level lead body. |

**Result:** `crmData` is **merged into** the chat's existing `crmData` with whatever fields Manavate returns from `/api/leads/create`. Returns `on_failure` if the API returns a falsy response.

**Advanced — lead with custom fields and extra top-level keys**

```yaml
  manavate_new_lead_with_fields:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      name: "%state:node.ask_name.text%"
      email: "%state:node.ask_email.text%"
      c_source: "WhatsApp Bot"
      c_campaign: "spring2026"
    on_complete: lead_created
    on_failure: lead_failed
```

`email` is a top-level lead field on Manavate's side (passes through unchanged). `c_source` and `c_campaign` are nested into `customFields`.

---

### `openTicket` / `closeTicket`

Creates a Manavate ticket with the conversation transcript as the description. Both `func_id` names hit the **same handler** (`POST /api/tickets/create`).

**When it runs:** Most commonly triggered **automatically** when an agent resolves a chat. Can also be called manually from bot YAML to record an interaction as a ticket on a known customer mid-flow.

**Basic**

```yaml
  manavate_log_ticket:
    type: func
    func_type: crm
    func_id: closeTicket
    params:
      id: "%chat:crmData.id%"
    on_complete: done
    on_failure: done
```

| Param | Required | Notes |
|-------|----------|-------|
| `id` | No* | Customer ID to associate the ticket with — usually `%chat:crmData.id%` after `getCustomerDetails`. *Not validated by the adapter, but omitting it likely creates an orphan ticket. |
| `name` | No | Ticket name. Defaults to the chat title. |
| `subject` | No | Ticket subject. Defaults to the Hebrew string `תיעוד שיחה מטקסטר`. |

**What is sent:**

| Field | Value |
|-------|-------|
| `id` | `params.id` |
| `name` | `params.name` or chat title |
| `subject` | `params.subject` or `תיעוד שיחה מטקסטר` |
| `description` | Full conversation transcript — each message rendered as `[timestamp] sender:\ntext`, with a new sender/day header inserted whenever the speaker or day changes. Includes agent display names for outgoing messages. |

**Result:** `{ success: true }` — no `crmData` is set. Returns `on_failure` only on exception.

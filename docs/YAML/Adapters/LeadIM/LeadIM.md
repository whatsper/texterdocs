---
sidebar_position: 1
---

# Lead.IM

[Lead.IM](https://lead.im/) is a cloud-based lead management CRM used for capturing and tracking leads from web forms and external sources.

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `lm_form` | Yes | — | Lead.IM form ID. Provided by Lead.IM per form. |
| `lm_key` | Yes | — | Form API key. Provided by Lead.IM per form. |
| `token` | For `getCustomerDetails` lookup | — | `X-LEAD-IM-AUTH` token. Must be requested separately from Lead.IM. |
| `getCustomerDetailsUrl` | For `getCustomerDetails` lookup | — | Lead lookup API endpoint. Must be requested separately from Lead.IM. |
| `nameField` | No | `שם` | Lead.IM field name used as the contact's display name. Change if the customer's form uses a different field name. |
| `onlyDisplayData` | No | `false` | Skip API call and format existing `aid`/`lid` already on the chat. See mode 2 below. |

---

## Adapter Functions

### `getCustomerDetails`

Identifies the contact in Lead.IM. Has two modes depending on `onlyDisplayData` in crmConfig.

**When it runs:** At the start of the flow to identify whether the sender is a known lead before routing, and whenever a chat is opened in the Texter UI.

**Mode 1 — Lookup (default):** Calls `getCustomerDetailsUrl` with `by_phone`. Requires `token` and `getCustomerDetailsUrl` in crmConfig.

**Mode 2 — Display only (`onlyDisplayData: true`):** No API call. Reads `aid`+`lid` (or `pp_aid`+`pp_lid`) already set on the chat's `crmData` and builds display fields from them. Used when Lead.IM pushes lead data into Texter directly.

**Basic**

```yaml
  leadim_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_lead
    on_failure: unknown_lead
```

No params. Phone is taken from the chat automatically.

**Result (lookup mode):** Sets all lead fields on `crmData` keyed by their Lead.IM field name — including Hebrew field names (e.g. `crmData["שם"]`, `crmData["מטפל"]`). Also sets `crmData.id`, `crmData.name` (value of `nameField`), `crmData.phone`, `crmData.deepLink`. Returns `on_failure` if no match.

**Result (display mode):** Sets `crmData.id`, `crmData.name`, `crmData.phone`, `crmData.deepLink` from existing `aid`/`lid`. Returns `on_failure` if no `crmData` present on the chat.

:::tip
Lead.IM field names are often in Hebrew. Use the [`get` transformer](/docs/YAML/Data%20Injection/Transformers#get) to access them safely:
```yaml
input: '%chat:crmData|get("מטפל")%'
```
:::

---

### `openTicket` (Create Lead)

Creates a new lead in Lead.IM.

**When it runs:** When an unknown contact starts a conversation and needs to be registered as a lead.

**Basic**

```yaml
  leadim_open:
    type: func
    func_type: crm
    func_id: openTicket
    on_complete: lead_created
    on_failure: lead_failed
```

This op does **not** accept `params`. It reads from the chat and from specific bot node names:

| Field sent to Lead.IM | Source |
|-----------------------|--------|
| `fld_name` | Chat title — overridden by bot node `lead_get_name` text if collected |
| `fld_phone` | Chat formatted phone |
| `fld_email` | Bot node `lead_get_email` text (empty if not collected) |
| `fld_message` | Outgoing messages only |
| `chat_url` | Auto-built link back to the Texter chat |

To collect name or email before creating the lead, name your prompt nodes `lead_get_name` and `lead_get_email` — the adapter picks them up automatically.

**Result:** `crmData.result` = the new lead ID. Access via `%chat:crmData.result%`.

---

## Out of Adapter Scope

The following are not covered by the adapter. Use the [`request`](/docs/YAML/Types/Func/System/Request) func instead.

### Create lead (flexible)

Use when you need full control over which fields are sent (UTM params, custom fields, etc.).

```yaml
  create_lead:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://api.lead.im/v2/submit"
      method: get
      keepResponse: true
      query:
        lm_form: "YOUR_LM_FORM"
        lm_key: "YOUR_LM_KEY"
        lm_redirect: "no"
        name: "%chat:title%"
        phone: '%chat:phone|formatPhone("smart","IL")%'
        email: "%state:node.ask_email.text%"
        msg: "%state:node.ask_message.text%"
        utm_source: "whatsapp"
    on_complete: update_lead
    on_failure: lead_failed
```

Available fields per Lead.IM API:

| Field | Notes |
|-------|-------|
| `lm_form` | Required. Form ID. |
| `lm_key` | Required. Form key. |
| `lm_redirect` | Set `"no"` to suppress redirect. |
| `name` | Full name. |
| `phone` | Phone number. |
| `email` | Email address. |
| `msg` | Message / notes (up to 3500 chars). |
| `utm_source` | UTM source. |
| `utm_medium` | UTM medium. |
| `utm_campaign` | UTM campaign. |
| `utm_content` | UTM content. |
| `utm_term` | UTM term. |

**Response:** `%state:node.create_lead.response.result%` = new lead ID.

---

### Update lead

Updates custom fields on an existing lead. The update endpoint URL is account-specific — request it from Lead.IM.

```yaml
  update_lead:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://proxy.leadim.xyz/apiproxy/YOUR_ACCOUNT_ID/api/lead_update.ashx"
      method: post
      headers:
        X-LEAD-IM-AUTH: "YOUR_TOKEN"
      data:
        by_id: "%state:node.create_lead.response.result%"
        state_id: "4"
    on_complete: done
    on_failure: update_failed
```

- `by_id` — lead ID from the create step. Use `%chat:crmData.result%` if coming from `openTicket`.

---

## Lead.IM Onboarding (for Texter Support)

Email our [contact at Lead.IM](mailto:michael@lead.im)

This integration is bidirectional — both sides exchange credentials:

**You send:**
- Project ID
- API token with **View + Send Template Messages** scopes

**Lead.IM provides to Texter:**
- `lm_form` and `lm_key` — per form, available in Lead.IM form settings
- `X-LEAD-IM-AUTH` token — provided by Lead.IM per account; needed for lead lookup and update APIs
- `getCustomerDetailsUrl` — lead lookup endpoint; request from Lead.IM when setting up lookup
- Update endpoint URL — account-specific `lead_update.ashx` URL; request from Lead.IM when setting up updates

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `lm_form` | For creating leads | Form ID |
| `lm_key` | For creating leads | Form API key |
| `token` | For lookups/updates | `X-LEAD-IM-AUTH` value — provided by Lead.IM |
| `getCustomerDetailsUrl` | For lookups | Lead lookup endpoint — provided by Lead.IM |
| `nameField` | No | Display name field (default: `שם`) |
| `onlyDisplayData` | No | `true` to skip API call and use existing `aid`/`lid` |

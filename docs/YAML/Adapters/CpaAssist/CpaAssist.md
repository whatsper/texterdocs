---
sidebar_position: 1
---

# CPA Assist

[CPA Assist](https://cpaassist.co.il/) is a practice-management system for Israeli accounting offices, used to manage customers, employees, tasks, and billing.

The adapter is **read-only** — it exposes a single op (`getCustomerDetails`) that looks up a customer by phone against the customer's on-prem CPA Assist instance.

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `server` | **Yes** | — | Base URL of the customer's CPA Assist instance (e.g. `https://cpaassist.example.co.il`). Used as the prefix for the lookup endpoint and the `deepLink`. |
| `useProxy` | No | `true` | Route the request through Texter's HTTP proxy. Leave as default unless the customer's CPA Assist server is directly reachable from Texter's egress IPs. |

The adapter does **not** read or send any API token / username / password from `crmConfig` — auth, if any, is expected to be handled by the network path (proxy + IP allow-listing on the customer's side). If the `server` URL is missing, every op returns `on_failure`.

---

## Adapter functions

### `getCustomerDetails`

Looks up a CPA Assist `customer` by phone number against the customer's on-prem CPA Assist instance.

**When it runs:** At the start of the flow to identify whether the sender is a known customer before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  cpaassist_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

No params. Phone is taken from the chat's channel number, normalized to digits-only, and queried against **both** `phone_1` and `phone_2` columns on the `customer` entity via:

```
GET {server}/CpaAssist/service.jsp?action=ext_q&entity=customer
    &query=phone_1="{phoneNoDash}" or phone_2="{phoneNoDash}"
```

**Result:** On success, `crmData` is populated with:

| `crmData` field | Source |
|-----------------|--------|
| `id` | Customer `id` from the response |
| `name` | Customer `name` |
| `phone` | Digits-only phone that was used in the lookup |
| `status` | `"Active"` if `active === 1`, otherwise `""` |
| `active` | Raw `active` flag from the response (`0` or `1`) |
| `employeeId` | Customer's assigned `employee_id` |
| `deepLink` | `{server}/CpaAssist/customers.jsp?customer_id={id}` |

Returns `on_failure` if: `crmConfig.server` is missing, the request errors, or the response array is empty (no customer matched either phone column).

:::tip[Phone format]
The query uses the **digits-only** form of the channel phone (no `+`, no dashes, no spaces). The customer's CPA Assist columns `phone_1` / `phone_2` need to store phones in the same format for the lookup to match.
:::

:::tip[Only the first match is used]
If multiple customers share the same phone number across `phone_1` / `phone_2`, the adapter takes the first record CPA Assist returns and ignores the rest.
:::

---

## CPA Assist Onboarding (for Texter Support)

CPA Assist runs **on-prem** at each accounting office, so the integration is per-customer. Our contact on the CPA Assist side is **Ronen** — [ronen.cpaassist@gmail.com](mailto:ronen.cpaassist@gmail.com).

**Pre-go-live exchange with Ronen**

Send Ronen:

- Project ID
- Templates IDs
- Template Token

Receive from Ronen:

- **Server IP** — the URL for the customer's CPA Assist instance, used both by this adapter (`crmConfig.server`) **and** in the bot's `sendWebhook` calls.

**Customer DB — `crmConfig` fields**

| Field | Required | Notes |
|-------|----------|-------|
| `server` | **Yes** | Public base URL of the customer's CPA Assist server (provided by Ronen). Texter's egress IPs must be allow-listed at the customer's side. |
| `useProxy` | No | Default `true`. Set to `false` only if the customer can route Texter's egress directly to their server. |


**Templates for approval**

Two partner templates need to be created and submitted for WhatsApp approval. Use the [Templates Import / Export](/docs/templates-import-export) tool, choose **Partner Bundles → CPA Assist**, and import both as-is.

:::caution[`{{4}}` and `{{5}}` are intentionally reversed in `cpaassist_money_approval_1`]
In the template body, `{{5}}` appears **before** `{{4}}` — this is not a typo. Do **not** "fix" the order; CPA data-mapping into the template variables relies on this exact ordering.
:::

**Bot YAML**

Use the [CPA Assist Bot](/docs/YAML/Bot%20Recipes/CPA%20Assist%20Bot) recipe verbatim. Per-customer changes:

Replace `0.0.0.0` in the `url` of both `get_customer_details_money_summary_question_webhook` and `money_summary_approval_get_customer_details` with the server IP Ronen provided. (Same URL each time — keep the path / query / port `:55771` intact.)

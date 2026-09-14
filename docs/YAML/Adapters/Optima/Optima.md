---
sidebar_position: 1
---

# Optima

[Optima](https://calendar.hatosafim.co.il/) is a clinic management system used by medical and paramedical practices to manage patient cards and appointments.

**Official Optima doc hub** (for deeper reference):

- [Optima API docs](https://calendar.hatosafim.co.il/api2/docs#/)

:::info[Read-only adapter]
The adapter currently implements **`getCustomerDetails` only**. Nothing is written back to Optima. Appointment confirmations and cancellations are synced with a `sendWebhook` node instead. See the **[Optima Bot recipe](/docs/YAML/Bot%20Recipes/Optima%20Bot)**.
:::

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `username` | **Yes** | — | Optima API user. Received from Optima during onboarding. |
| `password` | **Yes** | — | Optima API password. Received from Optima during onboarding. |
| `company` | No | `1` | Optima company id. Only needed when the customer runs more than one company in Optima. |
| `requestTimeoutMs` | No | `30000` | Request timeout in milliseconds. |


---

## Adapter Functions

### `getCustomerDetails`

Looks up a patient card by phone number.

**When it runs:** At the start of the flow to identify whether the sender is a known patient before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  optima_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_patient
    on_failure: unknown_patient
```

| Param | Required | Notes |
|-------|----------|-------|
| `phoneNumber` | No* | *If omitted, uses the chat's phone number. |
| `search` | No | Alias for `phoneNumber`. Takes precedence when both are given. |

The value is formatted to the customer's country and stripped to digits before it is sent, so you can pass a number in any format.

**Result:** On success sets `crmData.id` and `crmData.cardId` (both the Optima `CardId`), `crmData.phone` (the phone field that matched) and `crmData.name` (`FullName`, or last name + first name when `FullName` is empty). `name` is omitted when Optima has no name on the card. There is no `deepLink`.

Returns `on_failure` when no patient matches.

:::caution[One match only]
Optima's search can return several cards for the same number. The adapter keeps only cards whose phone matches the looked-up number exactly, and it resolves the contact **only when exactly one card is left**. Two or more matching cards, or a card without a valid numeric `CardId`, route to `on_failure`, so treat that branch as "could not identify", not as "not a patient".
:::

:::tip[Which phone fields are searched]
A match counts when the number equals any of `CellPhone`, `ExPhone`, `ExPhone2`, `HomePhone` or `WorkPhone` on the card. `crmData.phone` holds the field that actually matched, which is not necessarily the mobile number.
:::

---

## Out of Adapter Scope

Everything other than the lookup: creating cards, reading or booking appointments, and writing statuses back. The CRM side panel shows no status list for Optima because the adapter reports none.

Use the [`request`](/docs/YAML/Types/Func/System/Request) func with the [Optima API docs](https://calendar.hatosafim.co.il/api2/docs#/) for endpoints the adapter does not cover, or [`sendWebhook`](/docs/YAML/Types/Func/System/Send%20Webhook) to push a reply back to Optima as the [Optima Bot recipe](/docs/YAML/Bot%20Recipes/Optima%20Bot) does.

---

## Optima Onboarding (for Texter Support)

**Optima provides to Texter:**
- API `username` and `password` for the customer's account
- `company` id, if the customer has more than one company

**Customer DB — `crmConfig` fields**

| Field | Required | Use |
|-------|----------|-----|
| `username` | Yes | Optima API user |
| `password` | Yes | Optima API password |
| `company` | No | Optima company id (default `1`) |
| `requestTimeoutMs` | No | Request timeout in ms (default `30000`) |

Appointment reminder templates for Optima ship as a partner bundle in the Templates tool. See the [Optima Bot recipe](/docs/YAML/Bot%20Recipes/Optima%20Bot) for the reply-sync flow that goes with them.

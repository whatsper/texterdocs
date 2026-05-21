---
sidebar_position: 1
---

# Shopify

[Shopify](https://www.shopify.com/) is an e-commerce platform. The adapter reads **customers and orders** from a Shopify store via the Admin REST API (`2024-07`).

**Official Shopify API docs** (for deeper reference):

- [Customer — `GET /customers.json?phone=`](https://shopify.dev/docs/api/admin-rest/2024-07/resources/customer#get-customers) — `getCustomerDetails`
- [Customer — `GET /customers/{id}/orders.json`](https://shopify.dev/docs/api/admin-rest/2024-07/resources/customer#get-customers-customer-id-orders) — `getActiveOrders`
- [Order — `GET /orders/{id}.json`](https://shopify.dev/docs/api/admin-rest/2024-07/resources/order#get-orders-order-id) — `getOrderDetails` (and the last-order enrichment in `getCustomerDetails`)

---

## CRM config (`crmConfig`)

| Field | Required | Default | Use |
|-------|----------|---------|-----|
| `server` | **Yes** | — | Base URL of the customer's Shopify store (e.g. `https://your-store.myshopify.com`). Used as the prefix for every Admin REST call. |
| `accessToken` | **Yes** | — | Shopify Admin API access token. Sent as the `X-Shopify-Access-Token` header. |
| `storeName` | **Yes** | — | Store handle used **only** to build `crmData.deepLink` (`https://admin.shopify.com/store/{storeName}/customers/{id}`). Lowercased automatically. |

If any of the three fields is missing, the adapter **throws** and the op routes to `on_failure`.

---

## Adapter functions

### `getCustomerDetails`

Looks up a Shopify customer by phone number and enriches the result with the customer's last-order status (if any).

**When it runs:** At the start of the flow to identify whether the sender is a known customer before routing, and whenever a chat is opened in the Texter UI.

**Basic**

```yaml
  shopify_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

The adapter calls `GET /admin/api/2024-07/customers.json?phone={chatPhoneE164}` and takes the **first** customer in the response. If that customer has a `last_order_id`, the adapter also fetches that order via `GET /admin/api/2024-07/orders/{lastOrderId}.json` to determine its open/closed status.

No params. Phone is taken from the chat's channel number in E.164 format.

**Result:** On success, `crmData` is populated with:

| `crmData` field | Source |
|-----------------|--------|
| `id` | Customer `id` |
| `name` | `first_name + " " + last_name` |
| `phone` | Customer `phone`, or `addresses[0].phone` if `phone` is empty |
| `deepLink` | `https://admin.shopify.com/store/{storeName}/customers/{id}` (store handle lowercased) |
| `lastOrderId` | Customer's `last_order_id` — only set when the customer has any orders |
| `status` | Hebrew `ההזמנה סגורה` if the last order has `closed_at` set, otherwise `ההזמנה פתוחה`. Only set when `lastOrderId` exists. |

Returns `on_failure` if: any required `crmConfig` field is missing, the API call errors, or the response has no `customers` field.

:::tip[`status` is hardcoded Hebrew]
`crmData.status` is set to the literal strings `ההזמנה סגורה` ("order closed") or `ההזמנה פתוחה` ("order open"). These are baked into the adapter and are what the Texter CRM panel displays. Match the wording when you compare on it in YAML.
:::

---

### `getActiveOrders`

Lists the customer's active (open) orders. Requires `crmData.id` from a prior `getCustomerDetails`.

**When it runs:** Right after `getCustomerDetails` succeeds, when the bot needs to ask the customer which order they're calling about.

**Basic**

```yaml
  shopify_active_orders:
    type: func
    func_type: crm
    func_id: getActiveOrders
    on_complete: choose_order
    on_failure: no_active_orders
```

The adapter calls `GET /admin/api/2024-07/customers/{crmData.id}/orders.json`. Shopify's default `status` filter is `open`, so this returns active orders only.

No params.

**Result:** `crmData` keeps all existing fields and gains:

| `crmData` field | Source |
|-----------------|--------|
| `amountActiveOrders` | Number of orders returned. |
| `activeOrdersList` | Array of `{ title, id, crm_id }` per order — `title` is Shopify's `order_number`, `id` and `crm_id` are both the Shopify `order.id`. **Only set when `amountActiveOrders > 1`.** When there's exactly one active order, `activeOrdersList` is omitted (only `amountActiveOrders` is set). |

Returns `on_failure` if: `crmData.id` is missing, the API call errors, or the response has no `orders` field.

:::tip[Single-order shortcut]
The adapter intentionally skips building `activeOrdersList` when only one order exists — the assumption is that you'll jump straight to that order rather than show a picker. If you always want the array shape, branch on `amountActiveOrders` in YAML.
:::

---

### `getOrderDetails`

Fetches the **full raw order object** for a given Shopify order ID.

**When it runs:** After the customer has selected an order (e.g. from `activeOrdersList`), to inspect line items, totals, fulfillment status, etc.

**Basic**

```yaml
  shopify_order_details:
    type: func
    func_type: crm
    func_id: getOrderDetails
    params:
      orderId: "%chat:crmData.lastOrderId%"
    on_complete: show_order
    on_failure: order_lookup_failed
```

| Param | Required | Notes |
|-------|----------|-------|
| `orderId` | **Yes** | Shopify order ID (numeric). Typically `%chat:crmData.lastOrderId%` or one of the IDs from `crmData.activeOrdersList`. |

**Result:** `crmData` keeps all existing fields and gains:

| `crmData` field | Source |
|-----------------|--------|
| `orderDetails` | The full raw Shopify `order` object — includes `id`, `order_number`, `line_items`, `total_price`, `closed_at`, `financial_status`, `fulfillment_status`, and everything else Shopify returns. Access nested fields with data injection, e.g. `%chat:crmData.orderDetails.total_price%`. |

Returns `on_failure` if: `params.orderId` is missing, the API call errors, or the response has no `order` field.

---

## Shopify Onboarding (for Texter Support)

Shopify is configured per-store. The customer needs to provide the three `crmConfig` fields from their Shopify Admin:

| Field | Where it comes from |
|-------|---------------------|
| `server` | The store's `*.myshopify.com` URL (e.g. `https://your-store.myshopify.com`). Visible in the customer's Shopify admin URL. |
| `accessToken` | A Shopify **Admin API access token** — the long-lived string the adapter sends as the `X-Shopify-Access-Token` header. The customer mints it by creating a **custom app** in their Shopify admin and granting it the `read_customers` and `read_orders` scopes. Exact menu steps shift over time; see Shopify's [Custom app setup docs](https://help.shopify.com/en/manual/apps/install-setup-apps) for the current path. |
| `storeName` | The store handle that appears in the `admin.shopify.com/store/{storeName}/...` URL when the customer is logged into Shopify admin. Used only for building deeplinks; case doesn't matter (the adapter lowercases it). |

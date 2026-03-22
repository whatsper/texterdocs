---
sidebar_position: 1
---

# Overview

CRM **adapters** are built-in integrations: you call a **`func`** node with `func_type: crm` and a specific **`func_id`** (the **operation**, also referred to as `op`). Texter runs the right HTTP calls to that CRM for your environment, maps responses into **`%chat:crmData%`** / bot state, and routes the flow with `on_complete` / `on_failure`.

This section documents those operations **per CRM**. When the CRM’s public API exposes more than the adapter covers, use the **[`request`](/docs/YAML/Types/Func/System/Request)** function (or webhooks where relevant) and the vendor’s official API docs — see also **[API & External References](/docs/API)**.

___

## How adapter functions work in YAML

```yaml
  <node_name>:
    type: func
    func_type: crm
    func_id: <operation_name>
    params:
      # Operation-specific — see the CRM’s adapter page
    on_complete: <next_node>
    on_failure: <fallback_node>
```

- **`func_type`** is always **`crm`** for adapter calls.
- **`func_id`** is the operation name (e.g. `getCustomerDetails`, `newOpportunity`, `updateLead`).
- **`params`** depend on **both** the operation and the **CRM adapter** implementation.

___

## Parameters vs raw API

Adapter code often **does not** pass your YAML fields straight to the vendor API with identical names:

- Values may be **renamed**, **nested**, or **defaulted** so bot authors work with a smaller, stable set of params.
- Some operations only accept a **fixed list** of params wired in code — extra keys are ignored or rejected until support is added.
- **Always treat the adapter page for that CRM + operation as the source of truth**, not the vendor’s REST field names, unless that page says the passthrough is 1:1.

Per-operation pages will list **required** and **optional** params as implemented in Texter. If something is missing for your use case, it may require a product change or using **`request`** instead.

___

## Connection and environment (one-time setup)

Each customer’s CRM is linked **once** to their Texter environment: base URL, tokens, OAuth, lead sources, org IDs, etc. are stored in Texter’s configuration — **not** in public bot YAML.

- What is required **depends on the CRM** (simple API key vs OAuth with vendor approval, etc.).
- Implementation is usually coordinated with **Texter** during onboarding — not something this public reference can fully prescribe.

Bot YAML only references **behavior** (`func_id`, `params`); it does **not** embed secrets.

___

## When to use an adapter vs `request`

**Use an adapter** (`func_type: crm`) when the operation is implemented for your CRM and documented under **Adapters → &lt;CRM&gt;**, and you want mapped `crmData` and tested behavior.

**Use [`request`](/docs/YAML/Types/Func/System/Request)** when you need an endpoint or fields **not** exposed by the adapter, and you are comfortable building URL, headers, body, and handling responses yourself.

___

## Common operations

Many CRMs share the **same** `func_id` names with similar **intent**, but **`params` and behavior differ** — use each CRM’s page for exact fields and official links.

### `getCustomerDetails`

**Main idea:** Look up whether the person messaging you is a **known contact** in the CRM (registered client).

**When it runs:** Usually by **default phone** — the WhatsApp / channel number the customer used. Texter also runs this when an agent opens a chat: the **CRM panel** in the UI (name, phone, id, status, deeplink, etc.) uses the same lookup. In **bot YAML** you can sometimes pass **extra `params`** (e.g. lookup by national ID) **only if** that adapter supports it.

```yaml
  get_customer_details:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer_flow
    on_failure: unknown_customer_flow
```

### `newOpportunity`

**Main idea:** Create a **new lead / opportunity / case** for the conversation.

**When it runs:** Most often when the sender is **not** identified as an existing contact — e.g. first-time visitor — so the CRM gets a new record. Adapters often allow extra `params` for notes, lead source, email, custom fields, etc.

```yaml
  create_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      source: "whatsapp_bot"
    on_complete: lead_created_step
    on_failure: lead_create_failed
```

### `closeTicket`

**Main idea:** **Push conversation / session data** to the CRM (e.g. last chat session messages) so the interaction is recorded on a ticket or case — **if** the adapter implements it.

**When it runs:** Most often **automatically** when an agent **resolves** a chat and the integration is configured to send the transcript. It is **rarely** used manually in bot YAML; the `func_id` is still useful to recognize in code or logs.

```yaml
  push_transcript_to_crm:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
    on_failure: close_failed
```

___

## CRM-specific docs

Use the **CRM pages** under this folder in the sidebar for **every supported `func_id`**, exact **`params`**, links to official vendor docs, and **`request`** patterns where the adapter does not cover an endpoint.

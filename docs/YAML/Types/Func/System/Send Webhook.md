---
sidebar_position: 5
---


# Send Webhook

:::danger
`sendWebhook` is **legacy**. For new bots, use [Request](./Request) instead — it has more options, cleaner syntax, and better response handling.
:::

### What does it do?
Makes HTTP requests to external URLs. By default, POST requests include the chat `name` (title), `phone` (formatted), `MESSAGES` (last 12 text messages), and `LAST_MESSAGE` in the request body. GET requests automatically exclude all defaults.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      url: "<url value>"
      responseSuccessKey: "success"
      responseDataKey: "ResponseData.posResult.customer"
      headers:
        - "Authorization": "<auth value>"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`sendWebhook`)
- `params.url` the URL to call
- `on_complete` next node

### optional params

#### HTTP method
- `params.getRequest` set to `true` for GET (default is POST)
- `params.putRequest` set to `true` for PUT
- `params.patchRequest` set to `true` for PATCH

#### Request body & headers
- `params.data` request body — key-value pairs; supports data injection
- `params.headers` HTTP headers (array of objects, e.g. `- "Authorization": "Bearer ..."`)
- `params.contentType` set to `"form-data"` for multipart form data
- `params.jsonStringifyKeys` array of keys whose values should be JSON-stringified before sending

#### Default body fields
By default, POST requests include these fields. Set to `false` to exclude:
- `params.name` chat title (set to `false` to exclude)
- `params.phone` formatted phone number (set to `false` to exclude)
- `params.messages` last 12 text messages (set to `false` to exclude)
- `params.lastMessage` last message (set to `false` to exclude)

#### Response handling
- `params.responseSuccessKey` key in the response to check for success (truthy value = success)
- `params.responseDataKey` dot-path to extract from the response and store in state/crmData
- `params.keepResponse` if `true`, stores the full response in bot state
- `params.parseResponseData` parses array response data into choice-compatible format with sub-params:
  - `key` — the array key in the response to parse
  - `id` — field to use as the ID value
  - `title` — field to use as the display title
  - `crm_id` — field to use as the CRM ID
- `params.parseObjectsWithBot` if `true`, processes response data with bot context

#### Files
- `params.injectFiles` array of file references to attach, each with:
  - `node` — the node name that captured the file
  - `key` — (optional) specific file key
  - `filename` — (optional) custom filename

#### Network
- `params.useProxy` if `true`, routes through a fixed proxy IP
- `params.dontRejectUnauthorizedHttps` if `true`, skips TLS certificate verification

#### OAuth
- `params.injectOAuth` injects an OAuth token into the request headers

#### Routing
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### GET request with auth header
```yaml
  get_customer:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      getRequest: true
      url: "https://api.example.com/customers?phone=%chat:phone%"
      responseSuccessKey: "success"
      responseDataKey: "ResponseData.customer"
      headers:
        - "Authorization": "Bearer 12345"
    on_complete: parse_crm
```

### POST to create a lead
```yaml
  open_lead:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      name: false
      messages: false
      lastMessage: false
      firstName: "%state:store.customer.firstName%"
      lastName: "%state:store.customer.lastName%"
      cellPhone: "%chat:phone%"
      interest: "%state:node.new_customer_menu.text%"
      wantedTreatment: "%state:store.treatment%"
      notes: "%state:node.when_to_schedule.text%"
      branch: "%state:store.branchId%"
      status: 53
      url: "https://example.rapid-image.net/api/import/leads"
      headers:
        - Authorization: "RoAuth LeadSource=%state:store.account.leadSource%"
    on_complete: check_if_branches_match
```

### POST excluding all defaults
```yaml
  send_clean_data:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      name: false
      phone: false
      messages: false
      lastMessage: false
      url: "https://api.example.com/data"
      data:
        customField: "value"
    on_complete: next_step
```

### With proxy
```yaml
  proxied_webhook:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      url: "https://api.example.com/data"
      useProxy: true
      getRequest: true
    on_complete: process_response
```

### Parse response data into choice format
```yaml
  get_branches:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      getRequest: true
      url: "https://api.example.com/branches"
      responseSuccessKey: "success"
      parseResponseData:
        key: "data"
        id: "branchId"
        title: "branchName"
        crm_id: "crmBranchId"
      headers:
        - "Authorization": "Bearer token123"
    on_complete: select_branch
```

### Attach files from a previous node
```yaml
  send_document:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      name: false
      messages: false
      lastMessage: false
      url: "https://api.example.com/upload"
      contentType: "form-data"
      injectFiles:
        - node: upload_document
          filename: "document.pdf"
    on_complete: confirm_upload
```

:::tip
Migrate to [Request](./Request) for new bots. `request` supports all HTTP methods, proper `query` params, file uploads, and JSON schema validation of params.
:::

:::danger
`parseResponseData` requires **all three** sub-parameters (`key`, `id`, `title`) to be set, or it fails silently. If you only need to keep the response, use `keepResponse: true` instead.
:::

:::danger
By default, `sendWebhook` includes the chat `name`, `phone`, `MESSAGES` (last 12 text messages), and `LAST_MESSAGE` in POST requests. Set them to `false` explicitly if you don't want them included. GET requests automatically exclude all defaults.
:::

---
sidebar_position: 4
---


# Request

### What does it do?
Makes an HTTP request to an external URL. This is the **modern replacement** for `sendWebhook` with more options and cleaner syntax. Use it for API calls, webhooks, sending templates, updating external systems, etc.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: request
    params:
      url: "<url>"
      method: "<http method>"
      keepResponse: true
      headers:
        Authorization: "API_TOKEN"
      data:
        key: "value"
    on_complete: <next_node>
    on_failure: <fallback_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`request`)
- `params.url` the URL to call

### optional params
- `params.method` HTTP method: `get`, `post`, `put`, `delete`, `patch`, `head`, `options` (default: `get`)
- `params.data` request body (object, array, string, number, or boolean)
- `params.query` query string parameters (object or array) — do not use if URL already contains `?`
- `params.headers` HTTP headers as key-value pairs
- `params.keepResponse` if `true`, stores the full response in bot state at `%state:node.<node_name>.response%` (default: `false`)
- `params.json` if `true`, sends body as JSON
- `params.multipart` if `true`, sends as multipart form data
- `params.files` files to attach (see Files section below)
- `params.maxSendFileSize` max file size in bytes (default: 20 MB)
- `params.useProxy` if `true`, routes through a fixed proxy IP; can also be a proxy URL string
- `params.proxyTimeout` timeout for proxy connections in ms
- `params.rejectUnauthorized` if `false`, skips TLS certificate verification
- `params.parse` response parsing: `"json"`, `"xml"`, `true`, `false`
- `params.open_timeout` connection timeout in ms
- `params.response_timeout` response timeout in ms

### Response access
- `%state:node.<node_name>.statusCode%` — HTTP status code (always available)
- `%state:node.<node_name>.response%` — full response body (only when `keepResponse: true`)

___
## 2. Examples

### POST with JSON body
```yaml
  check_customer_orders:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://n8n.texter.chat/webhook/future-orders"
      method: "post"
      keepResponse: true
      json: true
      data:
        contactId: "%chat:crmData.recordId%"
    on_complete: split_on_amount_of_orders
    on_failure: no_orders
```

### GET with auth header
```yaml
  get_customer_details:
    type: func
    func_type: system
    func_id: request
    params:
      method: 'get'
      keepResponse: true
      url: "https://api.example.com/customers?phone=%chat:channelInfo.id%"
      headers:
        Authorization: "ExternalClient abc123"
    on_complete: check_if_customer_found
```

### POST with Basic auth and proxy
```yaml
  start_get_customer_details:
    type: func
    func_type: system
    func_id: request
    params:
      url: https://example.com/webhook/customer/lookup
      method: 'post'
      rejectUnauthorized: false
      useProxy: true
      keepResponse: true
      json: true
      data:
        phone_number: "%chat:channelInfo.id%"
      headers:
        Authorization: "Basic d2hhdHNhcHB1c2VyOjNyL1JDc2Fp"
    on_complete: switch_by_value_check_if_failed
    on_failure: switch_by_value_check_if_failed
```

### PATCH to update chat display name
```yaml
  change_display_name:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://myenv.texterchat.com/server/api/v2/chats/%chat:_id%"
      method: "patch"
      json: true
      headers:
        Authorization: "Bearer my_api_token"
      data:
        displayName: "%state:node.get_first_name.text% %state:node.get_last_name.text%"
    on_complete: main_menu
```

### Send a WhatsApp template via API
```yaml
  send_template_urgent:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://myenv.texterchat.com/server/api/v2/whatsapp/templates/send"
      method: "post"
      json: true
      headers:
        Authorization: "Bearer my_api_token"
      data:
        templateName: "inbox_utility_66"
        to: "34673494148"
        body:
          - "%chat:channelInfo.id%"
          - "%state:node.elaborate_whats_urgent.text%"
    on_complete: add_urgent_label
    on_failure: add_urgent_label
```

### POST to Google Sheets via n8n
```yaml
  update_new_chat_in_google_sheets:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://n8n.texter.chat/webhook/add-chat-details-to-google-sheets"
      method: "post"
      json: true
      data:
        name: "%chat:title%"
        phone: "%chat:channelInfo.id%"
        departmentId: "%chat:departmentId%"
        labels: "%chat:labels%"
    on_complete: handoff
```

## Files

You can attach files from the Texter file storage to the request:

```yaml
  upload_to_crm:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://api.example.com/upload"
      method: "post"
      json: true
      useProxy: true
      data:
        contact_id: "%chat:crmData.contact_id%"
        title: "%state:node.upload_docs.text%"
      files:
        document:
          id: "%state:node.get_file.fileId%"
          filename: "document.pdf"
    on_complete: upload_complete
```

The `files` object maps field names to objects with:
- `id` — file ID from Texter storage (24-char hex string)
- `filename` — optional custom filename

:::tip
When sending files, `multipart` is automatically enabled. Do not set `multipart: false` when using `files`.
:::

:::danger
Max file size is 20 MB by default. Increase with `maxSendFileSize` only if needed — large files are loaded into memory.
:::

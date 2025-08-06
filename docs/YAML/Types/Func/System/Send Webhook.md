# Send Webhook

### What does it do?
Webhooks enables you to make all kind of requests (http requests)
___
## 1. Syntax
```
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
  on_complete: main_menu
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling
- `params` with subparams
- `on_complete` next function to do after complete (can be either a node or a function)

### optional params
 - `none`

___
## 2. Example
```
send_webhook_example: 
  type: func
  func_type: system
  func_id: sendWebhook
  params:
    getRequest: true
    url: "https://google.com"
    responseSuccessKey: "success"
    responseDataKey: "ResponseData.posResult.customer"
    headers:
      - "Authorization": "Bearer 12345"
  on_complete: main_menu
```
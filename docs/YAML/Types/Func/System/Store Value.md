---
sidebar_position: 2
---


# Store Value

### What does it do?
Saves a key-value pair in the bot's session store (`currentState.store`). Supports dot-notation keys for nested paths (e.g., `key: "customer.name"`) via lodash `set()`. The stored value can be accessed later with `%state:store.<key>%`.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "<key_name>"
      value: "<value_to_save>"
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`storeValue`)
- `params.key` the name under which to store the value
- `params.value` the value to store — can be a string, number, boolean, object, or array; supports data injection
- `on_complete` next node after complete

### optional params
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Store a simple value from a choice node
```yaml
  store_branch_id:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "branchId"
      value: "%state:node.choose_branch.id%"
    on_complete: new_customer_menu
```

### Store a JSON object with customer details
```yaml
  store_initial_customer_details:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value: {"type":"new", "firstName": "%chat:title%", "lastName": "%chat:title%"}
    on_complete: store_default_branch_id
```

### Store a JSON object with collected form data
```yaml
  store_new_customer_details:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value: {"type": "new", "firstName": "%state:node.ask_first_name.text%", "lastName": "%state:node.ask_last_name.text%"}
    on_complete: choose_branch
```

### Store customer type from API response
```yaml
  store_existing_customer_details:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value: {"type": "existing", "firstName": "%state:node.get_customer_details.response.data.0.firstName%", "lastName": "%state:node.get_customer_details.response.data.0.lastName%"}
    on_complete: existing_customer_menu
```

### Store a formatted phone number
```yaml
  store_phone:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customerPhone"
      value: '%chat:phone|formatPhone("smart","IL")|replace("-","","g")%'
    on_complete: next_step
```

### Store treatment selection text
```yaml
  store_chosen_treatment:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "treatment"
      value: "%state:node.general_which_treatment.text%"
    on_complete: when_to_schedule
```

### Store account config (complex object)
```yaml
  store_main_details:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "account"
      value: {"startMsg": "הגעתם ל-yullia", "leadSource": "fu/anaLe9PT...", "accBranchId": "14"}
    on_complete: check_if_from_ad
```

### Store conversation messages (with hbTpl transformer)
```yaml
  abandoned_store_messages:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "messages"
      value: |
        %messages:latest(3,1,"any","text")|hbTpl("
        {{#each .}}
        [{{date timestamp}}] {{#when direction 'eq' 'incoming'}}{{provide 'chat' 'title'}}{{else}}{{agent}}{{/when}}:
        {{text}}

        {{/each}}
        ")%
    on_complete: abandoned_create_new_lead
```

### Store with legacy syntax
```yaml
  store_value_legacy:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "branchId"
      value: "%DATA_BOT_NODE=select_branch.id%"
    on_complete: check_working_hours
```

### Store to a nested path using dot-notation
```yaml
  store_customer_name:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer.firstName"
      value: "%state:node.ask_first_name.text%"
    on_complete: ask_last_name
```

:::tip
Stored values persist for the entire bot session and are accessible at `%state:store.<key>%`. They are also visible in the chat's `botState.store` object.
:::

:::tip
The `key` supports dot-notation (e.g., `"customer.name"`) to set nested paths within the store. This uses lodash `set()` under the hood.
:::

:::tip
The `value` can be a full JSON object — this is useful for storing multiple related fields under one key (e.g. `{"type": "new", "firstName": "..."}`) and accessing them as `%state:store.customer.type%`, `%state:store.customer.firstName%`, etc.
:::

---
sidebar_position: 6
---


# Match Expression

### What does it do?
Evaluates a boolean expression (using [Filtrex](https://github.com/joewalnes/filtrex) syntax) and routes based on the result. If the expression is `true`, goes to `on_complete`. If `false` or empty, goes to `on_failure`. Variables used in the expression are provided as additional params.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: "<filtrex expression>"
      <variable_name>: "<value or data injection>"
    on_complete: <node_if_true>
    on_failure: <node_if_false>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`matchExpression`)
- `params.expression` a Filtrex expression that evaluates to true or false
- `on_complete` node to go to when expression is **true**
- `on_failure` node to go to when expression is **false** or when `expression` is empty/missing

### optional params
- Any additional key-value pairs in `params` — each key becomes a **variable** available inside the expression. Values support data injection.
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Check if a label exists on the chat
```yaml
  start:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'exists(labels) and label in labels'
      label: [ "elinor" ]
      labels: "%chat:labels%"
    on_complete: elinor_handoff_msg
    on_failure: start_parseCrmData
```

### Check if message was sent within last 5 days
```yaml
  check_if_sent_within_5_days:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'lastOutMsgTime > fiveDaysAgo'
      lastOutMsgTime: '%state:store.lastOutMsg.0.timestamp|toString|parseInt%'
      fiveDaysAgo: '%time:now-5d("x")|parseInt%'
    on_complete: mini_bot_bulk_marketing
    on_failure: check_keywords
```

### Check if orders list is empty
```yaml
  check_if_no_orders:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'empty(orders) or orders in ("404","null", " ")'
      orders: '%state:store.ordersCheck%'
    on_complete: no_open_orders_menu
    on_failure: store_open_orders
```

### Check if incoming message is from a Facebook/Instagram ad
```yaml
  check_if_from_ad:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'not empty(special.0.facebook.referral)'
      special: '%messages:latest(1,-1,"in")|column("special")%'
    on_complete: store_social_source
    on_failure: start_image
```

### Compare two values (CRM branch vs user selection)
```yaml
  check_if_branches_match:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: "accountBranch == chosenBranch"
      accountBranch: '%state:store.account.accBranchId%'
      chosenBranch: '%state:store.branchId%'
    on_complete: check_working_hours
    on_failure: refer_customer_to_branch_number
```

### Check if chat was resolved within last week
```yaml
  check_if_last_msg_within_week:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'exists(lastResolvedRaw) and lastResolved > lastWeek'
      lastResolvedRaw: '%chat:resolvedUpdateTime%'
      lastResolved: '%chat:resolvedUpdateTime|toString|parseInt%'
      lastWeek: '%time:now-7d("X")|parseInt%'
    on_complete: handoff
    on_failure: new_customer_menu
```

### Check a numeric threshold
```yaml
  check_order_count:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'count > 0'
      count: '%state:node.get_orders.response.count%'
    on_complete: show_orders
    on_failure: no_orders_message
```

### Validate that user input is a number
```yaml
  check_number:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'isNumber(number) and number > 0'
      number: "%state:node.input_number%"
    on_complete: process_number
    on_failure: invalid_input
```

### Validate input length
```yaml
  check_id_length:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'length == 9'
      length: "%state:node.input_id.text|length%"
    on_complete: valid_id
    on_failure: invalid_id
```

### Validate Israeli phone format
```yaml
  check_phone_format:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'not empty(parsedPhone)'
      parsedPhone: "%state:node.input_phone.text|formatPhone(\"e164\",\"IL\")%"
    on_complete: valid_phone
    on_failure: invalid_phone
```

___
## Available Filtrex functions

| Function | Description |
|----------|-------------|
| `exists(x)` | Returns true if `x` is defined and not null |
| `empty(x)` | Returns true if `x` is empty, null, or undefined |
| `strlen(x)` | Returns the string length of `x` |
| `includes(arr, val)` | Returns true if array `arr` contains `val` |
| `wordCount(x)` | Returns the word count of `x` |
| `startsWith(x, prefix)` | Returns true if `x` starts with `prefix` |
| `isNumber(x)` | Returns true if `x` is a number |

### Operators

| Operator | Description |
|----------|-------------|
| `==`, `!=` | Equality |
| `>`, `<`, `>=`, `<=` | Comparison |
| `and`, `or`, `not` | Logical |
| `in` | Check if value is in array |
| `+`, `-`, `*`, `/` | Arithmetic |

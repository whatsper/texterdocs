# Store Value

### What does it do?
Use this to save values for a latter use.
___
## 1. Syntax
```
<node_name>:
  type: func
  func_type: system
  func_id: storeValue
  params:
    key: "<key_name>"
    value: "<value_to_save>"
  on_complete: <next_function>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling
- `params` that will include key + value subparams
  - `key`
  - `value`
- `on_complete` next function to do after complete (can be either a node or a function)

### optional params
 - `none`

___
## 2. Example
```
store_value:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "branchId"
      value: "%DATA_BOT_NODE=select_branch.id%"
    on_complete: check_working_hours
```
# Add Label

### What does it do?
Allows you to either add/remove or set labels to chat
`add` - adds a label to the current ones
`remove` - removes a label from current labels (if theres one)
`set` - sets labels instead of current ones (can be used to clear labels or set new ones)
___
## 1. Syntax
```
<node_name>:
  type: func
  func_type: chat
  func_id: labels
  params:
    add:
      - "<label id>"
    remove:
      - "<label id>"
    set:
      - "<label id>"
  on_complete: <next function>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling
- `params` with subparams, can use only one, few or all of them
    > each of the following expects label id
    - `add` appends label(s) to current ones
    - `remove` removes label(s) from current ones
    - `set` sets new label(s)
- `on_complete` next function to do after complete (can be either a node or a function)

### optional params
 - `none`

___
## 2. Example
> the following will result in only 1 label: "only_one"
```
add_label:
  type: func
  func_type: chat
  func_id: labels
  params:
    add: 
      - "important"
      - "important2"
    remove:
     - "not_important"
    set:
    - "only_one"
  on_complete: handoff
```
# Check Working Hours

### What does it do?
Checks if we are in working hours (by defined ones)
___
## 1. Syntax
```
<node name>:
  type: func
  func_type: system
  func_id: checkWorkingTime
  on_complete: <on working time node>
  on_failure: <outside working time node>
```
#### must include:
```
working_time:
  <start day>-<end day>: <start time>-<end time>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling
- `on_complete` next function to do if its *in* working hours (can be either a node or a function)
- `on_failure` next function to do if its not in working hours (can be either a node or a function)

### optional params
- `params`: can inclue working time by names (params will include sub parameter "type")
  - `type` sub parameter will choos name
___
## 2. Example
```
working_time:
  sun-thu: 08:00-17:00
```
```
  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: main_menu
    on_failure: outside_working_hours
```
___
```
working_time:
  office:
    sun-thu: 08:00-17:00
  home_department:
    sun-thu: 19:00-20:00
```
```
  check_working_hours_home:
    type: func
    func_type: system
    func_id: checkWorkingTime
    params:
      type: home_department
    on_complete: main_menu
    on_failure: outside_working_hours
```
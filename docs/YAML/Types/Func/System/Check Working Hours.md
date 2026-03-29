---
sidebar_position: 1
---


# Check Working Hours

### What does it do?
Checks if the current time is within defined working hours. Routes to `on_complete` during working hours and `on_failure` outside of them. Sets `userState.workingHours` (boolean) for backward compatibility.

There are three variants:
- **`checkWorkingTime`** — checks the bot-level `working_time` config, with optional `type` param to filter by schedule name
- **`checkDepartmentWorkingTime`** — checks a specific department's working hours by department ID (uses `func_type: department`)
- **`checkWorkingHours`** (legacy) — same behavior as `checkWorkingTime` using the older function name
___
## 1. checkWorkingTime

### Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: checkWorkingTime
    params:
      type: <schedule_name>
    on_complete: <on working time node>
    on_failure: <outside working time node>
```

#### must include at bot level:
```yaml
working_time:
  <schedule_name>:
    <start day>-<end day>: <start time>-<end time>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`checkWorkingTime`)
- `on_complete` next node if it **is** working hours
- `on_failure` next node if it is **not** working hours

### optional params
- `params.type` selects a named working time schedule (when multiple are defined)
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. checkDepartmentWorkingTime

### Syntax
```yaml
  <node_name>:
    type: func
    func_type: department
    func_id: checkWorkingTime
    params:
      department: "<department_id>"
    on_complete: <on working time node>
    on_failure: <outside working time node>
```

### required params
- `type` type of the node
- `func_type` must be `department`
- `func_id` what function are we calling (`checkWorkingTime`)
- `params.department` the department ID whose working hours to check
- `on_complete` next node if the department **is** in working hours
- `on_failure` next node if the department is **not** in working hours

### optional params
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 3. checkWorkingHours (Legacy)

### Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: checkWorkingHours
    on_complete: <on working time node>
    on_failure: <outside working time node>
```

Same behavior as `checkWorkingTime` but uses the older function name. Prefer `checkWorkingTime` for new bots.

___
## 4. working_time Schedule Format

The bot-level `working_time` config maps schedule names to day/time rules.

### Day key formats

| Format | Example | Result |
|--------|---------|--------|
| Single day | `fri` | Friday only |
| Comma list | `sun, tue, thu` | Sunday, Tuesday, Thursday |
| Range (ascending) | `mon-fri` | Monday through Friday |
| Range (wrap-around) | `sat-mon` | Saturday, Sunday, Monday |
| Mixed | `sun-thu, sat` | Sunday–Thursday plus Saturday |

Abbreviations are supported and case-insensitive: `su/sun/sunday`, `mo/mon/monday`, `tu/tue/tuesday`, `we/wed/wednesday`, `th/thu/thursday`, `fr/fri/friday`, `sa/sat/saturday`.

### Time value formats

| Format | Example | Result |
|--------|---------|--------|
| Single range | `08:00-17:00` | One continuous block |
| Multiple ranges | `08:00-12:00, 13:00-17:00` | Two blocks (e.g. lunch break) |
| Minutes optional | `8-17` | Same as `08:00-17:00` |

### Example with mixed formats

```yaml
working_time:
  office:
    sun-thu: 08:00-17:00
    fri: 08:00-14:00
  support:
    sun, tue: 09:00-13:00
    mon, wed-fri: 10:00-12:00, 14:00-16:00
```

___
## 5. Examples

### Basic working hours check
```yaml
# Bot-level config:
working_time:
  office:
    sun-thu: 09:00-18:00
    fri: 09:00-14:00
```
```yaml
  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: main_menu
    on_failure: outside_working_hours
```

### Named schedules (multiple departments)
```yaml
# Bot-level config:
working_time:
  office:
    sun-thu: 08:00-17:00
    fri: 08:00-14:00
  home_department:
    sun-thu: 19:00-20:00
  influencer:
    sun-thu: 09:00-13:00
```
```yaml
  check_working_hours_home:
    type: func
    func_type: system
    func_id: checkWorkingTime
    params:
      type: home_department
    on_complete: main_menu
    on_failure: outside_working_hours
```

### Check a department's working hours
```yaml
  check_support_hours:
    type: func
    func_type: department
    func_id: checkWorkingTime
    params:
      department: "64a1b2c3d4e5f6a7b8c9d0e1"
    on_complete: route_to_support
    on_failure: outside_support_hours
```

### Check before handoff (common pattern)
```yaml
  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: during_working_hours
    on_failure: outside_working_hours

  during_working_hours:
    type: notify
    messages:
      - "תודה"
      - "ניצור קשר בהקדם האפשרי 🙂"
    on_complete: handoff

  outside_working_hours:
    type: notify
    messages:
      - "תודה"
      - "קיבלנו את פנייתך, נחזור אליך בהקדם בשעות הפעילות"
      - ""
      - "אנו פעילים בימים א-ה בין השעות 9:00 ועד 18:00"
      - "ובימי ו' וערבי חג בין השעות 9:00 ועד 14:00"
    on_complete: handoff
```

### Full week schedule
```yaml
working_time:
  office:
    sun-sat: 09:30-18:30
```

:::tip
Without `params.type`, the first schedule (typically `office`) is used by default. Use `params.type` to select a specific named schedule.
:::

:::tip
The customer's default timezone is used when evaluating working hours.
:::

:::danger
The legacy func_id `checkWorkingHours` still works but `checkWorkingTime` is the canonical name. Use `checkWorkingTime` for new bots.
:::

---
sidebar_position: 3
---

# Transformers

Transformers are pipe functions that modify injected data. Chain them after a provider expression using `|`.

```
%provider:path|transformer1(args)|transformer2(args)%
```

:::danger[String arguments must use double quotes]
Transformer arguments **must** use `"` (double quotes), never `'` (single quotes). To avoid breaking the YAML string, wrap the entire value in single quotes:

```yaml
value: '%provider:path|transformer("arg1","arg2")%'
```

If you must use double quotes for the YAML string, escape the inner quotes with `\"`:

```yaml
value: "%provider:path|transformer(\"arg1\",\"arg2\")%"
```
:::

:::danger[No nested data injection]
Data injection does **not** support nesting `%...%` inside another `%...%` expression. Each `%...%` is resolved independently. If you need to use a dynamic value as an argument, store it first with `storeValue` and access it in a separate node.
:::

---

## Quick reference

### String transformers

| Transformer | Description |
|-------------|-------------|
| [`replace`](#replace) | Replace substrings using regex |
| [`trim`](#trim) | Remove leading/trailing whitespace |
| [`split`](#split) | Split a string into an array |
| [`slice`](#slice) | Extract a substring by index |
| [`toUpperCase`](#touppercase) | Convert to uppercase |
| [`toLowerCase`](#tolowercase) | Convert to lowercase |
| [`parseInt`](#parseint) | Parse string to integer |
| [`jsonParse`](#jsonparse) | Parse a JSON string into an object |
| [`parseXml`](#parsexml) | Parse an XML string into an object |
| [`encodeURI`](#encodeuri) | URL-encode a string |
| [`decodeURI`](#decodeuri) | URL-decode a string |
| [`formatPhone`](#formatphone) | Format a phone number |
| [`hasWords`](#haswords) | Check if a string contains any of the given words |

### Array transformers

| Transformer | Description |
|-------------|-------------|
| [`column`](#column) | Extract a field from each item |
| [`join`](#join) | Join items into a string |
| [`map`](#map) | Rename/remap fields in each item |
| [`filter`](#filter) | Keep items matching an expression |
| [`sort`](#sort) | Sort items by field(s) |
| [`reverse`](#reverse) | Reverse the order of items |
| [`flatten`](#flatten) | Flatten nested arrays |

### Date transformers

| Transformer | Description |
|-------------|-------------|
| [`formatDate`](#formatdate) | Format a date value using Luxon |
| [`parseDate`](#parsedate) | Parse a date string into a Date object |

### Mixed / universal transformers

| Transformer | Description |
|-------------|-------------|
| [`length`](#length) | Get length of a string or array |
| [`toString`](#tostring) | Convert any value to a string |
| [`toJson`](#tojson) | Serialize a value to JSON |
| [`typeof`](#typeof) | Get the JavaScript type of a value |
| [`get`](#get) | Access a nested property from an object by path |
| [`pick`](#pick) | Keep only specified keys from an object |
| [`omit`](#omit) | Remove specified keys from an object |
| [`hbTpl`](#hbtpl) | Render a Handlebars template |

---

## String transformers

### formatPhone

Formats a phone number into a specific format.

```
|formatPhone("format", "country")
```

| Argument | Required | Description | Values |
|----------|----------|-------------|--------|
| `format` | Yes | Output format | `"smart"`, `"e164"` |
| `country` | Yes | ISO country code | `"IL"`, `"US"`, etc. |

#### Examples

```yaml
# Smart format — local-style with dashes
value: '%chat:phone|formatPhone("smart","IL")%'
# "972521234567" → "052-123-4567"
```

```yaml
# E.164 international format
value: '%chat:phone|formatPhone("e164","IL")%'
# "052-123-4567" → "+972521234567"
```

```yaml
# Chain with replace to strip dashes
value: '%chat:phone|formatPhone("smart","IL")|replace("-","","g")%'
# "972521234567" → "052-123-4567" → "0521234567"
```

___

### replace

Replaces occurrences of a substring using a regular expression.

```
|replace("search", "replacement", "flags")
```

| Argument | Required | Description |
|----------|----------|-------------|
| `search` | Yes | String or regex pattern to find |
| `replacement` | Yes | String to replace with |
| `flags` | No | Regex flags — `"g"` for global (all occurrences) |

#### Examples

```yaml
# Remove all dashes
value: '%chat:phone|formatPhone("smart","IL")|replace("-","","g")%'
# "052-123-4567" → "0521234567"
```

```yaml
# Strip protocol from URL
value: '%state:node.get_url.response.signed_url|replace("https://","")%'
# "https://storage.example.com/file.pdf" → "storage.example.com/file.pdf"
```

```yaml
# Replace newlines with spaces
value: '%state:node.ask_reason.text|replace("\n"," ","g")%'
# "line one\nline two\nline three" → "line one line two line three"
```

___

### trim

Removes leading and trailing whitespace.

```
|trim
```

Takes no arguments.

#### Example

```yaml
value: "%state:node.user_input.text|trim%"
# "  hello world  " → "hello world"
```

___

### split

Splits a string into an array by a separator.

```
|split("separator")
```

| Argument | Required | Description |
|----------|----------|-------------|
| `separator` | Yes | The delimiter to split on |

#### Examples

```yaml
# Split comma-separated tags into an array
value: '%state:node.ask_tags.text|split(",")%'
# "red,green,blue" → ["red", "green", "blue"]
```

```yaml
# Split by newline
value: '%state:node.ask_address.text|split("\n")%'
# "Street 1\nCity\nCountry" → ["Street 1", "City", "Country"]
```

___

### slice

Extracts a substring by start and end index (like JavaScript `String.slice()`).

```
|slice(start, end)
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `start` | No | `0` | Start index (0-based). Negative values count from the end. |
| `end` | No | string length | End index (exclusive). Negative values count from the end. |

#### Examples

```yaml
# Get first 10 characters
value: "%state:node.long_text.text|slice(0,10)%"
# "0123456789extra" → "0123456789"
```

```yaml
# Get last 4 characters (e.g. last 4 digits)
value: "%chat:phone|slice(-4)%"
# "972521234567" → "4567"
```

```yaml
# Skip the first 3 characters
value: "%state:store.code|slice(3)%"
# "IL-12345" → "12345"
```

___

### toUpperCase

Converts a string to uppercase.

```
|toUpperCase
```

Takes no arguments.

#### Example

```yaml
value: "%state:node.ask_name.text|toUpperCase%"
# "john" → "JOHN"
```

___

### toLowerCase

Converts a string to lowercase.

```
|toLowerCase
```

Takes no arguments.

#### Example

```yaml
value: "%state:node.ask_email.text|toLowerCase|trim%"
# "  John@Email.COM  " → "  john@email.com  " → "john@email.com"
```

___

### parseInt

Converts a string to an integer.

```
|parseInt
```

Takes no arguments.

#### Examples

```yaml
value: "%chat:resolvedUpdateTime|toString|parseInt%"
# "1679500800000" → 1679500800000
```

```yaml
# Get timestamp from 5 days ago as integer
value: '%time:now-5d("x")|parseInt%'
# "1710633600000" → 1710633600000
```

___

### jsonParse

Parses a JSON string into an object. Useful when an API returns JSON as a string field.

```
|jsonParse
```

Takes no arguments.

#### Example

```yaml
value: "%state:store.apiPayload|jsonParse%"
# "{\"name\":\"Alice\",\"age\":30}" → {name: "Alice", age: 30}
```

___

### parseXml

Parses an XML string into a JavaScript object.

```
|parseXml
```

Takes no arguments.

#### Example

```yaml
value: "%state:node.soap_call.response.body|parseXml%"
# "<user><name>Alice</name><age>30</age></user>" → {user: {name: "Alice", age: 30}}
```

___

### encodeURI

URL-encodes a string. Useful when injecting values into query strings.

```
|encodeURI
```

Takes no arguments.

#### Example

```yaml
params:
  url: "https://api.example.com/search?q=%state:node.ask_query.text|encodeURI%"
# "hello world" → "hello%20world"
```

___

### decodeURI

URL-decodes a string. Reverses the effect of [`encodeURI`](#encodeuri).

```
|decodeURI
```

Takes no arguments.

#### Example

```yaml
value: "%state:node.get_callback.response.return_url|decodeURI%"
# "hello%20world%3F" → "hello world?"
```

___

### hasWords

Checks if a string contains **at least one** of the given words. Returns `true` or `false`.

```
|hasWords(["word1","word2"], caseInsensitive)
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `words` | Yes | — | Array of words to search for |
| `caseInsensitive` | No | `false` | Set to `true` for case-insensitive matching |

#### Examples

```yaml
# Check if the user's message contains certain keywords (case insensitive)
value: '%state:node.user_msg.text|hasWords(["cancel","ביטול"],true)%'
# "I want to Cancel my order" → true
```

```yaml
# Case-sensitive check
value: '%state:node.ask_reason.text|hasWords(["URGENT","ASAP"])%'
# "this is urgent" → false (case-sensitive, "urgent" ≠ "URGENT")
# "this is URGENT" → true
```

:::tip
`hasWords` returns a boolean, making it useful as a value in `matchExpression` or `switch` conditions.
:::

---

## Array transformers

### column

Extracts a single field from each object in an array, returning a new array of those values.

```
|column("fieldName")
```

| Argument | Required | Description |
|----------|----------|-------------|
| `fieldName` | Yes | The field to extract from each item |

#### Examples

```yaml
# Get the text of all recent incoming messages
value: '%messages:latest(5,-1,"in")|column("text")%'
# [{text: "hi", ...}, {text: "help", ...}] → ["hi", "help"]
```

```yaml
# Extract order IDs from API response
value: '%state:node.get_orders.response.orders|column("id")%'
# [{id: "A1", name: "Order 1"}, {id: "A2", name: "Order 2"}] → ["A1", "A2"]
```

```yaml
# Get a list of names and join them
value: '%state:store.contacts|column("name")|join(", ")%'
# [{name: "Alice"}, {name: "Bob"}] → ["Alice", "Bob"] → "Alice, Bob"
```

___

### join

Joins array items into a single string with a separator.

```
|join("separator")
```

| Argument | Required | Description |
|----------|----------|-------------|
| `separator` | Yes | String to place between items |

#### Examples

```yaml
# Join with newline
value: '%state:store.items|join("\n")%'
# ["Milk", "Bread", "Eggs"] → "Milk\nBread\nEggs"
```

```yaml
# Join with comma and space
value: '%state:node.get_tags.response.tags|column("name")|join(", ")%'
# [{name: "vip"}, {name: "new"}] → ["vip", "new"] → "vip, new"
```

___

### map

Remaps fields in each object of an array. Creates new objects with renamed keys. Useful for building choice lists from API data.

```
|map("sourceField::targetField", "sourceField2::targetField2", ...)
```

Each argument is a `"source::target"` pair. The `source` is the field name in the original object, and `target` is the field name in the output object.

#### Examples

```yaml
# Map CRM order data into a choice-compatible list
choices: '%state:node.open_orders.response.orders|map("summary::title","Order_ID::id")%'
# [{summary: "Laptop", Order_ID: "A1"}, {summary: "Phone", Order_ID: "A2"}]
# → [{title: "Laptop", id: "A1"}, {title: "Phone", id: "A2"}]
```

:::tip
The `::title` mapping is what appears to the user in a choice list. The `::id` mapping is the value stored when the user selects it.
:::

```yaml
# Map services into choices
choices: '%state:node.get_services.response.services|map("service_name::title","service_id::id")%'
# [{service_name: "Haircut", service_id: "5"}, {service_name: "Color", service_id: "8"}]
# → [{title: "Haircut", id: "5"}, {title: "Color", id: "8"}]
```

___

### filter

Filters an array, keeping only items that match a [Filtrex](https://github.com/joewalnes/filtrex) expression. Multiple expressions act as OR conditions (item matches if **any** expression is true). Non-object items are always excluded.

```
|filter("expression1", "expression2", ...)
```

| Argument | Required | Description |
|----------|----------|-------------|
| `expression` | Yes (at least one) | A Filtrex expression to match against each item |

Supported operators in expressions: `==`, `!=`, `>`, `>=`, `<`, `<=`, `and`, `or`, `not`, plus boolean fields (truthy check).

#### Examples

```yaml
# Keep only active items (truthy check on boolean field)
value: '%state:store.users|filter("active")%'
# [{name: "Alice", active: true}, {name: "Bob", active: false}]
# → [{name: "Alice", active: true}]
```

```yaml
# Numeric comparison
value: '%state:node.get_orders.response.orders|filter("score >= 90")%'
# [{id: 1, score: 85}, {id: 2, score: 92}, {id: 3, score: 95}]
# → [{id: 2, score: 92}, {id: 3, score: 95}]
```

```yaml
# String comparison
value: '%state:store.employees|filter("department == \"Engineering\"")%'
# [{name: "Alice", department: "Engineering"}, {name: "Bob", department: "Sales"}]
# → [{name: "Alice", department: "Engineering"}]
```

```yaml
# Combined conditions with AND
value: '%state:store.users|filter("age > 27 and active")%'
# [{name: "Alice", age: 25, active: true}, {name: "Bob", age: 30, active: false}, {name: "Charlie", age: 35, active: true}]
# → [{name: "Charlie", age: 35, active: true}]
```

```yaml
# Multiple expressions (OR logic) — matches Engineering OR age >= 35
value: '%state:store.employees|filter("department == \"Engineering\"","age >= 35")%'
# [{name: "Alice", age: 25, department: "Engineering"}, {name: "Bob", age: 30, department: "Sales"}, {name: "Charlie", age: 35, department: "Marketing"}]
# → [{name: "Alice", age: 25, department: "Engineering"}, {name: "Charlie", age: 35, department: "Marketing"}]
```

___

### sort

Sorts an array of objects by one or more fields (ascending). Uses [lodash sortBy](https://lodash.com/docs/4.17.15#sortBy) under the hood.

```
|sort("field1", "field2", ...)
```

| Argument | Required | Description |
|----------|----------|-------------|
| `field` | Yes (at least one) | Field name to sort by. Supports dot-notation for nested fields. |

When multiple fields are given, items are sorted by the first field, then ties are broken by the second field, and so on.

#### Examples

```yaml
# Sort orders by date
value: '%state:node.get_orders.response.orders|sort("created_at")%'
# [{id: 3, created_at: "2025-03-01"}, {id: 1, created_at: "2025-01-15"}, {id: 2, created_at: "2025-02-10"}]
# → [{id: 1, created_at: "2025-01-15"}, {id: 2, created_at: "2025-02-10"}, {id: 3, created_at: "2025-03-01"}]
```

```yaml
# Sort by department, then by name within each department
value: '%state:store.employees|sort("department","name")%'
# [{department: "Sales", name: "Zoe"}, {department: "Engineering", name: "Charlie"}, {department: "Engineering", name: "Alice"}]
# → [{department: "Engineering", name: "Alice"}, {department: "Engineering", name: "Charlie"}, {department: "Sales", name: "Zoe"}]
```

:::tip
`sort` always sorts ascending. To get descending order, chain with [`reverse`](#reverse):
```yaml
value: '%state:store.orders|sort("created_at")|reverse%'
# (oldest → newest) → (newest → oldest)
```
:::

___

### reverse

Reverses the order of items in an array.

```
|reverse
```

Takes no arguments.

#### Examples

```yaml
# Get messages oldest-first (reverse the default newest-first)
value: "%messages:latest(10)|reverse%"
# [newest, ..., oldest] → [oldest, ..., newest]
```

```yaml
# Sort descending by combining sort + reverse
value: '%state:store.scores|sort("value")|reverse%'
# [{value: 50}, {value: 80}, {value: 30}] → [{value: 30}, {value: 50}, {value: 80}] → [{value: 80}, {value: 50}, {value: 30}]
```

___

### flatten

Flattens nested arrays to a specified depth.

```
|flatten(depth)
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `depth` | No | `1` | How many levels deep to flatten |

#### Examples

```yaml
# Flatten one level (default)
value: "%state:store.nestedItems|flatten%"
# [[1, 2], [3, 4], [5]] → [1, 2, 3, 4, 5]
```

```yaml
# Flatten deeply nested arrays
value: "%state:store.deeplyNested|flatten(3)%"
# [[[1, 2]], [[3, [4]]]] → [1, 2, 3, 4]
```

---

## Date transformers

### formatDate

Formats a date value (string, number, or Date) into a formatted string using [Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).

```
|formatDate("format", "timezone")
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `format` | No | `"yyyy-MM-dd"` | Luxon format string, or `"iso"` for ISO 8601 |
| `timezone` | No | `"UTC"` | Timezone — IANA name, `"ist"` (alias for `Asia/Jerusalem`), or `"UTC"` |

#### Examples

```yaml
# Format a timestamp from an API response
value: '%state:node.get_appointment.response.date|formatDate("dd/MM/yyyy","ist")%'
# "2025-06-15T10:30:00Z" → "15/06/2025"
```

```yaml
# ISO format
value: '%state:store.createdAt|formatDate("iso")%'
# 1718451000000 → "2025-06-15T10:30:00.000Z"
```

```yaml
# Full date and time in Israel timezone
value: '%state:node.get_event.response.start|formatDate("dd.MM.yyyy HH:mm","ist")%'
# "2025-06-15T10:30:00Z" → "15.06.2025 13:30"
```

```yaml
# Just the time
value: '%state:store.scheduledTime|formatDate("HH:mm","ist")%'
# "2025-06-15T10:30:00Z" → "13:30"
```

:::info
This transformer is different from the `time` provider. Use the `time` provider to get the **current** time with arithmetic (e.g. `%time:now-5d%`). Use `formatDate` to reformat an **existing** date/timestamp value from state or an API response.
:::

___

### parseDate

Parses a date string into a Date object, using a specified format and timezone. Useful when you receive dates in a non-standard format and need to convert them.

```
|parseDate("format", "timezone")
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `format` | No | `"yyyy-MM-dd"` | Luxon format string to parse with, or `"iso"` for ISO 8601 |
| `timezone` | No | `"utc"` | Timezone to interpret the input in — IANA name, `"ist"`, or `"utc"` |

#### Examples

```yaml
# Parse a date string in dd/MM/yyyy format
value: '%state:node.ask_date.text|parseDate("dd/MM/yyyy","ist")%'
# "15/06/2025" → Date(2025-06-14T21:00:00.000Z)
```

```yaml
# Parse an ISO date string
value: '%state:store.dateString|parseDate("iso")%'
# "2025-06-15T10:30:00Z" → Date(2025-06-15T10:30:00.000Z)
```

```yaml
# Parse and then reformat
value: '%state:node.ask_date.text|parseDate("dd/MM/yyyy","ist")|formatDate("yyyy-MM-dd","UTC")%'
# "15/06/2025" → Date → "2025-06-14"
```

---

## Mixed / universal transformers

### length

Returns the length of a string or array.

```
|length
```

Takes no arguments. Works on both strings and arrays.

#### Examples

```yaml
# Check the length of user input (use in matchExpression)
  check_id_length:
    type: func
    func_type: system
    func_id: matchExpression
    params:
      expression: 'length == 9'
      length: "%state:node.ask_id.text|length%"
    on_complete: valid_id
    on_failure: invalid_id
# "123456789" → 9 (matches expression)
# "12345" → 5 (fails expression)
```

```yaml
# Get number of items in an array
value: "%state:node.get_orders.response.orders|length%"
# [{...}, {...}, {...}] → 3
```

```yaml
# Check message length
value: "%state:node.ask_text.text|length%"
# "Hello" → 5
```

___

### toString

Converts any value to its string representation.

```
|toString
```

Takes no arguments.

#### Examples

```yaml
value: "%state:store.lastOutMsg.0.timestamp|toString|parseInt%"
# 1679500800000 → "1679500800000" → 1679500800000
```

```yaml
value: "%chat:resolvedUpdateTime|toString%"
# 1679500800000 → "1679500800000"
```

___

### toJson

Serializes any value to a JSON string.

```
|toJson(prettyPrint)
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `prettyPrint` | No | `false` | Set to `true` for indented (pretty-printed) output |

#### Examples

```yaml
# Serialize an object to a compact JSON string (e.g. for a webhook body)
value: "%state:store.userData|toJson%"
# {name: "Alice", age: 30} → '{"name":"Alice","age":30}'
```

```yaml
# Pretty-print for a readable log or message
value: "%state:node.api_call.response|toJson(true)%"
# {name: "Alice", age: 30} → '{
#   "name": "Alice",
#   "age": 30
# }'
```

___

### typeof

Returns the JavaScript type of the value (`"string"`, `"number"`, `"boolean"`, `"object"`, `"undefined"`, etc.).

```
|typeof
```

Takes no arguments.

#### Examples

```yaml
value: "%state:store.apiResult|typeof%"
# {name: "Alice"} → "object"
# "hello" → "string"
# 42 → "number"
# true → "boolean"
```

---

### get

Accesses a nested property from an object using dot notation or separate path segments (powered by [lodash.get](https://lodash.com/docs/#get)) - Commonly used for when the property name is in Hebrew which breaks regular data injection (can't use `%chat:crmData.סטטוס%` for example). Returns `undefined` if the path does not exist.

```
|get("path")
```

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | Yes (at least one) | Property path string. Use dot notation for nested access (e.g. `"user.name"`) or pass multiple arguments for each segment. |

#### Examples

:::tip[Useful Use Case]

get transformer is useful when you need to access a nested property from a json-string that is returned from an API call.
```yaml
value: '%state:node.api_call.response|jsonParse|get("user.profile.email")|toUpperCase%'
# "{\"user\": {\"profile\": {\"email\": \"a@b.com\"}}}" → "a@b.com" → "A@B.COM"
```
:::

```yaml
# Access a top-level crmData field, even in Hebrew
value: '%chat:crmData|get("סטטוס")%'
# {סטטוס: "active", name: "Alice"} → "active"
```

```yaml
# Access a nested field using dot notation
value: '%state:node.api_call.response|get("user.profile.email")%'
# {user: {profile: {email: "a@b.com"}}} → "a@b.com"
```

```yaml
# Use in switchNode to route on a CRM field value
  route_by_type:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: '%chat:crmData|get("type")%'
      cases:
        "vip": vip_flow
        "regular": regular_flow
      empty: unknown_flow
    on_complete: unknown_flow
```

```yaml
# Access an array element by index
value: '%state:store.items|get("0.name")%'
# [{name: "First"}, {name: "Second"}] → "First"
```

___

### pick

Keeps only the specified keys from an object, discarding everything else (powered by [lodash.pick](https://lodash.com/docs/#pick)).

```
|pick("key1","key2",...)
```

| Argument | Required | Description |
|----------|----------|-------------|
| `key` | Yes (at least one) | Key name to keep. Pass multiple arguments to keep multiple keys. |

#### Examples

```yaml
# Keep only name and email from a CRM response
value: '%state:node.get_contact.response|pick("name","email")%'
# {name: "Alice", email: "a@b.com", internal_id: 99, score: 5} → {name: "Alice", email: "a@b.com"}
```

```yaml
# Trim a crmData object before sending to a webhook
value: '%chat:crmData|pick("id","name","phone")%'
# {id: "123", name: "Alice", phone: "052...", deepLink: "...", status: "2"} → {id: "123", name: "Alice", phone: "052..."}
```

___

### omit

Removes specified keys from an object, keeping everything else (powered by [lodash.omit](https://lodash.com/docs/#omit)).

```
|omit("key1","key2",...)
```

| Argument | Required | Description |
|----------|----------|-------------|
| `key` | Yes (at least one) | Key name to remove. Pass multiple arguments to remove multiple keys. |

#### Examples

```yaml
# Remove internal fields before sending to a webhook
value: '%chat:crmData|omit("deepLink","status")%'
# {id: "123", name: "Alice", deepLink: "https://...", status: "2"} → {id: "123", name: "Alice"}
```

```yaml
# Strip auth fields from an API response before storing
value: '%state:node.login.response|omit("token","refresh_token")%'
# {userId: "5", name: "Alice", token: "abc", refresh_token: "xyz"} → {userId: "5", name: "Alice"}
```

---

## hbTpl

Renders a [Handlebars](https://handlebarsjs.com/) template against the input data. The input must be an object or array.

```
|hbTpl("template", escape, skipNonObject)
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `template` | Yes | — | Handlebars template string |
| `escape` | No | `false` | If `true`, HTML-escapes output. Default (`false`) means no escaping. |
| `skipNonObject` | No | `true` | If `true` (default), returns empty string for non-object inputs instead of throwing an error. |

### Built-in helpers

#### `{{#each .}}` — Iterate

Standard Handlebars iteration over arrays:

```handlebars
{{#each .}}
  {{this.name}}: {{this.value}}
{{/each}}
```

#### `{{date source format timezone}}` — Format dates

Formats a date/timestamp inside the template.

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `source` | Yes | — | Timestamp (string, number, or Date) |
| `format` | No | `"d.L.y, HH:mm:ss"` | Luxon format string |
| `timezone` | No | Customer default timezone | IANA timezone or the customer's configured default |

```handlebars
{{date timestamp}}
{{date timestamp "dd/MM/yyyy"}}
{{date timestamp "HH:mm" "Asia/Jerusalem"}}
```

#### `{{#when left 'op' right}}` — Conditional

Compares two values using an operator.

| Operator | Description |
|----------|-------------|
| `eq` | Equal (`===`) |
| `noteq` | Not equal (`!==`) |
| `gt` | Greater than (numbers only) |
| `gteq` | Greater than or equal (numbers only) |
| `lt` | Less than (numbers only) |
| `lteq` | Less than or equal (numbers only) |
| `or` | Logical OR |
| `and` | Logical AND |
| `%` | Modulo equals zero (numbers only) |

Supports `{{else}}` blocks:

```handlebars
{{#when direction 'eq' 'incoming'}}Customer{{else}}Agent{{/when}}
```

#### `{{provide 'provider' 'key'}}` — Access other providers

Fetches data from any data injection provider inside the template:

```handlebars
{{provide 'chat' 'title'}}
{{provide 'chat' 'phone'}}
```

#### `{{log message data}}` — Debug logging

Logs to the server console (for debugging). Supports an optional `severity` hash parameter.

```handlebars
{{log "Processing item" this severity="debug"}}
```

### Full examples

```yaml
# Format a conversation log from recent messages
value: |
  %messages:latest(5,1,"any","text")|hbTpl("
  {{#each .}}
  [{{date timestamp}}] {{#when direction 'eq' 'incoming'}}{{provide 'chat' 'title'}}{{else}}{{agent}}{{/when}}:
  {{text}}

  {{/each}}
  ")%
# Input: [{direction: "incoming", text: "Hi", timestamp: 1718451000000, ...}, {direction: "outgoing", text: "Hello!", agent: "Support", timestamp: 1718451060000, ...}]
# Output:
# [15.6.2025, 13:30:00] John:
# Hi
#
# [15.6.2025, 13:31:00] Support:
# Hello!
```

```yaml
# Build a summary of order items
value: |
  %state:node.get_order.response.items|hbTpl("
  {{#each .}}
  • {{name}} x{{quantity}} — ₪{{price}}
  {{/each}}
  ")%
# Input: [{name: "Laptop", quantity: 1, price: 3500}, {name: "Mouse", quantity: 2, price: 80}]
# Output:
# • Laptop x1 — ₪3500
# • Mouse x2 — ₪80
```

```yaml
# Conditional content based on status
value: |
  %state:node.check_status.response|hbTpl("
  {{#when status 'eq' 'approved'}}Your request was approved!{{else}}Your request is still pending.{{/when}}
  ")%
# Input: {status: "approved"} → "Your request was approved!"
# Input: {status: "pending"} → "Your request is still pending."
```

---

## Chaining transformers

You can chain multiple transformers left to right. Each transformer receives the output of the previous one:

```yaml
# Format phone → remove dashes
value: '%chat:phone|formatPhone("smart","IL")|replace("-","","g")%'
# "972521234567" → "052-123-4567" → "0521234567"
```

```yaml
# Convert to string → parse as integer
value: "%chat:resolvedUpdateTime|toString|parseInt%"
# 1679500800000 → "1679500800000" → 1679500800000
```

```yaml
# Get timestamp from 5 days ago as integer
value: '%time:now-5d("x")|parseInt%'
# "1710633600000" → 1710633600000
```

```yaml
# Lowercase and trim user input
value: "%state:node.ask_email.text|toLowerCase|trim%"
# "  John@Email.COM  " → "  john@email.com  " → "john@email.com"
```

```yaml
# Sort orders by date descending, extract titles, join
value: '%state:store.orders|sort("date")|reverse|column("title")|join("\n")%'
# [{title: "B", date: "2025-01"}, {title: "A", date: "2025-03"}, {title: "C", date: "2025-02"}]
# → sort → [{title: "B",...}, {title: "C",...}, {title: "A",...}]
# → reverse → [{title: "A",...}, {title: "C",...}, {title: "B",...}]
# → column → ["A", "C", "B"]
# → join → "A\nC\nB"
```

```yaml
# Parse a date from user input, then reformat it for an API
value: '%state:node.ask_date.text|parseDate("dd/MM/yyyy","ist")|formatDate("yyyy-MM-dd","UTC")%'
# "15/06/2025" → Date → "2025-06-14"
```

```yaml
# Filter active users, extract names, join as comma-separated list
value: '%state:store.users|filter("active")|column("name")|join(", ")%'
# [{name: "Alice", active: true}, {name: "Bob", active: false}, {name: "Charlie", active: true}]
# → [{name: "Alice", active: true}, {name: "Charlie", active: true}]
# → ["Alice", "Charlie"]
# → "Alice, Charlie"
```

---
sidebar_position: 7
---


# Keyword Route

### What does it do?
Routes to different nodes based on regex matches against the user's last message. Checks the last message text — including text messages, media captions, and postback payloads — and routes according to the **last** pattern that matches (see [Match order](#match-order)).

**What is tested:** the full text of the **last** inbound message (or caption / postback payload). The pattern must match **somewhere** in that string unless you use anchors (`^` / `$`) to require the whole line to look a certain way.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      <target_node_1>: "<regex pattern>"
      <target_node_2>: "<regex pattern>"
    on_failure: <fallback_node>
```

Always wrap patterns in **double quotes** `"..."` so characters like `|`, `:`, or `*` are not parsed as YAML syntax.

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`keywordsRoute`)
- `params` key-value pairs where each **key** is a destination node name and each **value** is a regex pattern to test against the last message
- `on_failure` node to go to if no pattern matches

### optional params
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

### Match order
Patterns are evaluated in **`params` key order** (the order keys appear in the YAML). Each time a pattern matches, the destination node is updated — so if **more than one** pattern matches the same message, the **last** matching entry wins. Put broader / catch-all patterns **first** and more specific routes **later** if you want the specific route to take priority when both could match.

### Regex reference (JavaScript `RegExp`)
Patterns are passed to `new RegExp(yourPattern)` (no extra flags). Matching is **case-sensitive** unless you build that into the pattern (e.g. `[Ss]ales` or `(sales|Sales)`).

| Construct | Meaning |
|-----------|---------|
| `^` | Start of the string |
| `$` | End of the string |
| `\b` | Word boundary (between word and non-word char) |
| `.` | Any single character (except newline) |
| `*` | Previous token: zero or more |
| `+` | Previous token: one or more |
| `?` | Previous token: zero or one (also makes `+`/`*` non-greedy) |
| Pipe (see note) | Alternation — match left **or** right side of `|` |
| `[abc]` | One character from the set |
| `[^abc]` | One character **not** in the set |
| `[0-9]` `\d` | Digit |
| `\w` | Word character (letter, digit, `_`) |
| `\s` | Whitespace |
| `{n}` `{n,}` `{n,m}` | Exact / at least / between min and max repetitions |
| `()` | Capturing group (here only the pattern matters for `.test()`) |
| `\` | Escape special chars — e.g. `\.` for a literal dot |

:::tip
In regex, **alternation** is the **pipe** character (e.g. `sales|buy`). In YAML, quote the whole pattern (`"sales|buy"`) so `|` is not treated as special YAML syntax.
:::

:::tip
Invalid regex strings are caught; the error is logged and that pattern is skipped — avoid typos in complex patterns.
:::

___
## 2. Examples

### Basic keyword routing
**What it checks:** the last message contains the substring `sales` **or** `buy` **or** `purchase` **or** `pricing` anywhere (same for the other lines). Not whole words unless you add `\b` (see below).

```yaml
  check_keywords:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      sales_menu: "sales|buy|purchase|pricing"
      support_menu: "help|support|issue|problem"
      billing_menu: "bill|invoice|payment"
    on_failure: main_menu
```

### Detect a specific phrase at bot start
**What it checks:** the last message contains that exact Hebrew phrase as a **substring** anywhere (e.g. user pasted a longer sentence that includes it). For a full-line-only match you would add `^` at the start and `$` at the end inside the quotes.

```yaml
  start:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      noop_handoff: "היי, אשמח לדבר עם נציגה מהסניף"
    on_failure: store_initial_customer_details
```

### Instagram/Facebook welcome routing
**What it checks:** last message contains `instagram`, `ig`, or `insta` (first row), or `facebook` / `fb` (second row), as substrings.

```yaml
  instagram_welcome:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      instagram_menu: "instagram|ig|insta"
      facebook_menu: "facebook|fb"
    on_failure: general_welcome
```

### Keywords as first-message filter (template replies)
**What it checks:** same idea — substrings like `interested`, `details`, or `info` (marketing), or `appointment` / `schedule` / `book` (appointment flow).

```yaml
  check_keywords_from_template:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      marketing_flow: "interested|details|info"
      appointment_flow: "appointment|schedule|book"
    on_failure: main_menu
```

### Regex: digits-only message OR greeting at the start
**What it checks:**
- `order_flow`: the **entire** last message is only digits, and at least **5** digits (`^` … `$` = full string). Examples that match: `12345`, `999999`. No letters or spaces.
- `greeting_flow`: the message **starts** with the word `hi`, `hello`, or `hey` (after `^`), followed by a word boundary (`\b`) so `high` does not match `hi`.

```yaml
  check_order_number:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      order_flow: "^[0-9]{5,}$"
      greeting_flow: "^(hi|hello|hey)\\b"
    on_failure: main_menu
```

### Whole words only (not inside longer words)
**What it checks:** the last message contains `yes`, `כן`, or `ok` as **whole words** (`\b` = boundary between “word” and non-word characters). So `yes please` matches; `eyes` does not match `yes` as a whole word.

```yaml
  word_only:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      yes_flow: "\\b(yes|כן|ok)\\b"
    on_failure: ask_again
```

### Phone-like digit sequence (Israeli mobile style)
**What it checks:** last message contains something that looks like an Israeli mobile number: optional `+972` or `0`, then digit `5`, then **8** more digits (9 digits total for the local part). Used to detect if the user pasted a phone in the message.

```yaml
  phone_hint:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      has_phone: "(\\+?972|0)?[5][0-9]{8}"
    on_failure: no_phone
```

### Case variants (no case-insensitive flag)
**What it checks:** substring `Sales` or `sales` (first letter either case) **or** `Buy` or `buy`.

```yaml
  case_sales:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      sales_menu: "[Ss]ales|[Bb]uy"
    on_failure: main_menu
```

### Match order: broader first, specific last (last match wins)
**What it checks:** if the user writes something like `urgent help`, **both** patterns match (contains `help` and `urgent`). Because `urgent_escalation` is listed **second**, that node wins. If they only write `help`, only the first pattern matches.

```yaml
  triage:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      generic_help: "help|support|problem"
      urgent_escalation: "urgent|asap|emergency"
    on_failure: main_menu
```

:::tip
Values are **regex patterns**. Use double quotes `"..."` for every pattern so `|`, `:`, `*`, `^`, and `\` behave correctly in YAML.
:::

:::info
The last message text is sourced from text messages, media captions, and postback payloads. Params are tested in **YAML key order**; **each match overwrites the previous**, so when several patterns match, the **last** matching pattern’s node is used — not the first.
:::

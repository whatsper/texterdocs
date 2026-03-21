---
sidebar_position: 1
---

# Data Injection

Data injection lets you embed dynamic values into any string field in a bot YAML. Instead of hardcoding text, you pull live data from the chat, bot state, CRM, messages, or current time.

___

## Syntax

```
%provider:path%
```

Or with transformers (pipe functions):

```
%provider:path|transformer1(args)|transformer2(args)%
```

### Parts

| Part | Description |
|------|-------------|
| `provider` | Where the data comes from (`chat`, `state`, `messages`, `time`) |
| `path` | Dot-notation path to the specific field |
| `transformer` | Optional pipe function(s) to transform the value |

___

## Quick examples

### Greet the customer by name
```yaml
messages:
  - "Hello %chat:title%, how can we help?"
```

### Use a value collected earlier in the conversation
```yaml
messages:
  - "Nice to meet you, %state:node.ask_name.text%"
```

### Format a phone number
```yaml
value: '%chat:phone|formatPhone("smart","IL")%'
```

### Use the current time
```yaml
value: "%time:now%"
```

### Chain multiple transformers
```yaml
value: "%chat:resolvedUpdateTime|toString|parseInt%"
```

### Multi-line with Handlebars template
```yaml
value: |
  %messages:latest(3,1,"any","text")|hbTpl("
  {{#each .}}
  [{{date timestamp}}] {{#when direction 'eq' 'incoming'}}{{provide 'chat' 'title'}}{{else}}{{agent}}{{/when}}:
  {{text}}

  {{/each}}
  ")%
```

___

## Where can you use data injection?

Anywhere a string value appears in the YAML:

- `messages` (prompt and notify)
- `params` (function parameters — URLs, data payloads, query values)
- `choices` titles
- `caption`, `subject`, `content`
- Inside webhook/request `data` and `headers`

___

## Next steps

- [Providers](./Providers) — full list of data sources
- [Transformers](./Transformers) — all available pipe functions
- [Legacy Syntax](./Legacy%20Syntax) — migrating from `%DATA_CRM%`, `%DATA_BOT_NODE%`, `%DATA_CHAT%`

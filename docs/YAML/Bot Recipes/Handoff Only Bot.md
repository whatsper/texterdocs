---
sidebar_position: 2
---

# Handoff Only Bot

When you don't want a bot at all and just want every conversation forwarded to a human agent — copy the snippet as-is, no changes needed.

```yaml
identifier: handoff-only-bot
apiVersion: v1.1
start_node: start

working_time:
  office:
    sun-thu: 09:00-17:00

prompt_retries: 3

abandoned_bot_settings:
  first_retry:
    timeout: 4
  abandoned:
    timeout: 9
    node: abandoned_bot_sequence

match_messages:
  - 'type in ("text", "media", "postback")'
  - 'special.whatsapp.flow_reply'

nodes:

  abandoned_bot_sequence:
    type: func
    func_type: crm
    func_id: abandonBotLead
    on_complete: handoff

  start:
    type: func
    func_type: system
    func_id: noop
    on_complete: handoff
```

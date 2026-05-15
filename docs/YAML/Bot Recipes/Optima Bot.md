---
sidebar_position: 3
---

# Optima Bot

For Optima integrations — sends a webhook back to Optima to sync the reply to a meeting reminder template (אישור / ביטול).

```yaml
  split_for_mini_bot_meeting:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      אישור: send_webhook_approve_meeting
      ביטול: send_webhook_cancel_meeting
      אישור_הגעה: send_webhook_approve_meeting
      ביטול_תור: send_webhook_cancel_meeting
    on_complete: ask_again
    
  ask_again:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages: 
      - "אנא בחר"
    choices:
      - title: "אישור הגעה"
        on_select: send_webhook_approve_meeting
      - title: "ביטול"
        on_select: send_webhook_cancel_meeting
    on_failure: start
      
  send_webhook_approve_meeting:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      messages: false 
      url: https://calendar.hatosafim.co.il/api/y/texter_webhook/?format=json
      optima_group: "%chat:crmData.is_group%"
      is_username: "%chat:crmData.is_username%"
      sub__group: "%chat:crmData.sub_company%"
      meeting_id: "%chat:crmData.meeting_id%"
      answer: "אישור הגעה"
    on_complete: approve
    
  approve:
    type: notify
    messages:
      - "תודה על אישור הגעתך"
    on_complete: resolved  
    
  send_webhook_cancel_meeting:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      messages: false 
      url: https://calendar.hatosafim.co.il/api/y/texter_webhook/?format=json
      optima_group: "%chat:crmData.is_group%"
      is_username: "%chat:crmData.is_username%"
      sub__group: "%chat:crmData.sub_company%"
      meeting_id: "%chat:crmData.meeting_id%"
      answer: "ביטול הגעה"
    on_complete: resolved
    
  cancel:
    type: notify
    messages:
      - "התור בוטל לבקשתך."
      - "צוות המשרד יצור קשר לקביעת תור חדש."
    on_complete: handoff  
```

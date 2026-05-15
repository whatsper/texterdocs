---
sidebar_position: 4
---

# CPA Assist Bot

The mandatory starter bot when integrating CPA Assist — includes the nodes that the partner templates route to.

```yaml
  start:
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      money_summary_question: יש לי שאלה
      money_summary_approval: לאישור ביצוע
    on_failure: welcome
    on_complete: welcome
    
  welcome:
    type: notify
    messages:
      - "שלום רב, תודה שפנית אלינו"
      - "נשמח לעמוד לרשותך"
    on_complete: check_working_hours    

  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: agent_handoff
    on_failure: outside_working_hours

  cpa_assist_buttons:
    type: func
    func_type: system
    func_id: botStateSplit
    params:
      last_message: true
      לאישור_ביצוע: money_summary_approval
      יש_לי_שאלה: money_summary_question
    on_complete: ask_to_click_buttons  
    
  ask_to_click_buttons:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "לצערי לא הצלחתי להבין את תשובתך"
      - "אנא לחץ/י על אחד מהלחצנים הבאים:"
    choices:
      - title: "לאישור ביצוע"
        on_select: money_summary_approval
      - title: "יש לי שאלה"
        on_select: money_summary_question
    on_failure: on_failure_handoff
    
  money_summary_question:
    type: prompt
    prompt_type: text
    messages:
      - איך אנחנו יכולים לעזור? 
    on_failure: on_failure_handoff
    on_complete: money_summary_question_webhook  
    
  money_summary_question_webhook:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      lastMessage: false
      question: "%DATA_BOT_NODE=money_summary_question%"
      clientPhone: "%DATA_CHAT=clientPhone%"
      url: "%DATA_CRM=deniallUrl%"
      useProxy: true
      message: "יש לי שאלה"
      customerId: "%DATA_CRM=customerId%"
    on_failure: on_failure_handoff
    on_complete: get_customer_details_money_summary_question_webhook  

  get_customer_details_money_summary_question_webhook:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      messages: false  #replace url 0.0.0.0 with customer url
      url: http://0.0.0.0:55771/CpaAssist/service.jsp?action=ext_q&entity=customer&query=phone_1=%22%DATA_CHAT=clientPhoneNoDash%%22%20or%20phone_2=%22%DATA_CHAT=clientPhoneNoDash%%22
      getRequest: true   #CHANGE IP 0.0.0.0 to Customer IP!
      form-data: true
      useProxy: true
      responseDataKey: "*"
    on_failure: on_failure_handoff
    on_complete: money_summary_question_webhook_resolved_message

  money_summary_question_webhook_resolved_message:
    type: notify
    messages:
      - פנייתך התקבלה והועברה לטיפול של צוות המשרד שיצור קשר בהקדם 🙏
    on_complete: resolved
    agent: "%DATA_CRM=employee_id%"


  money_summary_approval:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      lastMessage: false
      clientPhone: "%DATA_CHAT=clientPhone%"
      url: "%DATA_CRM=approvalUrl%"
      message: "לאישור ביצוע"
      customerId: "%DATA_CRM=customerId%"
      useProxy: true
    on_failure: on_failure_handoff
    on_complete: money_summary_approval_get_customer_details     

  money_summary_approval_get_customer_details:
    type: func
    func_type: system
    func_id: sendWebhook
    params:
      messages: false
      url: http://0.0.0.0:55771/CpaAssist/service.jsp?action=ext_q&entity=customer&query=phone_1=%22%DATA_CHAT=clientPhoneNoDash%%22%20or%20phone_2=%22%DATA_CHAT=clientPhoneNoDash%%22
      getRequest: true    #CHANGE IP 0.0.0.0 to Customer IP!
      form-data: true
      useProxy: true
    #   responseSuccessKey: "active"
      responseDataKey: "*"
    on_failure: on_failure_handoff
    on_complete: money_summary_message


  money_summary_message:
    type: notify
    messages:
      - פנייתך התקבלה והועברה לטיפול של צוות המשרד  🙏
    on_complete: resolved        
    agent: "%DATA_CRM=employee_id%"
    
  on_failure_handoff:
    type: notify
    messages:
      - לא הבנתי,🤷🏼‍♀️. העברתי את פנייתך למענה אנושי
      - תודה 🙏🏼
      - ""
      - "*שים לב הודעות התשלום לא אושרה ויש ליצור קשר עם המשרד לאישור*"
    on_complete: handoff
```

## What to change in the existing bot

- In `get_customer_details_money_summary_question_webhook` and `money_summary_approval_get_customer_details`, replace `0.0.0.0` in the `url` with the actual CPA Assist server IP. Get this from [our contact in CPA Assist](mailto:ronen.cpaassist@gmail.com) during onboarding.

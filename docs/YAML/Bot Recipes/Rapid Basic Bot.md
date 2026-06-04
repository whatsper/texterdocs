---
sidebar_position: 5
---

# Rapid Basic Bot

A minimal bot for clinics integrated with Rapid. Greets the customer, looks them up by phone in Rapid, then either shows a short service menu (for existing customers) or opens a new lead and collects a name (for unknown senders). Working-hours check runs before the human handoff so the customer sees a different message in/out of hours.

```yaml
  start:
    type: notify
    messages:
      - "שלום ותודה שפנית אלינו, נשמח לתת לך שירות 😊"
    on_complete: get_customer_details

  get_customer_details:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: existing_client_menu
    on_failure: create_lead

  create_lead:
    type: func
    department: new_lead
    func_type: crm
    func_id: newOpportunity
    on_complete: new_lead_get_name

  existing_client_menu:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "באיזה נושא פנית אלינו היום?"
    choices:
      - title: "תיאום/שינוי תור"
        on_select: schedule_appointment
      - title: "שירות לקוחות"
        on_select: check_working_hours
      - title: "אחר"
        on_select: check_working_hours
    on_failure: agent_handoff

  new_lead_get_name:
    type: prompt
    prompt_type: text
    messages:
      - "אנו שמחים מאוד שהגעת אלינו 😊"
      - "אנא מלא פרטים ונחזור אליך בהקדם."
      - ""
      - "מה שמך?"
    on_complete: check_working_hours

  schedule_appointment:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "מה נדרש?"
    choices:
      - title: "קביעת תור חדש"
        on_select: check_working_hours
      - title: "שינוי תור קיים"
        on_select: check_working_hours
    on_failure: agent_handoff

  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: in_working_hours
    on_failure: outside_working_hours

  in_working_hours:
    type: notify
    messages:
      - "פנייתך הועברה למענה אנושי, ניתן לפרט את מהות הפנייה כעת וניצור קשר בהקדם האפשרי 🙂"
    on_complete: handoff

  outside_working_hours:
    type: notify
    messages:
      - "פנייתך הועברה למענה אנושי אך נציין כי היא התקבלה מחוץ לשעות הפעילות 🙏."
      - "ניתן לפרט את מהות הפנייה כעת וניצור עמך קשר בשעות הפעילות שלנו בימים:"
      - "שעות הפעילות שלנו הן:"
      - "א', ג', ד' 09:00-19:00"
      - "ב', ה' 09:00-17:00"
    on_complete: handoff

  agent_handoff:
    type: notify
    messages:
      - "לא הצלחתי להבין את תגובתך אבל פנייתך הועברה למענה אנושי"
      - "תודה 🙏🏼"
    on_complete: handoff
```

:::tip
This recipe assumes Rapid is already wired up (`crmConfig.server`, `rapid_token`, `leads_token`) so [`getCustomerDetails`](../Adapters/Rapid/Rapid.md#getcustomerdetails) and [`newOpportunity`](../Adapters/Rapid/Rapid.md#newopportunity) work out of the box. See [Rapid Onboarding](../Adapters/Rapid/Rapid.md#rapid-onboarding) for the setup steps.
:::

:::tip
The bot collects the new lead's name into the chat but does **not** push it back to Rapid as a `firstName`. Add an [`updateLead`](../Adapters/Rapid/Rapid.md#updatelead) node after `new_lead_get_name` if you want the name to land on the Rapid lead record.
:::

# Rapid

### What is it?
Rapid is a crm (Customer Relationship Management) that works mostly with clinics

## Unique Functions
```
<node_name>:
  type: func
  func_type: crm
  func_id: getCustomerAppointments
  params:
    customerId: "custom_id" ### defaults to crmData.cardCode
    titleFormat: "{{services}} בתאריך {{date}} בשעה {{time}}"
    idField: "date"
    crmIdField: "time"
  on_complete: <next_action>
```
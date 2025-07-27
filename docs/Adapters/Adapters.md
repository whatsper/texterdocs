# Adapters

Those are basics functions that are in common to all adapters

## Functions
### Customer Details
```
get_customer_details:
  type: func
  func_type: crm
  func_id: getCustomerDetails
  on_complete: <next_node_if_customer>
  on_failure: <next_node_if_not_customer>
```
### New Lead
```
create_new_lead:
  type: func
  func_type: crm
  func_id: newOpportunity
  on_complete: <next_node_if_customer>
```
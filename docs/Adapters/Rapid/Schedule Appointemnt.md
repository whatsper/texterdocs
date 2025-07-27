# Schedule Appointment

### What is it?
A way to schedule an appointment through whatsapp bot

:::tip
After each step
- check count (0 - not found, 1 - no need to ask client to choose)
- store the value that has been selected
:::

### getBranches
```
get_branches:
  type: func
  func_type: crm
  func_id: getBranches
  params:
    branchId : <number> // optional
    branchIdField: "branchID" // optional, default is "branchID"
    branchTitleField: "name" // optional, defualt is "name"
  on_complete: check_branch_count
```

### getDepartments
```
get_departments:
  type: func
  func_type: crm
  func_id: getDepartments
  params:
    branchId: "%DATA_BOT_NODE=select_branch.crm_id%" // optional
    departmentId: <number> // optional
  on_complete: check_department_count
```

### getServices
```
get_services:
  type: func
  func_type: crm
  func_id: getServices
  params:
    departmentId: "%DATA_BOT_NODE=select_department.crm_id%" // optional
    doctorId: "%DATA_BOT_NODE=select_doctor.crm_id%" // optional
  on_complete: check_services_count
```

### getDoctors
```
get_doctors:
      type: func
      func_type: crm
      func_id: getDoctors
      params:
        serviceId: "%DATA_BOT_NODE=select_service.crm_id%" // **mandatory**
      on_complete: check_doctors_count
```

### getAvailableSlots
datesRangeFrom & datesRangeFrom refers to amount of days from TODAY ahead<br />
so for example if you want to get time slots for the following week:<br />
datesRangeFrom: 0<br />
datesRangeTo: 1<br />
```
get_time_slots:
      type: func
      func_type: crm
      func_id: getAvailableSlots
      params:
        serviceId: "%DATA_BOT_NODE=select_service.crm_id%"
        datesRangeFrom: <amount of days to start from>
        datesRangeTo: <amount of days to end>
        departmentId: "%DATA_BOT_NODE=select_department.crm_id%"
        doctorId: "%DATA_BOT_NODE=select_doctor.crm_id%"
        onlyGoodSlots: true // optional
        limit: 2 // optional
        offset: 2 // optional
        serviceDuration: 15 // optional
      on_complete: check_slots_count
```

### scheduleAppointment
```
schedule_appointment:
    type: func
    func_type: crm
    func_id: scheduleAppointment
    params:
      startTime : "%DATA_BOT_NODE=select_slot.startTime%"
      endTime : "%DATA_BOT_NODE=select_slot.endTime%"
      doctorId: "%DATA_BOT_NODE=select_doctor.crm_id%"
      departmentId : "%DATA_BOT_NODE=select_department.crm_id%"
      serviceId : "%DATA_BOT_NODE=select_service.crm_id%"
    on_complete: confirm_message
```
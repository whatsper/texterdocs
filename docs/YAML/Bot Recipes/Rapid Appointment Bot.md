---
sidebar_position: 6
---

# Rapid Appointment Bot

A full appointment-scheduling bot for clinics on [Rapid](../Adapters/Rapid/Rapid.md). It asks who the appointment is for and identifies the patient (the chat's own phone, an explicit phone, or ת.ז), offers a main menu to book a new appointment or view existing ones, then walks branch → department → service → doctor → slot with 0 / 1 / many handling at every step, and books. New patients are only created in Rapid at the moment they confirm a booking, so opting out earlier never leaves a ghost record.

## YAML Code
```yaml
  # ─────────────────────────────────────────────────────────────
  # ① IDENTIFY: ask who the appointment is for, then look the patient up.
  # Three lookups are demonstrated: the chat's own phone (get_customer_details, no params),
  # an explicit phone (get_customer_by_phone), and ת.ז (get_customer_by_id). Failures loop
  # back to the method menu so the patient can retry / switch method / register as new.
  # ─────────────────────────────────────────────────────────────
  start:
    type: notify
    messages:
      - "שלום! 👋 הגעת למערכת תיאום התורים שלנו."
    on_complete: ask_who_for

  ask_who_for:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "עבור מי הפנייה?"
    choices:
      - title: "עבורי"
        on_select: set_subject_self
      - title: "עבור מישהו אחר"
        on_select: set_subject_other
    on_failure: set_subject_self

  # store.subject.who drives later branching (self vs other); store.subject.word adapts prompt wording
  # ("שלך" vs "של המטופל/ת"). Set on both branches so it's always defined.
  set_subject_self:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "subject"
      value:
        who: "self"
        word: "שלך"
    on_complete: get_customer_details

  set_subject_other:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "subject"
      value:
        who: "other"
        word: "של המטופל/ת"
    on_complete: choose_lookup_method

  # Default lookup: the chat's own channel phone.
  get_customer_details:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: store_existing_customer
    on_failure: self_not_found              # this number isn't a patient -> tell them, then identify another way

  self_not_found:
    type: notify
    messages:
      - "לא מצאתי מטופל/ת לפי מספר הטלפון של הצ'אט 🤔"
    on_complete: choose_lookup_method

  # Reached for "someone else", or when the chat's own phone wasn't found. 
  choose_lookup_method:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "איך תרצה/י לזהות את המטופל/ת?"
    choices:
      - title: "לפי מספר טלפון"
        on_select: collect_phone
      - title: "לפי תעודת זהות"
        on_select: collect_id
      - title: "מטופל/ת חדש/ה"
        on_select: new_customer_first_name
    on_failure: lookup_failed

  # Lookup by an explicit phone (e.g. the patient is a different person than the chat owner).
  collect_phone:
    type: prompt
    prompt_type: text
    messages:
      - "מה מספר הטלפון של המטופל/ת?"
    on_complete: get_customer_by_phone
    on_failure: lookup_failed

  get_customer_by_phone:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      phoneNumber: "%state:node.collect_phone.text%"
    on_complete: store_existing_customer
    on_failure: lookup_failed

  # Lookup by national id (ת.ז).
  collect_id:
    type: prompt
    prompt_type: text
    messages:
      - "מה מספר תעודת הזהות של המטופל/ת?"
    on_complete: get_customer_by_id
    on_failure: lookup_failed

  get_customer_by_id:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      idNumber: "%state:node.collect_id.text%"
    on_complete: store_existing_customer
    on_failure: lookup_failed

  # Not found -> retry (re-pick a method), register as new, or (now) reach a representative.
  lookup_failed:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "לא מצאתי מטופל/ת לפי הפרטים שהוזנו 😕"
    choices:
      - title: "לנסות שוב"
        on_select: choose_lookup_method
      - title: "מטופל/ת חדש/ה"
        on_select: new_customer_first_name
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_failure: agent_handoff

  # Known patient: remember a single `customer` object (same shape as a new patient, isNew "false").
  # firstName/lastName/phone come straight from the Rapid customer record spread onto crmData by the lookup.
  store_existing_customer:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value:
        isNew: "false"
        firstName: "%chat:crmData.firstName%"
        lastName: "%chat:crmData.lastName%"
        phone: "%chat:crmData.phone%"
    on_complete: main_menu

  # ─────────────────────────────────────────────────────────────
  # ② MAIN MENU (known patients)
  # ─────────────────────────────────────────────────────────────
  main_menu:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "במה אפשר לעזור?"
    choices:
      - title: "קביעת תור"
        on_select: start_booking_intro
      - title: "התורים שלי"
        on_select: my_appointments
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_failure: agent_handoff

  my_appointments:
    type: func
    func_type: crm
    func_id: getCustomerAppointments
    params:
      showPastAppointments: false   # optional (default false): true also lists past appointments
      titleFormat: "🩺 {{services}}\n🗓 {{startDate}}  ⏰ {{startTime}}\n🏥 {{departmentName}}"   # optional: Handlebars template for each row's title
      # customerId: "..."    # optional: list another patient's appointments (default: crmData.cardCode)
      # idField: "id"        # optional: which appointment field becomes the choice .id (default: id)
      # crmIdField: "id"     # optional: which field becomes the choice .crm_id (default: id)
    on_complete: route_appointments_count
    on_failure: no_appointments

  route_appointments_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.appointments|length%"
      cases:
        "0": no_appointments
        "1": show_one_appointment
      empty: no_appointments
    on_complete: show_many_appointments

  show_one_appointment:
    type: prompt
    prompt_type: choice
    messages:
      - "מצאתי לך תור קיים 📅"
      - '%chat:crmData.appointments|column("title")|join("\n\n")%'
      - ""
      - "איך תרצה/י להמשיך?"
    choices:
      - title: "לקבוע תור נוסף"
        on_select: start_booking_intro
      - title: "לדבר עם נציג"
        on_select: check_working_hours
      - title: "סיימתי, תודה"
        on_select: bot_resolved
    on_failure: agent_handoff

  show_many_appointments:
    type: prompt
    prompt_type: choice
    messages:
      - "יש לך %chat:crmData.appointments|length% תורים קיימים: 📅"
      - '%chat:crmData.appointments|column("title")|join("\n\n")%'
      - ""
      - "איך תרצה/י להמשיך?"
    choices:
      - title: "לקבוע תור נוסף"
        on_select: start_booking_intro
      - title: "לדבר עם נציג"
        on_select: check_working_hours
      - title: "סיימתי, תודה"
        on_select: bot_resolved
    on_failure: agent_handoff

  no_appointments:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "לא נמצאו תורים קיימים על שמך."
      - "לקבוע תור חדש?"
    choices:
      - title: "כן, לקבוע תור"
        on_select: start_booking_intro
      - title: "לדבר עם נציג"
        on_select: check_working_hours
      - title: "סיימתי"
        on_select: bot_resolved
    on_failure: agent_handoff

  # ─────────────────────────────────────────────────────────────
  # ③ NEW PATIENT: collect details, but DON'T create in Rapid yet.
  # The record is created later, only at booking (see route_create_before_book).
  # ─────────────────────────────────────────────────────────────
  new_customer_first_name:
    type: prompt
    prompt_type: text
    messages:
      - "נעים להכיר! נשמח לקבל כמה פרטים-"
      - "מה השם הפרטי %state:store.subject.word%?"
    on_complete: new_customer_last_name
    on_failure: agent_handoff

  new_customer_last_name:
    type: prompt
    prompt_type: text
    messages:
      - "ומה שם המשפחה %state:store.subject.word%?"
    on_complete: route_new_patient_phone
    on_failure: agent_handoff

  # Capture the patient's phone so create AND the post-create re-lookup use the SAME number:
  # self -> the chat's own phone (no question); someone else -> ask for theirs.
  route_new_patient_phone:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%state:store.subject.who%"
      cases:
        "other": new_customer_phone
      empty: store_new_customer_self
    on_complete: store_new_customer_self

  new_customer_phone:
    type: prompt
    prompt_type: text
    messages:
      - "מה מספר הטלפון של המטופל/ת?"
    on_complete: store_new_customer_other
    on_failure: agent_handoff

  # isNew "true" is what route_new_or_existing and route_create_before_book branch on.
  store_new_customer_self:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value:
        isNew: "true"
        firstName: "%state:node.new_customer_first_name.text%"
        lastName: "%state:node.new_customer_last_name.text%"
        phone: "%chat:phone%"
    on_complete: start_booking_intro

  store_new_customer_other:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "customer"
      value:
        isNew: "true"
        firstName: "%state:node.new_customer_first_name.text%"
        lastName: "%state:node.new_customer_last_name.text%"
        phone: "%state:node.new_customer_phone.text%"
    on_complete: start_booking_intro

  # ─────────────────────────────────────────────────────────────
  # ④ ROUTE: new patient goes straight to branches; existing is shown their treatment plans first.
  # ─────────────────────────────────────────────────────────────
  start_booking_intro:
    type: notify
    messages:
      - "מעולה, בוא/י נקבע תור 🗓️"
    on_complete: route_new_or_existing

  route_new_or_existing:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%state:store.customer.isNew%"
      cases:
        "true": get_branches          # new patient: no cardCode, so no plans. Go straight to branches.
      empty: check_treatment_plans     # existing patient
    on_complete: check_treatment_plans

  # --- Treatment-plan path (existing patients only, requires cardCode) ---
  check_treatment_plans:
    type: func
    func_type: crm
    func_id: getTreatmentPlans
    # No params. Reads the active plans for crmData.cardCode.
    on_complete: route_plans_count
    on_failure: get_branches           # 0 plans

  route_plans_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.treatmentPlansCount%"
      cases:
        "0": get_branches
        "1": plan_single
      empty: get_branches
    on_complete: pick_plan

  plan_single:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "יש לך תוכנית טיפול פעילה: %chat:crmData.treatmentPlans.0.title%"
      - "לקבוע תור מתוך התוכנית?"
    choices:
      - title: "כן, מתוך התוכנית"
        on_select: store_plan_single
      - title: "טיפול אחר"
        on_select: get_branches
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_failure: get_branches

  pick_plan:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "תוכניות טיפול"
    messages:
      - "מאיזו תוכנית טיפול לקבוע?"
    choices:
      - list: "%chat:crmData.treatmentPlans%"
      - title: "טיפול אחר (לא מהתוכנית)"
        on_select: get_branches
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_plan_choice
    on_failure: agent_handoff

  store_plan_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "plan"
      value:
        id: "%chat:crmData.treatmentPlans.0.id%"
    on_complete: plan_items

  store_plan_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "plan"
      value:
        id: "%state:node.pick_plan.id%"
    on_complete: plan_items

  # Exposes the chosen plan's items as crmData.services for booking.
  plan_items:
    type: func
    func_type: crm
    func_id: getTreatmentPlanItems
    params:
      treatmentPlanId: "%state:store.plan.id%"
    on_complete: route_plan_services_count
    on_failure: get_branches           # plan has no bookable items, fall back to the standard funnel

  route_plan_services_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.servicesCount%"
      cases:
        "0": get_branches
        "1": plan_service_single
      empty: get_branches
    on_complete: plan_pick_service

  # Plan services carry crm_id = departmentId (set by the adapter), so a plan service gives us
  # BOTH the serviceId (.id) and the departmentId (.crm_id). No branch/department step needed.
  plan_service_single:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "הטיפול בתוכנית: %chat:crmData.services.0.title%"
      - "לקבוע אותו?"
    choices:
      - title: "כן, לקבוע"
        on_select: store_plan_service_single
      - title: "טיפול אחר"
        on_select: get_branches
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_failure: agent_handoff

  plan_pick_service:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "טיפול מהתוכנית"
    messages:
      - "איזה טיפול מהתוכנית לקבוע?"
    choices:
      - list: "%chat:crmData.services%"
      - title: "טיפול אחר (לא מהתוכנית)"
        on_select: get_branches
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_plan_service_choice
    on_failure: agent_handoff

  store_plan_service_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "service"
      value:
        id: "%chat:crmData.services.0.id%"
        name: "%chat:crmData.services.0.title%"
    on_complete: store_plan_department_single

  store_plan_department_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "department"
      value:
        id: "%chat:crmData.services.0.crm_id%"
    on_complete: get_doctors

  store_plan_service_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "service"
      value:
        id: "%state:node.plan_pick_service.id%"
        name: "%state:node.plan_pick_service.text%"
    on_complete: store_plan_department_choice

  store_plan_department_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "department"
      value:
        id: "%state:node.plan_pick_service.crm_id%"
    on_complete: get_doctors

  # ─────────────────────────────────────────────────────────────
  # ⑤ STANDARD FUNNEL: branch, department, service.
  # ─────────────────────────────────────────────────────────────

  # --- Branch ---
  get_branches:
    type: func
    func_type: crm
    func_id: getBranches
    # Optional params (add a `params:` block to use):
    #   branchId: "..."      # narrow to one branch
    #   departmentId: "..."  # narrow to one department
    #   extended: true       # richer branch/department objects
    on_complete: route_branches_count
    on_failure: no_availability

  route_branches_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.branchesCount%"
      cases:
        "0": no_availability
        "1": store_branch_single
      empty: no_availability
    on_complete: pick_branch

  pick_branch:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "בחירת סניף"
    messages:
      - "באיזה סניף תרצה/י לקבוע את התור?"
    choices:
      - list: "%chat:crmData.branches%"
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_branch_choice
    on_failure: agent_handoff

  store_branch_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "branch"
      value:
        id: "%chat:crmData.branches.0.crm_id%"
        name: "%chat:crmData.branches.0.title%"
    on_complete: get_departments

  store_branch_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "branch"
      value:
        id: "%state:node.pick_branch.crm_id%"
        name: "%state:node.pick_branch.text%"
    on_complete: get_departments

  # --- Department ---
  get_departments:
    type: func
    func_type: crm
    func_id: getDepartments
    params:
      branchId: "%state:store.branch.id%"   # optional in the API (omit = all departments); here it scopes to the chosen branch
      # departmentId: "..."  # optional: narrow to one department
      # extended: true       # optional: richer department objects
    on_complete: route_departments_count
    on_failure: no_availability

  route_departments_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.departmentsCount%"
      cases:
        "0": no_availability
        "1": store_department_single
      empty: no_availability
    on_complete: pick_department

  pick_department:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "בחירת מחלקה"
    messages:
      - "באיזו מחלקה מדובר?"
    choices:
      - list: "%chat:crmData.departments%"
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_department_choice
    on_failure: agent_handoff

  store_department_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "department"
      value:
        id: "%chat:crmData.departments.0.crm_id%"
    on_complete: get_services

  store_department_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "department"
      value:
        id: "%state:node.pick_department.crm_id%"
    on_complete: get_services

  # --- Service ---
  # skipValidation: true lists every service in the department without needing a doctor first.
  # That breaks the service-vs-doctor chicken-and-egg (getDoctors below filters by real availability).
  get_services:
    type: func
    func_type: crm
    func_id: getServices
    params:
      departmentId: "%state:store.department.id%"   # optional: filter services to this department (omit = all)
      skipValidation: true
      # doctorId: "..."      # required only when skipValidation is false; also filters services to that doctor
    on_complete: route_services_count
    on_failure: no_availability        # 0 services in the department

  route_services_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.servicesCount%"
      cases:
        "0": no_availability
        "1": service_single
      empty: no_availability
    on_complete: pick_service

  service_single:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "הטיפול הזמין: %chat:crmData.services.0.title%"
      - "לקבוע אותו?"
    choices:
      - title: "כן, לקבוע"
        on_select: store_service_single
      - title: "טיפול אחר"
        on_select: check_working_hours
    on_failure: agent_handoff

  pick_service:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "בחירת טיפול"
    messages:
      - "איזה טיפול תרצה/י לקבוע?"
    choices:
      - list: "%chat:crmData.services%"
      - title: "טיפול שלא מופיע ברשימה"
        on_select: check_working_hours
    on_complete: store_service_choice
    on_failure: agent_handoff

  store_service_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "service"
      value:
        id: "%chat:crmData.services.0.id%"
        name: "%chat:crmData.services.0.title%"
    on_complete: get_doctors

  store_service_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "service"
      value:
        id: "%state:node.pick_service.id%"
        name: "%state:node.pick_service.text%"
    on_complete: get_doctors

  # ─────────────────────────────────────────────────────────────
  # ⑥ DOCTOR (shared by the standard funnel and the treatment-plan path)
  # ─────────────────────────────────────────────────────────────
  # With skipValidation off, "real availability" = for EACH doctor the adapter calls Rapid's
  # searchfreeslots (the same op as getAvailableSlots) for this department + service over the next
  # 7 days (today 07:00 UTC to +7 days 22:00 UTC), and keeps the doctor only if that returns at least
  # one free slot. So a doctor with an exposed calendar but no open slot in the next 7 days is dropped.
  # Cost: one slot-search request per doctor. skipValidation: true skips this and returns all doctors.
  get_doctors:
    type: func
    func_type: crm
    func_id: getDoctors
    params:
      departmentId: "%state:store.department.id%"
      serviceId: "%state:store.service.id%"
      # skipValidation: true # list all doctors without the availability filter (then serviceId is optional)
      # extended: true       # optional: extra doctor fields (roles, jobTitle, ...)
    on_complete: route_doctors_count
    on_failure: no_availability

  route_doctors_count:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.doctorsCount%"
      cases:
        "0": no_availability
        "1": store_doctor_single
      empty: no_availability
    on_complete: pick_doctor

  pick_doctor:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "בחירת מטפל/ת"
    messages:
      - "אצל מי תרצה/י לקבוע?"
    choices:
      - list: "%chat:crmData.doctors%"
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_doctor_choice
    on_failure: agent_handoff

  store_doctor_single:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "doctor"
      value:
        id: "%chat:crmData.doctors.0.crm_id%"
        name: "%chat:crmData.doctors.0.title%"
    on_complete: choose_date_range

  store_doctor_choice:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "doctor"
      value:
        id: "%state:node.pick_doctor.crm_id%"
        name: "%state:node.pick_doctor.text%"
    on_complete: choose_date_range

  # ─────────────────────────────────────────────────────────────
  # ⑦ SLOTS: searchable as many times as the user wants.
  # The window menu, the slot pages, and the "no slots" node all route back to choose_date_range,
  # so the patient can keep trying timeframes; later pages also step forward/back through results.
  # ─────────────────────────────────────────────────────────────
  # Fixed windows carry their range on `data` (from = days to the window START, to = window LENGTH in
  # days the adapter adds to `from`) and route to store_range. "Next week" can't be a fixed offset
  # (from: 7 on a Thursday lands mid-week), so it routes to compute_next_week, which derives the
  # days-until-next-Sunday from today's weekday. Every choice uses on_select (required once any choice
  # does); the fixed ones still carry data AND route to store_range, which reads that data.
  choose_date_range:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מתי לחפש תור?"
    messages:
      - "מתי נוח לך להגיע?"
    choices:
      - title: "בהקדם האפשרי"
        on_select: store_range
        data:
          from: 0
          to: 30
      - title: "שבוע הבא"
        on_select: compute_next_week
      - title: "בעוד שבועיים"
        on_select: store_range
        data:
          from: 14
          to: 7
      - title: "בעוד חודש"
        on_select: store_range
        data:
          from: 28
          to: 14
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_failure: agent_handoff

  store_range:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: "%state:node.choose_date_range.data.from%"
        to: "%state:node.choose_date_range.data.to%"
    on_complete: get_slots_page1

  # "Next week" math: Luxon weekday "c" is Mon=1 ... Sun=7. Days until next Sunday (Israeli week
  # start) = Mon->6, Tue->5, Wed->4, Thu->3, Fri->2, Sat->1, Sun->7 (the following Sunday). Each
  # routes to a tiny setter that stores from = that offset, to = 7 (a full Sun-Sat week).
  compute_next_week:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: '%time:now("c","ist")%'
      cases:
        "1": next_week_from_6
        "2": next_week_from_5
        "3": next_week_from_4
        "4": next_week_from_3
        "5": next_week_from_2
        "6": next_week_from_1
        "7": next_week_from_7
    on_complete: next_week_from_7

  next_week_from_1:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 1
        to: 7
    on_complete: get_slots_page1

  next_week_from_2:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 2
        to: 7
    on_complete: get_slots_page1

  next_week_from_3:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 3
        to: 7
    on_complete: get_slots_page1

  next_week_from_4:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 4
        to: 7
    on_complete: get_slots_page1

  next_week_from_5:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 5
        to: 7
    on_complete: get_slots_page1

  next_week_from_6:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 6
        to: 7
    on_complete: get_slots_page1

  next_week_from_7:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slotSearch"
      value:
        from: 7
        to: 7
    on_complete: get_slots_page1

  # Pagination via limit + offset. limit: 5 keeps the WhatsApp list under its 10-row cap
  # (5 slots + the show-more / previous / other-dates / agent rows). Each page bumps offset by limit.
  # 0 results: getAvailableSlots returns on_failure when no slot matches the window/page, so it routes
  # to no_slots (page 1 = nothing in the window; a later page = no more results beyond what was shown).
  get_slots_page1:
    type: func
    func_type: crm
    func_id: getAvailableSlots
    params:
      doctorId: "%state:store.doctor.id%"
      departmentId: "%state:store.department.id%"
      serviceId: "%state:store.service.id%"
      datesRangeFrom: "%state:store.slotSearch.from%"
      datesRangeTo: "%state:store.slotSearch.to%"
      limit: 5
      offset: 0
      # onlyGoodSlots: true  # optional: return just one slot per part of day (morning/afternoon/evening)
    on_complete: route_more_page1
    on_failure: no_slots

  # Smart "show more": offer the next page only when the adapter reports more slots BEYOND this page
  # (crmData.freeSlotsHasMore = there are slots past offset + limit). No off-by-one: a full page that is
  # also the last page reports false, so "show more" is hidden and the user never lands on an empty page.
  route_more_page1:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.freeSlotsHasMore%"
      cases:
        "true": pick_slot_page1_more
    on_complete: pick_slot_page1_last

  pick_slot_page1_more:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מועדים פנויים"
    messages:
      - "אלו המועדים הפנויים אצל %state:store.doctor.name% ל%state:store.service.name%:"
    choices:
      - list: "%chat:crmData.freeSlots%"
      - title: "הצג עוד מועדים"
        on_select: get_slots_page2
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_slot_page1_more
    on_failure: agent_handoff

  pick_slot_page1_last:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מועדים פנויים"
    messages:
      - "אלו המועדים הפנויים אצל %state:store.doctor.name% ל%state:store.service.name%:"
    choices:
      - list: "%chat:crmData.freeSlots%"
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_slot_page1_last
    on_failure: agent_handoff

  store_slot_page1_more:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slot"
      # A slot's startTime sits on .id and endTime on .crm_id (set by getAvailableSlots).
      value:
        start: "%state:node.pick_slot_page1_more.id%"
        end: "%state:node.pick_slot_page1_more.crm_id%"
        title: "%state:node.pick_slot_page1_more.text%"
    on_complete: route_create_before_book

  store_slot_page1_last:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slot"
      value:
        start: "%state:node.pick_slot_page1_last.id%"
        end: "%state:node.pick_slot_page1_last.crm_id%"
        title: "%state:node.pick_slot_page1_last.text%"
    on_complete: route_create_before_book

  get_slots_page2:
    type: func
    func_type: crm
    func_id: getAvailableSlots
    params:
      doctorId: "%state:store.doctor.id%"
      departmentId: "%state:store.department.id%"
      serviceId: "%state:store.service.id%"
      datesRangeFrom: "%state:store.slotSearch.from%"
      datesRangeTo: "%state:store.slotSearch.to%"
      limit: 5
      offset: 5
    on_complete: route_more_page2
    on_failure: no_slots

  route_more_page2:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.freeSlotsHasMore%"
      cases:
        "true": pick_slot_page2_more
    on_complete: pick_slot_page2_last

  pick_slot_page2_more:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מועדים פנויים"
    messages:
      - "עוד מועדים פנויים:"
    choices:
      - list: "%chat:crmData.freeSlots%"
      - title: "הצג עוד מועדים"
        on_select: get_slots_page3
      - title: "מועדים קודמים"
        on_select: get_slots_page1
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_slot_page2_more
    on_failure: agent_handoff

  pick_slot_page2_last:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מועדים פנויים"
    messages:
      - "עוד מועדים פנויים:"
    choices:
      - list: "%chat:crmData.freeSlots%"
      - title: "מועדים קודמים"
        on_select: get_slots_page1
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_slot_page2_last
    on_failure: agent_handoff

  store_slot_page2_more:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slot"
      value:
        start: "%state:node.pick_slot_page2_more.id%"
        end: "%state:node.pick_slot_page2_more.crm_id%"
        title: "%state:node.pick_slot_page2_more.text%"
    on_complete: route_create_before_book

  store_slot_page2_last:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slot"
      value:
        start: "%state:node.pick_slot_page2_last.id%"
        end: "%state:node.pick_slot_page2_last.crm_id%"
        title: "%state:node.pick_slot_page2_last.text%"
    on_complete: route_create_before_book

  get_slots_page3:
    type: func
    func_type: crm
    func_id: getAvailableSlots
    params:
      doctorId: "%state:store.doctor.id%"
      departmentId: "%state:store.department.id%"
      serviceId: "%state:store.service.id%"
      datesRangeFrom: "%state:store.slotSearch.from%"
      datesRangeTo: "%state:store.slotSearch.to%"
      limit: 5
      offset: 10
    on_complete: pick_slot_page3
    on_failure: no_slots

  pick_slot_page3:
    type: prompt
    prompt_type: choice
    interactive: list
    list_title: "מועדים פנויים"
    messages:
      - "עוד מועדים פנויים:"
    choices:
      - list: "%chat:crmData.freeSlots%"
      - title: "מועדים קודמים"
        on_select: get_slots_page2
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
    on_complete: store_slot_page3
    on_failure: agent_handoff

  store_slot_page3:
    type: func
    func_type: system
    func_id: storeValue
    params:
      key: "slot"
      value:
        start: "%state:node.pick_slot_page3.id%"
        end: "%state:node.pick_slot_page3.crm_id%"
        title: "%state:node.pick_slot_page3.text%"
    on_complete: route_create_before_book

  # Reached by an empty page (page 1 = nothing in range, later pages = no more results).
  no_slots:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "לא נמצאו עוד מועדים פנויים בטווח הזה 😕"
    choices:
      - title: "טווח תאריכים אחר"
        on_select: choose_date_range
      - title: "לדבר עם נציג"
        on_select: check_working_hours
      - title: "סיימתי"
        on_select: bot_resolved
    on_failure: agent_handoff

  # ─────────────────────────────────────────────────────────────
  # ⑧ CREATE-THEN-BOOK: a new patient is created here, only now that they confirmed a slot.
  # ─────────────────────────────────────────────────────────────
  route_create_before_book:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%state:store.customer.isNew%"
      cases:
        "true": create_new_patient     # new patient committed to a slot, create the record now
      empty: book_appointment          # existing patient already has cardCode
    on_complete: book_appointment

  create_new_patient:
    type: func
    func_type: crm
    func_id: createUpdateCustomer
    params:
      # On create, Rapid requires firstName, lastName and statusName.
      firstName: "%state:store.customer.firstName%"
      lastName: "%state:store.customer.lastName%"
      statusName: "מתעניין"
      cellPhone: "%state:store.customer.phone%"   # self = chat phone, someone else = the number we asked for
      # Optional patient fields (collect them earlier in the flow and inject here). The adapter passes
      # any extra key straight through to Rapid, so see the adapter doc for the full list. Common ones:
      #   nationalIDNumber: "..."   # ת.ז
      #   eMail: "..."              # email address
      #   birthDate: "DD/MM/YYYY"   # date of birth
      #   sex: 1                    # 1 male, 2 female
      #   cellPhone: "..."          # override the chat phone (default: chat's formatted phone)
      #   addressesList:            # one or more address lines
      #     - City: "..."
      #       Street: "..."
      #   updateCustomer: true      # update instead of create (requires crmData.cardCode)
    on_complete: get_customer_details_after_create
    on_failure: booking_failed

  get_customer_details_after_create:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      phoneNumber: "%state:store.customer.phone%"   # look up by the SAME phone we created with
    # Re-lookup so the new patient's cardCode lands on the chat before booking.
    on_complete: book_appointment
    on_failure: booking_failed

  book_appointment:
    type: func
    func_type: crm
    func_id: scheduleAppointment
    params:
      startTime: "%state:store.slot.start%"
      endTime: "%state:store.slot.end%"
      doctorId: "%state:store.doctor.id%"
      departmentId: "%state:store.department.id%"
      serviceId: "%state:store.service.id%"
      # quantity: 2          # optional: number of service units (default 1), extends duration/price
      # discount: 10         # optional: discount on the service price (default 0)
    on_complete: booking_confirmed
    on_failure: booking_failed

  booking_confirmed:
    type: notify
    messages:
      - "התור נקבע בהצלחה! 🎉"
      - ""
      - "🩺 טיפול: %state:store.service.name%"
      - "👩‍⚕️ מטפל/ת: %state:store.doctor.name%"
      - "🗓️ מועד: %state:store.slot.title%"
      - ""
      - "נשמח לראותך! לכל שינוי ניתן לפנות אלינו כאן 🙏"
    on_complete: bot_resolved

  booking_failed:
    type: notify
    messages:
      - "אופס, משהו השתבש בקביעת התור 😕 אני מעביר/ה אותך לנציג שישלים את הקביעה."
    on_complete: check_working_hours

  no_availability:
    type: notify
    messages:
      - "לא נמצאה זמינות מתאימה כרגע. אני מעביר/ה אותך לנציג/ה שיתאם/תתאם 🙏"
    on_complete: check_working_hours

  # ─────────────────────────────────────────────────────────────
  # SHARED: working-hours-aware handoff and resolve
  # ─────────────────────────────────────────────────────────────
  check_working_hours:
    type: func
    func_type: system
    func_id: checkWorkingTime
    on_complete: in_working_hours
    on_failure: outside_working_hours

  in_working_hours:
    type: notify
    messages:
      - "פנייתך הועברה לנציג/ה 🙂 ניתן לפרט כאן וניצור קשר בהקדם."
    on_complete: handoff

  outside_working_hours:
    type: notify
    messages:
      - "פנייתך הועברה לנציג/ה, אך התקבלה מחוץ לשעות הפעילות 🙏"
      - "ניתן לפרט כאן וניצור קשר בשעות הפעילות שלנו."
    on_complete: handoff

  agent_handoff:
    type: notify
    messages:
      - "לא הצלחתי להבין, אבל פנייתך הועברה לנציג/ה אנושי/ת 🙏"
    on_complete: handoff

  bot_resolved:
    type: notify
    messages:
      - "תודה שפנית אלינו, שיהיה יום נעים! ☀️"
    on_complete: resolved
```

## What to change in the existing bot

- **Texts** are placeholder Hebrew. Swap clinic name, tone, and emoji per client.
- **`statusName` on `create_new_patient`** must be a real Rapid status name (e.g. `"מתעניין"`, `"פעיל"`), or the create fails.
- **No treatment plans?** Delete `check_treatment_plans` through `store_plan_department_choice` and point `route_new_or_existing` straight at `get_branches`. Left in, it is harmless: `getTreatmentPlans` `on_failure` already falls through to `get_branches`.
- **Plan names mean nothing to your patients?** The main flow asks the patient to pick a plan by name (`pick_plan`), good when the clinic names plans meaningfully. If they don't, use the flatten-all variant in [Alternative: skip the plan picker](#alt-flatten-plans) below, which merges every plan's items into one service list with [`getServicesFromTreatmentPlans`](../Adapters/Rapid/Rapid.md#getservicesfromtreatmentplans).
- **Single-branch / single-department clinics** are handled at runtime by the `"1"` auto-select case, so leave the nodes in. If there is no branch/department concept at all, delete `get_branches`/`get_departments` and pass `getServices` a hardcoded `departmentId`.

:::tip Configure before use
Rapid must be connected (`crmConfig.server`, `rapid_token`, `leads_token`). Only doctors whose calendars are exposed in Rapid appear in [`getDoctors`](../Adapters/Rapid/Rapid.md#getdoctors) and slot search. See [Rapid Onboarding](../Adapters/Rapid/Rapid.md#rapid-onboarding).
:::

:::danger Set `defaultPriceListCode` in the customer DB
`getServices`, `getTreatmentPlanItems`, and booking all need a price list. The adapter uses `crmData.priceListId` if present, otherwise falls back to `crmConfig.defaultPriceListCode`, so if you don't set that in the customer's DB (`crmConfig`), **every service lookup fails**.

Get the clinic's price list id from Rapid's "Get Default Price list" endpoint, then paste it into `crmConfig.defaultPriceListCode`:

```bash
curl "https://<your-rapid-host>/customer-api/items/defaultpricelist/byexternalid" \
  -H "Authorization: ExternalClient=<rapid_token>"
```

`<your-rapid-host>` is the `crmConfig.server` host and `<rapid_token>` is the same token stored as `crmConfig.rapid_token`. Use the price list id from the response as `defaultPriceListCode`.
:::

## Alternative: skip the plan picker (flatten all plans) {#alt-flatten-plans}

The main flow has the patient choose a plan by name (a named confirm for one plan, a picker for several), then loads that plan's items with `getTreatmentPlanItems`. If plan names mean nothing to patients, **flatten** instead: merge **all** active plans' items into one deduplicated service list with `getServicesFromTreatmentPlans` and go straight to choosing a service.

Only the plan-selection part of section ④ changes; everything from `route_plan_services_count` onward (service 0/1/many handling, doctor, slots, booking) stays exactly as in the main flow. Concretely:

1. **Delete** these six nodes: `route_plans_count`, `plan_single`, `pick_plan`, `store_plan_single`, `store_plan_choice`, `plan_items`.
2. **Add** `all_plan_services` and point `check_treatment_plans` at it.

The changed/added nodes in full:

```yaml
  check_treatment_plans:
    type: func
    func_type: crm
    func_id: getTreatmentPlans
    on_complete: all_plan_services      # was: route_plans_count
    on_failure: get_branches

  all_plan_services:                    # NEW: replaces the 6 deleted plan-selection nodes
    type: func
    func_type: crm
    func_id: getServicesFromTreatmentPlans
    # Optional params:
    #   deduplicate: false   # keep duplicate item codes across plans (default true = drop duplicates)
    on_complete: route_plan_services_count
    on_failure: get_branches
```

:::warning Cancel / reschedule
Rapid's integration has no `func_id` for cancelling or rescheduling, only list, slots, and book. The "change appointment" choices route to a human handoff. Don't promise self-service cancellation in the copy.
:::

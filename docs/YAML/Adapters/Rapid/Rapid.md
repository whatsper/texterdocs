---
sidebar_position: 1
---

# Rapid (RapidOne)

[Rapid](https://rapidone.atlassian.net/wiki/external/MDUwMDgyMzQ0ZTYwNDRjOWEwYmMwNTE1ZGVlMmQ2OTY) is a clinic-oriented CRM.

**Official Rapid doc hubs** (For deeper reference):

- [Leads API](https://rapidone.atlassian.net/wiki/external/YjZjMmE0NDgyODU2NDFmNTlhOTRhNGYyMTk0OGVjYjI)
- [Customers / patients API](https://rapidone.atlassian.net/wiki/external/NzcyYzJkZmNmY2E5NDlhY2IyMTg5OWJhMDVmNDA1OWU)
- [Financial documents API](https://rapidone.atlassian.net/wiki/external/MTc1OThiNTdjMWE5NDNlMjg1OGE4MWYwZTU2YzgxMzQ)
- [Lead events](https://rapidone.atlassian.net/wiki/external/NjE3NmVjMzlkYzMzNGYxYzk5ZWZkNGFiZDk0NzhmYTI) — use [`request`](#lead-events-importevent-via-request) (**no** `func_id`).

---

## 1. Leads and customers

### `getCustomerDetails`

Looks up a **customer** by **phone** (formatted for the customer’s country) or by **national id** (`idNumber`).

**When it runs:** From bot YAML, or the same lookup backs the **CRM panel** in the Texter UI when a chat is opened.

**Basic**

```yaml
  rapid_lookup:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    on_complete: known_customer
    on_failure: unknown_customer
```

| Param | Required | Notes |
|--------|----------|--------|
| `phoneNumber` | No | If omitted, uses the chat’s **formatted channel phone** (when present). |
| `idNumber` | No | If set, lookup is by national id instead of phone. If both phone and `idNumber` are omitted and the chat has no phone, the op fails. |

**Result:** Merges mapped fields (`deepLink`, `phone`, `name`, `id`, `status`, …) plus the first Rapid customer object into `crmData`.

**Advanced**

```yaml
  rapid_lookup_by_id:
    type: func
    func_type: crm
    func_id: getCustomerDetails
    params:
      idNumber: "%state:node.collect_id.text%"
    on_complete: known_customer
    on_failure: unknown_customer
```

---

### `newOpportunity`

Creates a new lead. Most commonly used when the sender is not identified.

**Basic**

```yaml
  rapid_new_lead:
    type: func
    func_type: crm
    func_id: newOpportunity
    on_complete: lead_created
    on_failure: lead_failed
```

| Param | Required | Notes |
|--------|----------|--------|
| `phoneNumber` | No* | *If omitted, uses chat **formatted phone**. |
| `clientName` | No* | *If omitted, uses **`chat.title`**. |
| `leads_token` | No* | *If omitted, uses **`crmConfig.leads_token`**. Different `leads_token` means different source shown in Rapid. The token is generated in Rapid CRM and should be provided by the customer. |
| `interest_node` | No | **Texter-only:** choice node name → sets **`interest`** from **`userState[node].id`**. |
| `firstName` | No | If omitted, set from **`clientName`** / **`chat.title`**. |
| `lastName` | No | If omitted, adapter uses **`" "`**. |
| `cellPhone` | No | If omitted, set from **`phoneNumber`**. |
| `externalId` | No | If omitted, **`randomUUID()`** → **`crmData.leadExternalId`**. Override only for external-system alignment. |
| `eMail` | No | |
| `nationalId` | No | |
| `gender` | No | |
| `homePhone` | No | |
| `notes` | No | |
| `address` | No | |
| `city` | No | |
| `country` | No | |
| `interest` | No | Superseded by **`interest_node`** when **`interest_node`** is set. |
| `wantedTreatment` | No | |
| `location` | No | |
| `branch` | No | Branch id (provided by the customer). |
| `status` | No | Status id (provided by the customer). |
| `campaign` | No | |
| `iPaddress` | No | |
| `created` | No | ISO datetime. |
| `source` | No | **Lead_SourceID**; token must allow *Accept multiple sources* (Rapid Admin → CRM → lead source management). |
| `sourceName` | No | |
| *custom fields* | No | Keys configured in Rapid (e.g. **`Ads_group`**). |

**Result:** `crmData.leadName`, `crmData.leadExternalId`.

**Advanced**

```yaml
  rapid_new_lead_extras:
    type: func
    func_type: crm
    func_id: newOpportunity
    params:
      notes: "From WhatsApp bot"
      eMail: "user@example.com"
      branch: 1
      interest_node: pick_interest
    on_complete: lead_created
    on_failure: lead_failed
```

---

### `updateLead`

Updates a lead. The adapter always includes `externalId` from `crmData.leadExternalId` (set by `newOpportunity` or supplied for an external lead). 
**Update Lead only succeeds** if **`externalId`** and **`leads_token`** match the lead’s **create** call; if `newOpportunity` used a `leads_token` in params (overrides the token set in CRM config), `updateLead` must use the same token. 

Leads created outside the bot need `leadExternalId` (**must** be this exact key name) + matching `leads_token` in crmData — Rapid has **no** lookup-by-API. All non-empty string `params` keys merge into the body (same names as `newOpportunity`).

**Basic**

```yaml
  rapid_patch_lead:
    type: func
    func_type: crm
    func_id: updateLead
    params:
      notes: "להתקשר בין 12:00-14:00"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(prerequisite)* | — | **`crmData.leadExternalId`** must be on the chat. |
| `leads_token` | No* | *If omitted, uses **`crmConfig.leads_token`**. Must be the **same lead source** used when the lead was created. |
| `firstName` | No | |
| `lastName` | No | |
| `cellPhone` | No | |
| `eMail` | No | |
| `nationalId` | No | |
| `gender` | No | |
| `homePhone` | No | |
| `notes` | No | |
| `Notes` | No | |
| `address` | No | |
| `city` | No | |
| `country` | No | |
| `interest` | No | |
| `wantedTreatment` | No | |
| `location` | No | |
| `branch` | No | |
| `status` | No | |
| `campaign` | No | |
| `source` | No | |
| `sourceName` | No | |
| *custom fields* | No | Same as create. |

**Result:** Success only; **`crmData`** unchanged.

**Advanced**

```yaml
  rapid_patch_lead_full:
    type: func
    func_type: crm
    func_id: updateLead
    params:
      interest: "הסרת שיער"
      wantedTreatment: "בגב"
      leads_token: "<same source token as create>"
    on_complete: done
```

---

### `openTicket`

Opens a **ticket** in Rapid with the **recent conversation** as the message body.

**Basic**

```yaml
  rapid_ticket:
    type: func
    func_type: crm
    func_id: openTicket
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `phoneNumber` | No* | *If omitted, uses the chat’s **formatted channel phone** when present. If the chat has no phone, pass **`phoneNumber`** (formatted per customer country). |

**Result:** Success with Rapid’s ticket response merged into **`crmData`**.

**Advanced** — chat without a channel phone:

```yaml
  rapid_ticket:
    type: func
    func_type: crm
    func_id: openTicket
    params:
      phoneNumber: "%state:node.collect_phone.text%"
    on_complete: done
```

---

### `createUpdateCustomer`

Creates or updates a **patient** in Rapid. Set **`updateCustomer: true`** only when **`crmData.cardCode`** is already on the chat (after **`getCustomerDetails`**); otherwise omit **`updateCustomer`** or use **`false`** — **`cellPhone`** defaults from the chat if omitted.

**Basic**

```yaml
  rapid_upsert_customer:
    type: func
    func_type: crm
    func_id: createUpdateCustomer
    params:
      updateCustomer: false
      firstName: "..."
      lastName: "..."
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `updateCustomer` | No | If omitted, **`false`**. **`true`** = update — requires **`crmData.cardCode`**. |
| `cellPhone` | No* | *Create: if omitted, uses chat **formatted phone**. Anything you pass in **`params`** wins. |
| `addressesList` | No* | *Sent as **`[]`** if you don’t pass it. Address lines: **`Street`**, **`HouseNumber`**, **`AppartmentNumber`**, **`City`**, **`ZipCode`**, **`CountryCode`**, **`TypeOfAddress`** (`0` mailing / `1` invoicing). |
| `BPCode` | No* | *Update: set from **`crmData.cardCode`** if you don’t pass it. |
| `nationalIDNumber` | No | ת.ז |
| `homePhone` | No | |
| `workPhone` | No | |
| `cellPhone2` | No | |
| `emergencyPhone` | No | |
| `fax` | No | |
| `eMail` | No | |
| `firstName` | No | |
| `lastName` | No | |
| `foreignFirstName` | No | |
| `foreignLastName` | No | |
| `title` | No | `int`: Mr = 1, Mrs = 2, Dr = 3, Miss = 4, Prof = 5 |
| `sex` | No | `int`: 1 male, 2 female |
| `birthDate` | No | e.g. **`DD/MM/YYYY`** per Rapid |
| `statusName` / `status` | No | |
| `fatherCell` / `motherCell` | No | |
| `cellPhoneComment`, `cellPhone2Comment`, `homePhoneComment`, `workPhoneComment`, `emergencyPhoneComment`, `fatherCellComment`, `motherCellComment`, `faxComment` | No | |
| `referrerGroup`, `referrer` | No | |
| `departmentId` | No | `int` |
| `attributes` | No | `[{ attributeType, attributeOption }, …]` |
| `updateAttributeValues` | No | `boolean` |
| `priceListId` | No | `int` |

**Result:** Success only; **`crmData`** unchanged. After **create**, run **`getCustomerDetails`** to get **`cardCode`** on the chat.

**Advanced**

Update (`crmData.cardCode` already set):

```yaml
  update_customer:
    type: func
    func_type: crm
    func_id: createUpdateCustomer
    params:
      updateCustomer: true
      addressesList:
        - City: "%chat:crmData.aiMetadata.city%"
      eMail: "%chat:crmData.aiMetadata.email%"
      birthDate: "%chat:crmData.aiMetadata.birthDate%"
      cellPhone: "%chat:crmData.aiMetadata.phone1%"
      cellPhone2: "%chat:crmData.aiMetadata.phone2%"
      attributes:
        - attributeType: "שירות מבוקש"
          attributeOption: "%chat:crmData.aiMetadata.services%"
        - attributeType: "סניף"
          attributeOption: "%chat:crmData.aiMetadata.branch%"
        - attributeType: "מחיר משוער"
          attributeOption: "%chat:crmData.aiMetadata.price%"
      updateAttributeValues: true
    on_complete: split_on_ai_terminate_reason
```

Create:

```yaml
  create_customer:
    type: func
    func_type: crm
    func_id: createUpdateCustomer
    params:
      addressesList:
        - city: "%chat:crmData.aiMetadata.city%"
      firstName: "%chat:crmData.aiMetadata.firstName%"
      lastName: "%chat:crmData.aiMetadata.lastName%"
      nationalIDNumber: "%chat:crmData.aiMetadata.nationalId%"
      eMail: "%chat:crmData.aiMetadata.email%"
      birthDate: "%chat:crmData.aiMetadata.birthDate%"
      cellPhone: "%chat:crmData.aiMetadata.phone1%"
      cellPhone2: "%chat:crmData.aiMetadata.phone2%"
      attributes:
        - attributeType: "שירות מבוקש"
          attributeOption: "%chat:crmData.aiMetadata.services%"
        - attributeType: "סניף"
          attributeOption: "%chat:crmData.aiMetadata.branch%"
        - attributeType: "מחיר משוער"
          attributeOption: "%chat:crmData.aiMetadata.price%"
      updateAttributeValues: true
    on_complete: split_on_ai_terminate_reason
```

---

### `changeStatus`

Shortcut to set **patient status** from **`crmStatusCode`** (requires **`crmData.cardCode`**).

**Basic**

```yaml
  rapid_set_status:
    type: func
    func_type: crm
    func_id: changeStatus
    params:
      crmStatusCode: "פעיל"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `crmStatusCode` | Yes | Maps to Rapid **`statusName`** on the import body. |
| *(prerequisite)* | — | **`crmData.cardCode`** must be on the chat. |

**Result:** Success only; **`crmData`** unchanged.

---

### `closeTicket`

Sends the **chat transcript** to Rapid when **`crmData.cardCode`** exists (used by product flows when resolving a chat; rarely called directly from YAML).

**Basic**

```yaml
  rapid_close_to_crm:
    type: func
    func_type: crm
    func_id: closeTicket
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| *(omit `params`)* | — | Uses messages passed into the adapter by the runtime. **Requires `crmData.cardCode`** on the chat or the op does nothing useful. |

**Result:** Success with **`lastMessageStoredInCRMTimestamp`** when Rapid accepts the transcript.

---

## 2. Appointments

Natural end-to-end flow for **automatic appointment scheduling** (תיאום תורים אוטומטי): [FigJam — Rapid bot flow](https://www.figma.com/board/HDRU1IVOXD1dPKiosfQkxE/%D7%A8%D7%90%D7%A4%D7%99%D7%93-%D7%91%D7%95%D7%98-%D7%9C%D7%93%D7%95%D7%92%D7%9E%D7%90--%D7%9C%D7%90-%D7%9C%D7%A9%D7%A0%D7%95%D7%AA---Copy-?node-id=0-1&p=f&t=OccA48V3pjHh9NKW-0).

**Cancel / reschedule:** Not supported by Rapid in this integration yet — there is no **`func_id`** for cancel or reschedule; only list, slots, and book.

### High-level flow (what to run, in order)

1. **Know the patient in Rapid** — You need `crmData.cardCode` (and usually a **price list**: `crmData.priceListId` or CRM `defaultPriceListCode`) before `getServices` / booking. For new contacts: `createUpdateCustomer` → `getCustomerDetails` so `cardCode` is on the chat.
2. **Location** — `getBranches` → `getDepartments` so the user picks branch and department (results may be **cached** briefly).
3. **Service & doctor** — Load **services** and **doctors** with `getServices` and `getDoctors` (exact order depends on your UX: doctor-first vs service-first; see **Alternate patterns** below).
4. **When** — `getAvailableSlots` with the chosen `doctorId`, `departmentId`, `serviceId`, and date range.
5. **Book** — `scheduleAppointment` with the slot’s `startTime` / `endTime` and the same ids. The chosen **service** must already be on `crmData.services` (same `serviceId` as that row’s `id`).

**Treatment-plan shortcut (instead of branches):** `getTreatmentPlans` → `getTreatmentPlanItems` or `getServicesFromTreatmentPlans` → then `getDoctors` / slots / `scheduleAppointment` as above.

:::tip Common Pattern for all appointment operations

For example when searching for doctors, after each step-
- Check response items count
  * If 0 items returned - not found, route to a fallback node
  * If 1 item returned - store the result
  * Else, multiple items returned - route to a choice node and store chosen item

:::

:::warning Rapid-side availability (doctors & calendars)

The clinic must **turn on the right calendars / exposure in Rapid** for each doctor who should appear when booking through this integration. Only those doctors show up in lists and slot search, and only they can be booked. If someone is missing or slots look empty, check Rapid’s configuration first—not a Texter bug.

:::

### `getCustomerAppointments`

Lists appointments for **`customerId`** (param or `crmData.cardCode`). By default **future** appointments only; set `showPastAppointments: true` to include past.

**Basic**

```yaml
  rapid_list_appointments:
    type: func
    func_type: crm
    func_id: getCustomerAppointments
    on_complete: pick_appointment
```

| Param | Required | Notes |
|--------|----------|--------|
| `customerId` | No* | *If omitted, uses **`crmData.cardCode`** — **`cardCode`** must exist on the chat. |
| `showPastAppointments` | No | If omitted, **`false`** (future appointments only). |
| `titleFormat` | No | Handlebars template for list titles. |
| `idField` / `crmIdField` | No | Which Rapid field feeds choice **`id`** / **`crm_id`**. |

**Advanced** — full flow + checks:

```yaml
  get_appointment_details_eng:
    type: func
    func_type: crm
    func_id: getCustomerAppointments
    params:
      idField: "id"
      showPastAppointments: false
      titleFormat: "🩺 Treatment: {{services}},\n 🗓 Date: {{startDate}},\n ⏰ Time: {{startTime}},\n 🏥 Location: {{departmentName}}" 
    on_complete: appointment_info_check_if_appointments_exist_eng
    on_failure: appointment_details_not_found_eng

  appointment_info_check_if_appointments_exist_eng:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.appointments|length%"
      cases:
        "0": appointment_details_not_found_eng
        "1": appointment_details_one_found_eng
      empty: appointment_details_not_found_eng
    on_complete: appointment_details_many_found_eng

  appointment_details_one_found_eng:
    type: prompt
    prompt_type: choice
    messages:
      - "You have an existing appointment 📅"
      - '%chat:crmData.appointments|column("title")|join("\n\n")%'
      - ""
      - "How would you like to continue?"
    choices:
      - title: "Change queue details"
        on_select: appointment_details_change_appointment_details_eng
      - title: "Speak to a representative"
        on_select: check_working_hours_eng
      - title: "End conversation"
        on_select: bot_resolved_eng
    on_failure: agent_handoff_eng

  appointment_details_many_found_eng:
    type: prompt
    prompt_type: choice
    messages:
      - "You have %chat:crmData.appointments|length% existing appointments: 📅"
      - '%chat:crmData.appointments|column("title")|join("\n\n")%'
      - ""
      - "How would you like to continue?"
    choices:
      - title: "Change queue details"
        on_select: appointment_details_change_appointment_details_eng
      - title: "Speak to a representative"
        on_select: check_working_hours_eng
      - title: "End conversation"
        on_select: bot_resolved_eng
    on_failure: agent_handoff_eng

  appointment_details_not_found_eng:
    type: prompt
    prompt_type: choice
    messages:
      - "We couldn’t find an existing appointment under your name."
      - "Would you like us to help you schedule a new appointment? 😊"
    choices:
      - title: "Yes, schedule an appointment"
        on_select: check_working_hours_eng
      - title: "Speak to a representative"
        on_select: check_working_hours_eng
      - title: "End conversation"
        on_select: bot_resolved_eng
    on_failure: agent_handoff_eng
```

**Result:** `crmData.appointments[]` with `id`, `title`, `crm_id`, formatted dates/times, `services` string, etc.

---

### `getBranches`

Loads **branches** (each with nested **departments**) for the patient portal flow. Optional filters: **`branchId`**, **`departmentId`**, **`extended`**. Results may be **cached** briefly.

**Basic**

```yaml
  rapid_branches:
    type: func
    func_type: crm
    func_id: getBranches
    on_complete: check_branches_count
    on_failure: no_branches_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `branchId` | No | Narrow results to one branch. |
| `departmentId` | No | Narrow results to one department. |
| `extended` | No | Richer branch/department objects when `true`. |

**Result:** `crmData.branches[]`, `crmData.branchesCount`.

**Advanced**

```yaml
  rapid_branches_extended:
    type: func
    func_type: crm
    func_id: getBranches
    params:
      extended: true
    on_complete: check_branches_count
    on_failure: no_branches_found
```

---

### `getDepartments`

Lists **departments**. If **`branchId`** matches a branch already on **`crmData.branches`**, the adapter may return that branch’s departments **without** calling Rapid again. If **both** **`branchId`** and **`departmentId`** are omitted, Rapid returns **all** departments.

**Basic**

```yaml
  rapid_departments:
    type: func
    func_type: crm
    func_id: getDepartments
    params:
      branchId: "%state:node.pick_branch.crm_id%"
    on_complete: check_departments_count
    on_failure: no_departments_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `branchId` | No* | *If omitted (and **`departmentId`** omitted), **all** departments. Usually pass after a branch pick. |
| `departmentId` | No | Narrow to one department. |
| `extended` | No | Richer objects when `true`. |

**Result:** `crmData.departments[]`, `crmData.departmentsCount`.

**Advanced**

```yaml
  rapid_departments_extended:
    type: func
    func_type: crm
    func_id: getDepartments
    params:
      branchId: "%state:node.pick_branch.crm_id%"
      extended: true
    on_complete: check_departments_count
    on_failure: no_departments_found
```

---

### `getServices`

Lists **services** for a **doctor** and/or **department**. You must have a **price list** configured (**`crmData.priceListId`** or CRM **`defaultPriceListCode`**).

By default (**`skipValidation`** false or omitted), **`doctorId`** is required, and the adapter **drops services that don’t have availability** in the upcoming 7 days. Set **`skipValidation: true`** to list services **without** that check and **without** requiring **`doctorId`**.

**Basic**

```yaml
  rapid_services:
    type: func
    func_type: crm
    func_id: getServices
    params:
      doctorId: "%state:node.pick_doctor.crm_id%"
      departmentId: "%state:node.pick_department.crm_id%"
    on_complete: check_services_count
    on_failure: no_services_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `doctorId` | Yes* | *Required unless **`skipValidation: true`**. |
| `departmentId` | No | Optional query filter. |
| `skipValidation` | No | If omitted, **`false`** — availability filter on; **`doctorId`** required. When **`true`**, no availability filter and **`doctorId`** not required. |
| *(price list)* | — | Not a param: **`crmData.priceListId`** or **`crmConfig.defaultPriceListCode`** must exist or the op errors. |

**Result:** `crmData.services[]`, `crmData.servicesCount`.

**Advanced** — list services before a doctor is chosen (no availability filter):

```yaml
  rapid_services_skip_validation:
    type: func
    func_type: crm
    func_id: getServices
    params:
      departmentId: "%state:node.pick_department.crm_id%"
      skipValidation: true
    on_complete: check_services_count
    on_failure: no_services_found
```

---

### `getTreatmentPlans`

Loads **active treatment plans** for the patient from Rapid. **Requires `crmData.cardCode`**. No **`params`**.

**Basic**

```yaml
  rapid_treatment_plans:
    type: func
    func_type: crm
    func_id: getTreatmentPlans
    on_complete: check_plans_count
    on_failure: no_plan_found
```

| Param | Required | Notes |
|--------|----------|--------|
| *(none)* | — | All data comes from **`crmData.cardCode`**. |

**Result:** `crmData.treatmentPlans[]`, `crmData.treatmentPlansCount` (plans include nested **items**).

---

### `getTreatmentPlanItems`

Exposes **one plan’s items** as **`crmData.services`** for booking. **`treatmentPlanId`** must match a plan **`id`** on **`crmData.treatmentPlans`** (usually after **`getTreatmentPlans`**).

**Basic**

```yaml
  rapid_plan_items:
    type: func
    func_type: crm
    func_id: getTreatmentPlanItems
    params:
      treatmentPlanId: "%state:node.pick_plan.id%"
    on_complete: check_services_count
    on_failure: no_services_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `treatmentPlanId` | Yes | Numeric plan id from **`crmData.treatmentPlans`**. |

**Result:** `crmData.services[]`, `crmData.servicesCount`.

---

### `getServicesFromTreatmentPlans`

Flattens **all** items from plans already on **`crmData.treatmentPlans`** into a single **`services`** list. **`deduplicate`** removes duplicate **item codes** by default.

**Basic**

```yaml
  rapid_plan_services:
    type: func
    func_type: crm
    func_id: getServicesFromTreatmentPlans
    on_complete: check_services_count
    on_failure: no_services_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `deduplicate` | No | If omitted, **`true`** (drop duplicate **`id`** / item codes). Set **`false`** to keep duplicates. |

**Result:** `crmData.services[]`, `crmData.servicesCount`.

**Advanced** — keep duplicate item codes:

```yaml
  rapid_plan_services_no_dedupe:
    type: func
    func_type: crm
    func_id: getServicesFromTreatmentPlans
    params:
      deduplicate: false
    on_complete: check_services_count
    on_failure: no_services_found
```

---

### `getDoctors`

Lists **doctors** who can perform the chosen **service** in the **department**. By default **`skipValidation`** is off: the adapter **keeps only doctors with availability** for that combo in the next 7 days. If **`skipValidation: true`**, you get the full list **without** that filter (and **`serviceId`** is optional).

**Basic**

```yaml
  rapid_doctors:
    type: func
    func_type: crm
    func_id: getDoctors
    params:
      departmentId: "%state:store.department_id%"
      serviceId: "%state:store.service_id%"
    on_complete: check_doctors_count
    on_failure: no_doctors_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `departmentId` | Yes | |
| `serviceId` | Yes* | *Required unless **`skipValidation: true`**. |
| `skipValidation` | No | If omitted, **`false`** (filter by availability). |
| `extended` | No | If omitted, basic fields; **`true`** = extra doctor fields. |

**Result:** `crmData.doctors[]`, `crmData.doctorsCount`.

**Advanced** — all doctors in a department without availability filter:

```yaml
  rapid_doctors_unfiltered:
    type: func
    func_type: crm
    func_id: getDoctors
    params:
      departmentId: "%state:node.pick_department.crm_id%"
      skipValidation: true
      extended: true
    on_complete: check_doctors_count
    on_failure: no_doctors_found
```

---

### `getAvailableSlots`

Returns **free slots** for doctor + department + service. **`datesRangeFrom`** / **`datesRangeTo`** are **days from today** (start and end of the search window).

**Basic**

```yaml
  rapid_slots:
    type: func
    func_type: crm
    func_id: getAvailableSlots
    params:
      doctorId: "%state:node.pick_doctor.crm_id%"
      departmentId: "%state:node.pick_department.crm_id%"
      serviceId: "%state:node.pick_service.crm_id%"
      datesRangeFrom: 0
      datesRangeTo: 14
    on_complete: check_slots_count
    on_failure: no_slots_found
```

| Param | Required | Notes |
|--------|----------|--------|
| `doctorId`, `departmentId`, `serviceId` | Yes | |
| `datesRangeFrom`, `datesRangeTo` | Yes | Days from **today** (integers). |
| `limit` | No* | *If omitted, **`crmConfig.defaultSlotsLimit`** or **`5`**. |
| `offset` | No | If omitted, **`0`**. |
| `onlyGoodSlots` | No | If omitted, **`false`**; if **`true`**, one slot per part of day. |

**Advanced** — pagination and “one slot per part of day”:

```yaml
  rapid_slots_paged:
    type: func
    func_type: crm
    func_id: getAvailableSlots
    params:
      doctorId: "%state:node.pick_doctor.crm_id%"
      departmentId: "%state:node.pick_department.crm_id%"
      serviceId: "%state:node.pick_service.crm_id%"
      datesRangeFrom: 0
      datesRangeTo: 14
      limit: 5
      offset: 0
      onlyGoodSlots: true
    on_complete: check_slots_count
    on_failure: no_slots_found
```

**Result:** `crmData.freeSlots` with `startTime` / `endTime` ISO strings for **`scheduleAppointment`**.

---

### `scheduleAppointment`

**Books** the slot. The **service** must already sit on **`crmData.services`** — use the same **`serviceId`** as that row’s **`id`**.

**Basic**

```yaml
  rapid_book:
    type: func
    func_type: crm
    func_id: scheduleAppointment
    params:
      startTime: "%state:store.slot.startTime%"
      endTime: "%state:store.slot.endTime%"
      doctorId: "%state:node.pick_doctor.crm_id%"
      departmentId: "%state:node.pick_department.crm_id%"
      serviceId: "%state:node.pick_service.crm_id%"
    on_complete: booked_successfully
    on_failure: booking_error
```

| Param | Required | Notes |
|--------|----------|--------|
| `startTime`, `endTime` | Yes | ISO strings (from **`getAvailableSlots`**). |
| `doctorId`, `departmentId`, `serviceId` | Yes | Must match the selected slot/service. |
| `quantity` | No | If omitted, **`1`**. |
| `discount` | No | If omitted, **`0`**. |
| *(service row)* | — | Matching **`serviceId`** must exist on **`crmData.services`**. |

**Advanced** — quantity and discount:

```yaml
  rapid_book_with_discount:
    type: func
    func_type: crm
    func_id: scheduleAppointment
    params:
      startTime: "%state:store.slot.startTime%"
      endTime: "%state:store.slot.endTime%"
      doctorId: "%state:node.pick_doctor.crm_id%"
      departmentId: "%state:node.pick_department.crm_id%"
      serviceId: "%state:node.pick_service.crm_id%"
      quantity: 2
      discount: 10
    on_complete: booked_successfully
    on_failure: booking_error
```

**Result:** `crmData.appointmentId[]`.

---

## 3. Financial documents and files

### `getFinancialDocuments`

Lists **financial documents** for a patient. Query params are built from **`params`**; **`customerId`** defaults to **`crmData.cardCode`** when omitted.

**Basic**

```yaml
  rapid_fin_docs:
    type: func
    func_type: crm
    func_id: getFinancialDocuments
    on_complete: pick_doc
```

| Param | Required | Notes |
|--------|----------|--------|
| `customerId` | No* | *If omitted, uses **`crmData.cardCode`** — must exist on the chat or pass explicitly. |
| `limit` | No | If omitted, **`10`**. |
| `offset` | No | If omitted, **`0`**. |
| `fromDate`, `toDate` | No | ISO **`YYYY-MM-DDTHH:mm:ss`** (optional filter). |
| `idField`, `crmIdField` | No | Which document field becomes choice **`id`** / **`crm_id`**. If omitted, **`id`** / **`docNumber`**. |
| `titleFormat` | No | `{{...}}` template; variables match Rapid document fields, e.g. **`id`**, **`docNumber`**, **`date`**, **`branchName`**, **`docType`**, **`issuerName`**, **`customerId`**, **`fileName`**, **`departmentId`**, **`branchId`**. |

**Result:** `crmData.financialDocuments[]`

**Advanced** — range, paging, and titles:

```yaml
  rapid_fin_docs_filtered:
    type: func
    func_type: crm
    func_id: getFinancialDocuments
    params:
      customerId: "%chat:crmData.cardCode%"
      limit: 10
      offset: 0
      fromDate: "2025-01-01T00:00:00"
      toDate: "2025-12-31T23:59:59"
      titleFormat: "Document {{docNumber}} from {{date}}"
    on_complete: pick_doc
```

---

### `downloadDocument`

Fetches the **PDF** for a row from **`getFinancialDocuments`**, stores it in Texter, and exposes **`downloadedDocument.url`** (share link).

**Basic**

```yaml
  rapid_download_pdf:
    type: func
    func_type: crm
    func_id: downloadDocument
    params:
      docNumber: "%state:node.pick_doc.data.docNumber%"
      docType: "%state:node.pick_doc.data.docType%"
      issuerName: "%state:node.pick_doc.data.issuerName%"
    on_complete: send_pdf
```

| Param | Required | Notes |
|--------|----------|--------|
| `docNumber` | Yes | From a **`getFinancialDocuments`** row (`data`). |
| `docType` | Yes | From **`data`**. |
| `issuerName` | Yes | From **`data`**. |
| `customerId` | No* | *If omitted, uses **`crmData.cardCode`**. |
| `fileName` | No* | *If omitted, default **`financial-document-{docNumber}.pdf`**. |

**Result:** **`crmData.downloadedDocument` object** with the following fields:
- **`url`** - can be used for sending the doc using [`Send Media node`](/docs/YAML/Types/Notify/Send%20Media#document).
- **`fileId`**
- **`fileName`**
- **`documentId`**

**Advanced** — custom filename:

```yaml
  rapid_download_pdf_named:
    type: func
    func_type: crm
    func_id: downloadDocument
    params:
      docNumber: "%state:node.pick_doc.data.docNumber%"
      docType: "%state:node.pick_doc.data.docType%"
      issuerName: "%state:node.pick_doc.data.issuerName%"
      fileName: "invoice.pdf"
    on_complete: send_pdf
```

---

### `uploadFile`

Uploads a file from a **public URL** into the patient’s **documents** in Rapid. **`customerId`** defaults to **`crmData.cardCode`**.

**Basic**

```yaml
  rapid_upload:
    type: func
    func_type: crm
    func_id: uploadFile
    params:
      file: "https://example.com/file.pdf"
      fileName: "scan.pdf"
    on_complete: done
```

| Param | Required | Notes |
|--------|----------|--------|
| `file` | Yes | Public URL the server will fetch. |
| `fileName` | Yes | Stored name in Rapid. |
| `customerId` | No* | *If omitted, uses **`crmData.cardCode`**. |
| `chunkNumber`, `totalChunks` | No | If omitted, **`1`** / **`1`** (single upload). |

**Result:** Success when Rapid accepts the upload.

**Advanced** — explicit patient and chunked upload:

```yaml
  rapid_upload_chunked:
    type: func
    func_type: crm
    func_id: uploadFile
    params:
      file: "https://example.com/large.pdf"
      fileName: "scan.pdf"
      customerId: "%chat:crmData.cardCode%"
      chunkNumber: 1
      totalChunks: 3
    on_complete: done
```

---

## Out of Adapter Scope
### Lead events (`ImportEvent`)

**Not** a CRM `func_id`. Logs an event on a lead (e.g. call documentation / תיעוד שיחה תחת ליד) per Rapid’s [**Import Lead Event** API](https://rapidone.atlassian.net/wiki/external/NjE3NmVjMzlkYzMzNGYxYzk5ZWZkNGFiZDk0NzhmYTI) — use [`request`](#lead-events-importevent-via-request)

**Endpoint:** `POST {base}/api/leads/{LeadExternalID}/ImportEvent` — use your Rapid **`server`** as **`{base}`** and **`crmData.leadExternalId`** (or the same id) in the path.

**Authorization:** **`RoAuth LeadSource=<token>`** — **`<token>`** is the same string as **`crmConfig.leads_token`** (paste in YAML; the **`request`** node does **not** read CRM config by itself). **`Content-Type: application/json`**.

:::note IDs from the Rapid customer

**`eventTypeId`** and **`eventResultId`** are **tenant-specific** numbers defined in Rapid — the **Rapid customer** must provide the correct ids for your bot (e.g. “Call documentation”, “Call again later”). You configure types/results in Rapid under **ניהול → CRM → סוגי מעקבים**.

:::

| Field | Type | Notes |
|-------|------|--------|
| `eventTypeId` | int | Event type (e.g. call documentation). |
| `eventResultId` | int | Result of the event (e.g. callback later). |
| `Notes` | string | Notes about the interaction. |
| `ExternalSource` | string | Optional — source system / integration label. |
| `LeadExternalID` | string | Must match the lead id in the URL (**`crmData.leadExternalId`**). |

Example ids (illustrative only — **use values from your tenant**): `eventTypeId` **2** (call documentation), `eventResultId` **10** (e.g. call again later / לחזור יותר מאוחר).

**Example** — [`request`](/docs/YAML/Types/Func/System/Request) with full body:

```yaml
  log_lead_event:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://<your-rapid-host>/api/leads/%chat:crmData.leadExternalId%/ImportEvent"
      method: "post"
      keepResponse: true
      headers:
        Authorization: "RoAuth LeadSource=<leads_token>"
        Content-Type: "application/json"
      data:
        eventResultId: 33
        eventTypeId: 8
        Notes: "Test notes"
        ExternalSource: "Texter bot"
        LeadExternalID: "%chat:crmData.leadExternalId%"
    on_complete: after_event
    on_failure: after_event
```

---

## Rapid Onboarding (for Texter Support) {#rapid-onboarding}

Message our [contact at Rapid](https://ninja.texterchat.com/contact/whatsapp/972586640430/972547390008/). <br/> 
**You send:** 
- Project ID 
- API token with **View** + **Send Template Messages** scopes 
- WhatsApp phone number

**Customer DB — `crmConfig` fields**

| Field | Provided by Rapid? | Req / extra | Use |
|-------|-------------|-------------|-----|
| `server` | Yes | Required | Rapid API base URL |
| `rapid_token` | Yes | Required | `Authorization` on all Rapid requests |
| `leads_token` | Yes | Required | Default `leads_token` when omitted in YAML |
| `defaultPriceListCode` | Yes | Extra | Price list if no `crmData.priceListId` (used for appointments flow) |
| `defaultSlotsLimit` | No | Extra | Default `getAvailableSlots` `limit` (else **5**) |
| `useProxy` | No | Extra | `true` → Rapid calls via Texter proxy |
# Random Code

### What does it do?
Generates a cryptographically secure random code (numeric or alphanumeric). Commonly used for OTP (one-time password) verification flows — generate a code, send it via SMS/email, then validate the user's input with `matchValues`. The generated code is stored at `%state:node.<node_name>%`.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: utils
    func_id: randomCode
    params:
      type: "<code type>"
      length: <number of characters>
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a utils function
- `func_id` what function are we calling (`randomCode`)
- `params.type` code type:
    - `"numeric"` — generates a random integer with exactly `length` digits (e.g., length `6` → a number between 100000–999999)
    - `"alphanumeric"` — generates a random string of `length` characters from A-Z, a-z, 0-9
- `params.length` number of characters/digits in the generated code (minimum `1`)
- `on_complete` next node (typically sends the code via SMS/email)

### optional params
- `on_failure` fallback node
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Generate a 6-digit OTP
```yaml
  generate_code:
    type: func
    func_type: utils
    func_id: randomCode
    params:
      type: "numeric"
      length: 6
    on_complete: send_sms_with_code
```

### Generate an alphanumeric token
```yaml
  generate_token:
    type: func
    func_type: utils
    func_id: randomCode
    params:
      type: "alphanumeric"
      length: 12
    on_complete: send_token
```

### Full OTP verification flow
1. Generate the code
2. Send it via SMS (using `request`)
3. Ask the user to enter the code
4. Validate with `matchValues`

```yaml
  generate_code:
    type: func
    func_type: utils
    func_id: randomCode
    params:
      type: "numeric"
      length: 6
    on_complete: send_sms

  send_sms:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://sms-provider.com/send"
      method: "post"
      data:
        phone: "%chat:channelInfo.id%"
        message: "Your verification code is: %state:node.generate_code%"
    on_complete: ask_code

  ask_code:
    type: prompt
    prompt_type: text
    messages:
      - "Please enter the verification code we sent you via SMS"
    on_complete: validate_code

  validate_code:
    type: func
    func_type: utils
    func_id: matchValues
    params:
      value: "%state:node.generate_code%"
      match: "%state:node.ask_code.text%"
      trim: true
    on_complete: verified_success
    on_failure: verification_failed
```

:::tip
The generated code is stored at `%state:node.<node_name>%` and can be referenced in messages or params of subsequent nodes.
:::

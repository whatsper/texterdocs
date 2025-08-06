# Choice

### What does it do?
Sends a message to user and **waits** for an answer.
___
## 1. Syntax
#### prompt - choice:
```
<node_name>:
  type: prompt
  prompt_type: choice
  messages:
    - "<message>"
  choices:
    - title: "<title_name>"
      on_select: <function to do on selection>
    - title: "<title_name>"
      on_select: <function to do on selection>
  on_complete: <next_function>
```

### required params
- `type` type of the node.
- `prompt_type` what type of prompt (choice)
- `messages` list of messages to send in a single message block.
- `choices` list of choices (title & select). - **only for "prompt_type: choice"**
- `on_complete` next function to do after complete (can be either a node or a function).

### optional params
- `interactive` for prompt type: choice, to create either a list or buttons
- `delay_on_complete` number of seconds to delay

___
## 2. Example
### _Choice_:
:::danger
- if we choose to remove "on_select" from chocies (then we need to remove from all the choices)
  then no matter what the user selects it will go to on complete
- if we do keep them then **will go to on_complete case when user types an answer different from the options**
:::

### Buttons
up to 3 buttons and each button can contain up to 20 chars
```
ask_age_range:
  type: prompt
  prompt_type: choice
  interactive: buttons
  messages:
    - "what is your age range?"
  choices:
    - title: "12-18"
      on_select: teen_questions
    - title: "18+"
      on_select: adult_questions
  on_complete: agent_handoff
```

### List
up to 10 choices and each button can contain up to 24 chars
```
ask_age_range:
  type: prompt
  prompt_type: choice
  interactive: list
  list_title: "choose city"
  messages:
    - "in what city do you live?"
  choices:
    - title: "Jerusalem"
      on_select: jerusalem_menu
    - title: "Tel-Aviv"
      on_select: tel_aviv_menu
    - title: "Ramat-Gan"
      on_select: ramat_gan_menu
    - title: "other"
      on_select: main_menu
  on_complete: summerize_answers
```

### Numbers
up to 10 choices and each button can contain up to 24 chars
the user will need to answer by a number (1 for the first answer 2 for the second etc)
```
ask_age_range:
  type: prompt
  prompt_type: choice
  messages:
    - "in what city do you live? (reply by number)"
  choices:
    - title: "Jerusalem"
    - title: "Tel-Aviv"
    - title: "Ramat-Gan"
    - title: "other"
  on_complete: summerize_answers
```
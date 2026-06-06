---
title: Response Schema
sidebar_position: 5
slug: /q-ai-bot/response-schema
description: The fixed-shape JSON the Q-AI Bot returns every turn (the visible reply, the terminate control channel, and the internal aiMetadata) and how the bot YAML consumes, routes on, and extends it.
---

# Response Schema

Every turn, the Q-AI Bot returns not free text but a single **JSON object with a fixed shape**, the contract between the AI and the Texter platform: one field becomes the message the contact reads, others tell the bot flow what to do next, and a hidden block carries analytics. This page explains that object field by field and shows how your bot YAML reads it, routes on it, and extends it. The AI runs alongside a Texter bot, switched on and off by [scenarios](/docs/q-ai-bot/conversation-lifecycle).

:::note[How to read this page]
Sections 1–4 cover the **default schema** every project starts with. Sections 5–8 are **advanced and optional**: custom exit reasons, configurable messages, and extending the schema to capture extra structured data.
:::

---

## 1. Why structured output

A chatbot that returns plain text can only do one thing: send that text. It cannot reliably tell the surrounding system *"now hand this chat to a human"* or *"flag this conversation for follow-up"*, because there is no dependable place to put that signal. Parsing intent out of prose is fragile and breaks the moment the model rephrases itself.

The Q-AI Bot avoids this by constraining the model to a **structured response**: a JSON object whose keys are known in advance. The platform reads each field by name and acts on it deterministically.

```mermaid
flowchart TD
    M([Model returns one JSON object]) --> R[response<br/>say something]
    M --> T[terminate + terminateReason<br/>signal something]
    M --> A[aiMetadata<br/>record something]

    R --> RS([Sent to the chat as a WhatsApp message])
    T --> TD{terminate true?}
    TD -->|No| KEEP([AI keeps the conversation])
    TD -->|Yes| BOT([Bot flow takes over, branches on terminateReason])
```

This split, **say something, signal something, record something**, is the core idea everything below builds on.

---

## 2. The default schema

This is the **actual default schema** the Q-AI Bot uses out of the box. It is a JSON Schema definition that tells the OpenAI Responses API exactly what shape the model's answer must take, and the API guarantees the output validates against it.

```json
{
  "name": "Agent_Response",
  "strict": true,
  "schema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["terminate", "terminateReason", "response", "aiMetadata"],
    "properties": {
      "response": { "type": "string", "description": "The reply to be sent to the user, formatted as a plain WhatsApp message." },
      "terminate": { "type": "boolean", "description": "Set to true if the conversation should be terminated; otherwise, false." },
      "terminateReason": { "type": "string", "enum": ["human_handoff", "resolved_convo", "null"], "description": "Reason for terminating the conversation. Set to (null) if terminate is false, otherwise provide the relevant reason for termination." },
      "aiMetadata": { "type": "object", "additionalProperties": false, "required": ["summary", "reasoning"], "description": "Internal metadata used for tagging and analytics. This is not seen by the user.", "properties": {
        "summary": { "type": "string", "description": "A concise, single-sentence summary of the conversation topic conversation or customers request - in Hebrew (a must!)." },
        "reasoning": { "type": "string", "description": "Your reasoning and thought process behind the response, address the user and system message and your tool calls results to explain why you responded the way you did, and if the conversation was terminated here then why." }
      } }
    }
  }
}
```

### What each field is for

| Field | Type | Who sees it | What it does |
| ----- | ---- | ----------- | ------------ |
| `response` | string | **The contact** | The only field the contact ever reads. It is sent to the chat as a plain WhatsApp message, every turn. |
| `terminate` | boolean | Internal | The on/off switch for ending the AI's part of the conversation. `false` = keep going; `true` = the bot flow should take over. |
| `terminateReason` | string (enum) | Internal | *Why* the AI is ending. The bot flow branches on this. When `terminate` is `false`, the model sets it to the literal string `null`. |
| `aiMetadata.summary` | string | Internal | A one-sentence summary of what the conversation was about, **in Hebrew** (the schema requires it). Used for reports and at-a-glance triage. |
| `aiMetadata.reasoning` | string | Internal | The model's own explanation of why it answered the way it did and why it terminated (if it did). Used for evaluation and debugging. |

### The control channel: `terminate` + `terminateReason`

These two fields work as a pair. `terminate` decides *whether* the AI hands the conversation back; `terminateReason` decides *where it goes next*, which is what your bot flow switches on (see [section 3](#3-how-the-bot-yaml-consumes-it)). When `terminate` is `true`, the model must give a reason from the enum.

The two default reasons are:

- `human_handoff`: the AI has decided a person should take over (a question it cannot answer, an explicit request for a human, a sensitive situation).
- `resolved_convo`: the AI believes the conversation is genuinely finished and nothing more is needed.

### `aiMetadata`: internal analytics

`aiMetadata` is the bot's "show your work" block, available to your bot YAML and to reporting but never shown to the contact.

The "in Hebrew (a must!)" note on `summary` is a **convention baked into the default schema**, not a platform rule: the default schema was written for Hebrew-speaking projects so summaries read naturally in the reporting sheets and the agent queue. If you write a custom schema, you set the summary language yourself.

### `strict` mode and `additionalProperties: false`

Two parts of the schema make it trustworthy:

- **`strict: true`** tells the Responses API to *enforce* the schema. The model cannot return malformed JSON or skip a required field.
- **`additionalProperties: false`** means the object may contain **only** the keys defined here. The model cannot invent extra fields. Combined with `required`, every response has exactly the fields you expect, no more, no fewer.

Because of this, your bot YAML can read `terminateReason` or any `aiMetadata` field with confidence and never has to defend against a missing field or stray prose.

---

## 3. How the bot YAML consumes it

The platform handles the response in two simple steps, every turn:

1. **It sends `response` to the chat.** While the AI is active, whatever is in `response` is delivered to the contact as a WhatsApp message, automatically, with no YAML involved.
2. **It checks `terminate`.** While `terminate` is `false`, nothing else happens; the AI stays in control. The moment `terminate` is `true`, the AI session ends and the **bot flow takes over**, resuming at the node configured in your `externalBot` / re-entry setup.

When the bot flow resumes, the terminate reason is available to read. In a Q-AI bot this is exposed as `%chat:crmData.aiTerminateReason%`. Your flow's job is to **branch on it** and route to the right place. The natural tool for this is the [Switch Node](/docs/YAML/Types/Func/System/Switch%20Node).

```yaml
  back_to_texter:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.aiTerminateReason%"
      cases:
        "human_handoff": ai_handoff_message
        "resolved_convo": ai_resolved_message
    on_complete: ai_handoff_message
```

Here `human_handoff` routes to a node that posts your handoff message and hands the chat to an agent, and `resolved_convo` routes to a polite closing node; the `on_complete` fallback catches anything unexpected. (Case keys are matched as **strings** and must be quoted; see the [Switch Node](/docs/YAML/Types/Func/System/Switch%20Node) page.)

:::note
The exact node names and the field you read (`%chat:crmData.aiTerminateReason%`) come from the [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot). Use that recipe as your starting scaffold rather than wiring this from scratch.
:::

---

## 4. Routing with `aiMetadata`

The terminate fields are not the only thing the bot can act on. **Any field inside `aiMetadata` is readable in your bot YAML**, so the AI can pass structured signals down into the flow for your flow to react to.

For example, you can add a label to the chat based on a metadata value using the [Labels](/docs/YAML/Types/Func/Chat/Add%20Label) function:

```yaml
  label_from_ai:
    type: func
    func_type: chat
    func_id: labels
    params:
      add:
        - "%chat:crmData.aiMetadata.classification%"
    on_complete: back_to_texter
```

Or you can branch the flow on a metadata value with a [Switch Node](/docs/YAML/Types/Func/System/Switch%20Node):

```yaml
  route_by_classification:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.aiMetadata.classification%"
      cases:
        "HOT": hot_lead_handoff
        "WARM": warm_lead_nurture
        "COLD": cold_lead_close
    on_complete: warm_lead_nurture
```

You can also persist a metadata value into the session store with [Store Value](/docs/YAML/Types/Func/System/Store%20Value) so later nodes can reuse it, or map several fields into a CRM update step. The pattern is always the same: the AI writes a structured field, the YAML reads it by path.

:::tip
The default schema only defines `summary` and `reasoning` under `aiMetadata`. To route on `classification` (as above) you must first **add that field to the schema**; see [section 7](#7-extending-the-schema). Reading a field the schema never defines will simply yield an empty value.
:::

---

## 5. Custom terminate reasons

The default `terminateReason` enum has two values, but you can extend it with your own reasons, and the AI will choose among them when it ends a conversation. This turns `terminateReason` into a steering wheel: the AI decides *where in the bot flow the conversation should land* after it bows out, and your post-AI flow routes each reason to a different node.

For example, suppose you want the AI to be able to end by sending a pricing-qualified lead straight to a booking branch. Add a custom reason to the enum:

```json
"terminateReason": {
  "type": "string",
  "enum": ["human_handoff", "resolved_convo", "ready_to_book"],
  "description": "Reason for terminating. Use 'ready_to_book' when the contact has confirmed they want to schedule."
}
```

Then add a matching branch to the switch that runs after the AI ends:

```yaml
  back_to_texter:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.aiTerminateReason%"
      cases:
        "human_handoff": ai_handoff_message
        "resolved_convo": ai_resolved_message
        "ready_to_book": booking_flow_start
    on_complete: ai_handoff_message
```

Now, whenever the AI decides a contact is ready to schedule, it terminates with `ready_to_book` and the contact drops directly into your booking branch: a new "exit door" into the bot.

:::caution[Keep the schema and the flow in sync]
Every reason in the enum should have a matching `case` in the post-AI switch. If you add an enum value but forget the branch, the conversation falls through to the `on_complete` fallback, so point that fallback somewhere sensible.
:::

---

## 6. The messages you configure in YAML

The AI writes the conversational replies (`response`); the scripted, transactional messages that frame its start and end live in the bot YAML, not the AI, so they can be re-worded and localized per project without touching the AI configuration:

| Message | When it fires | Purpose |
| ------- | ------------- | ------- |
| **Handoff / "we got your details"** | The AI ends with `human_handoff` | Reassures the contact that a person will follow up, before the chat moves to an agent. |
| **Inactivity / re-engagement closing** | The [re-engagement ladder](/docs/q-ai-bot/abandoned-bot-system) gives up after the contact stops replying | A graceful sign-off so an abandoned conversation closes politely. |
| **Message-limit** | The conversation reaches its configured turn limit | Lets the contact know the automated portion is wrapping up and what happens next. |
| **Error / apology** | The AI run fails for any reason | A short apology and a safe fallback (usually a handoff) so a glitch never leaves the contact in silence. |

These are routed with the same [Switch Node](/docs/YAML/Types/Func/System/Switch%20Node) pattern shown above, driven by `terminateReason` and the error/limit signals surfaced by the [scenarios](/docs/q-ai-bot/conversation-lifecycle). The end-reason semantics themselves are owned by [Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle) and the [re-engagement ladder](/docs/q-ai-bot/abandoned-bot-system).

---

## 7. Extending the schema

The real power of the response schema is that it is **per-project**: you can **extend `aiMetadata`** so the AI reports extra structured data while it talks, leaving the control fields (`response`, `terminate`, `terminateReason`) **exactly as they were** so all the flow scaffolding above still works unchanged. What you add is up to the project.

For example, a project that qualifies sales leads might add a score, a classification, and a few extracted contact fields:

```json
{
  "name": "Agent_Response",
  "strict": true,
  "schema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["terminate", "terminateReason", "response", "aiMetadata"],
    "properties": {
      "response": { "type": "string", "description": "The reply to be sent to the user, formatted as a plain WhatsApp message." },
      "terminate": { "type": "boolean", "description": "Set to true if the conversation should be terminated; otherwise, false." },
      "terminateReason": { "type": "string", "enum": ["human_handoff", "resolved_convo", "null"], "description": "Reason for terminating the conversation. Set to (null) if terminate is false, otherwise provide the relevant reason for termination." },
      "aiMetadata": {
        "type": "object",
        "additionalProperties": false,
        "required": ["summary", "reasoning", "leadScore", "classification", "extracted"],
        "description": "Internal metadata used for tagging, analytics, and lead capture. This is not seen by the user.",
        "properties": {
          "summary": { "type": "string", "description": "A concise, single-sentence summary of the conversation - in Hebrew (a must!)." },
          "reasoning": { "type": "string", "description": "Your reasoning behind the response and any termination." },
          "leadScore": { "type": "integer", "minimum": 0, "maximum": 10, "description": "How qualified the lead is, from 0 (not a lead) to 10 (ready to buy)." },
          "classification": { "type": "string", "enum": ["HOT", "WARM", "COLD"], "description": "Overall lead temperature." },
          "extracted": {
            "type": "object",
            "additionalProperties": false,
            "required": ["firstName", "lastName", "phone", "email", "city", "services"],
            "description": "Contact details the assistant extracted from the conversation. Use an empty string when a value was not provided.",
            "properties": {
              "firstName": { "type": "string" },
              "lastName": { "type": "string" },
              "phone": { "type": "string" },
              "email": { "type": "string" },
              "city": { "type": "string" },
              "services": { "type": "array", "items": { "type": "string" }, "description": "Services or products the contact expressed interest in." }
            }
          }
        }
      }
    }
  }
}
```

Everything outside `aiMetadata` is identical to the default, so the `back_to_texter` switch and all the scaffolding above keep working. You have only taught the model to **also** report a score, a temperature, and extracted fields alongside its reply.

:::tip
Keep `extracted` fields generic and let the model write an empty string when a value is missing (the `required` list still forces the field to exist, which keeps the object shape stable for your YAML to read).
:::

:::caution[The schema travels with a description, keep them in sync]
The schema does not stand alone. Each project also has a **schema description**: a plain-language block of response-format instructions and worked examples that is injected into the model's prompt and tells it *how* and *when* to fill each field: what makes a lead `HOT` versus `WARM`, when to leave `extracted.email` as an empty string, how to phrase the Hebrew `summary`, and so on. The JSON Schema enforces the *shape* of the answer; the description teaches the *behavior* behind it.

The two are one unit. **Every time you change the schema, update its description to match.** Add a field to the schema but not to the description and the model will dutifully return the field with no guidance on what belongs in it, so the values come back empty or inconsistent.
:::

---

## 8. Acting on custom fields

Once a field exists in `aiMetadata` (section 7), your bot flow reacts to it like any other metadata: the AI does the judging, the deterministic flow does the acting.

- **Label** a chat from a field value with the [Labels](/docs/YAML/Types/Func/Chat/Add%20Label) function so agents can sort the queue.
- **Route** the flow on a field (the switch in [section 4](#4-routing-with-aimetadata)).
- **Hand off** as soon as a value crosses a threshold you care about, instead of waiting for the contact to ask.

For instance, with the lead-capture example above you might label `HOT` / `WARM` / `COLD`, route on `classification`, or hand off when `leadScore` passes your bar.

---

## 9. Testing

The fastest way to see the schema end to end is the **[AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot)**: a paste-in snippet that runs a real conversation through the AI and includes the `back_to_texter` switch that branches on `terminateReason`. Once that loop works, layer in your `aiMetadata` routing and any custom terminate reasons. See [scenarios](/docs/q-ai-bot/conversation-lifecycle) for how the AI is switched on and off around the flow.

---

## 10. Where it is configured

The response schema is stored **per project in the managed configuration database** and is owned by engineering, alongside its [description](#7-extending-the-schema). The flow is one-directional: the schema lives in the database, the AI returns JSON that matches it, and the bot YAML only *consumes* that JSON (`response`, `terminateReason`, `aiMetadata`). The schema is **not** edited in the public bot YAML.

:::caution[A schema change moves three things at once]
Change the schema and you must also update its **description** (or a new field comes back empty, [section 7](#7-extending-the-schema)) and the **bot flow that reads it** (so a new field has somewhere to go and an old `case` never points at a node that disappeared). Always move all three together: schema, description, and flow.
:::

---

## Related pages

- [Q-AI Bot overview](/docs/q-ai-bot/overview): what the feature is and how the pieces fit together.
- [Scenarios](/docs/q-ai-bot/conversation-lifecycle): how the AI is switched on and off around the bot flow.
- [Re-engagement ladder](/docs/q-ai-bot/abandoned-bot-system): the inactivity behavior behind the closing message.
- [AI Bot recipe](/docs/YAML/Bot%20Recipes/AI%20Bot): the paste-in scaffold for testing.
- [Switch Node](/docs/YAML/Types/Func/System/Switch%20Node) · [Labels](/docs/YAML/Types/Func/Chat/Add%20Label) · [Store Value](/docs/YAML/Types/Func/System/Store%20Value): the YAML functions that read the schema.

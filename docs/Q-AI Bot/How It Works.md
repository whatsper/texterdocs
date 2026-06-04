---
title: How It Works
sidebar_position: 2
slug: /q-ai-bot/how-it-works
description: One Q-AI Bot conversation walked through end to end — the on/off switch, a fresh session, a single AI turn, the structured reply, routing, and handoff back to a human.
---

# How It Works

This page follows **one conversation from start to finish**. By the end you will know exactly what happens between a contact sending a message and the assistant's reply appearing in the chat — and what decides whether the conversation continues or ends.

If you haven't read the **[Overview](/docs/q-ai-bot/overview)** yet, do that first; it names the moving parts referenced below.

---

## Step 1 — AI mode: the on/off switch

Every chat carries a master switch called **AI mode** (internally, *external-bot mode*). While it is **off**, the Q-AI Bot ignores the chat entirely and your normal Texter bot is in control. While it is **on**, every incoming message is sent to the assistant.

The Texter bot flips this switch on at the point in a flow where you want the AI to take over — for example, after a lead is captured, or when a test keyword is matched. The switch is also flipped **off** automatically by several events (an agent takes the chat, the chat is resolved, the assistant decides it is done). You don't toggle it by hand in normal operation; the bot and a set of scenarios do.

:::tip
The switch is the single most important thing to understand. "Is AI mode on for this chat?" answers most "why didn't the AI respond?" questions. The full set of things that turn it on and off lives on the **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** page.
:::

---

## Step 2 — Turning it on starts a fresh session

The moment AI mode is switched on, a **new AI session** begins for that chat. A session is the assistant's memory of *this* conversation: it starts clean, with no carryover from any previous AI session on the same chat.

At session start the assistant also receives the recent chat history and the project's **system prompt** — the standing instructions and persona that tell it who it is, how to behave, and what it should and shouldn't do. The system prompt is configured per project, so the same platform can host a friendly clinic receptionist for one business and a terse support agent for another.

---

## Step 3 — Each incoming message is one AI turn

After the session starts, the rule is simple: **one incoming message = one AI turn.** Every time the contact writes, the assistant runs once and produces one reply.

A single turn looks like this:

1. **Receive** the contact's message.
2. **Retrieve** — the assistant searches the project's **[knowledge base](/docs/q-ai-bot/knowledge-base)** for relevant snippets (the RAG step). It only does this when the question calls for it.
3. **Reason** — it combines the question, the retrieved snippets, the system prompt, and the conversation so far, then composes an answer.
4. **Respond** — it returns a **[structured reply](/docs/q-ai-bot/response-schema)** (see Step 4), and the visible part is sent to the contact.

The retrieval step is the only optional one: if the question doesn't need the knowledge base (a greeting, a "thanks"), the assistant skips straight to reasoning.

---

## Step 4 — The structured reply

The assistant does not just return a blob of text. Every turn produces a **structured reply** with a few fields: the **visible message** to send to the contact, a signal for whether the session should **end**, a **reason** if it ends, and some internal **metadata** (a short summary and the assistant's reasoning, plus any extra fields the project's schema defines).

Only the visible message is sent to the contact. The other fields are used by Texter to decide what to do next, and to populate reports. The exact shape — and how the bot YAML reads it — is documented on the **[Response Schema](/docs/q-ai-bot/response-schema)** page.

:::info[Why structured?]
Because the reply is structured, Texter can act on the assistant's decisions automatically: send this text, then end the session for *this* reason, then route the bot down the right path. A plain-text answer couldn't carry those instructions.
:::

---

## Step 5 — Routing after each turn

Once the visible reply is sent, Texter decides what happens next based on the structured reply and the session's state:

| Outcome | What happens |
| --- | --- |
| **Continue** | The session stays open and waits for the contact's next message — which becomes the next AI turn. |
| **Message limit reached** | Each project sets a maximum number of AI turns per session (set per project; see **[Per-Project Settings](/docs/q-ai-bot/per-project-settings)**). Once that cap is hit, the session ends so a conversation can't loop forever. |
| **End** | The assistant signalled it is finished — either it resolved the chat, or it asked for a human. The session ends and the chat is handed off. |

If anything goes wrong during a turn (for example the assistant call fails), the session also ends safely so the contact is never left talking to a stalled bot.

---

## Step 6 — Handing back to a human

When a session ends — whether the assistant resolved it, asked for a human, hit the message limit, or errored — AI mode is switched **off** for the chat and control returns to Texter. A **termination reason** is recorded on the chat so your bot (and your reports) know *why* the AI stepped away.

From there your Texter bot picks up: it can route a human handoff to an agent, label the chat, update your CRM, or send a closing message — all driven by the recorded reason. The mechanics of handoff, and the full list of end reasons, are on the **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)** page.

---

## What makes it feel continuous

A contact experiences one smooth conversation, even though each turn is a separate run. That continuity is kept **server-side**: the assistant's previous turns are remembered for the session, so it never forgets what was said two messages ago, and Texter does not have to resend the whole history each time.

Under the hood the reasoning is done by a **GPT-5.2-class model via the OpenAI Responses API**, which holds the thread of the conversation for the life of the session. When the session ends, that memory is released — the next time AI mode is switched on, Step 2 starts a brand-new session.

:::note[One session, one memory]
Continuity is per session. End a session and start a new one on the same chat, and the assistant begins fresh. This is intentional — it keeps a re-engaged or re-opened conversation from being polluted by stale context.
:::

---

## Recap

- A master **on/off switch** decides whether the Q-AI Bot is in control of a chat.
- Turning it **on** starts a **fresh session** with the project's system prompt and recent history.
- **One incoming message = one AI turn**: retrieve from the **[knowledge base](/docs/q-ai-bot/knowledge-base)**, reason, and return a **[structured reply](/docs/q-ai-bot/response-schema)**.
- After each turn, Texter routes: **continue**, **hit the message limit**, or **end**.
- On end, AI mode switches **off**, a reason is recorded, and the chat is **handed back** — see the **[Conversation Lifecycle](/docs/q-ai-bot/conversation-lifecycle)**.

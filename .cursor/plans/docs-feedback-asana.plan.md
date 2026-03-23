---
name: Docs feedback + n8n + Asana
overview: Floating feedback widget POSTs JSON to an n8n webhook (no extra deploy). n8n holds Asana credentials and creates tasks. Site only embeds the webhook URL at build time via FEEDBACK_WEBHOOK_URL.
todos:
  - id: docusaurus-floating-widget
    content: Layout wrapper + DocFeedback FAB/panel; POST JSON to customFields.feedbackWebhookUrl; honeypot; image resize
    status: completed
  - id: n8n-asana-workflow
    content: "You: Webhook (CORS + JSON) → Asana create task + attachment from base64; optional query secret on URL"
    status: pending
  - id: ci-readme
    content: GitHub Actions FEEDBACK_WEBHOOK_URL secret + README instructions
    status: completed
isProject: false
---

# Texter Docs — feedback widget → n8n → Asana

**Plan file:** `[.cursor/plans/docs-feedback-asana.plan.md](.cursor/plans/docs-feedback-asana.plan.md)`

## Architecture (chosen)

Browser **does not** hold the Asana token. The docs site `POST`s to your **n8n Webhook**; n8n creates the Asana task (and attachment). **No separate serverless service** beyond n8n you already run.

```mermaid
sequenceDiagram
  participant User as UserBrowser
  participant Site as DocusaurusSite
  participant N8n as n8nWebhook
  participant Asana as AsanaAPI

  User->>Site: Submit feedback widget
  Site->>N8n: POST application/json
  N8n->>Asana: Create task + attachment
  N8n-->>Site: 200 + CORS headers
```



**Requirements on n8n:** production URL reachable from visitors; webhook responds with **CORS** for `https://whatsper.github.io` (and `http://localhost:3000` for local testing if desired).

## Payload (JSON)

The widget sends:

- `category`, `scope` (`page` | `general`), `pageUrl`, `pageTitle`, `sectionLabel`, `quotedText`, `message`, optional `contact`
- `screenshot`: `{ mime, base64 }` or `null`
- `website`: honeypot (must be empty)
- `submittedAt`: ISO timestamp

## Repo implementation

- `[src/theme/Layout/index.tsx](src/theme/Layout/index.tsx)` — wraps `@theme-original/Layout`, mounts widget
- `[src/components/DocFeedback/](src/components/DocFeedback/)` — UI + `fetch`
- `[docusaurus.config.ts](docusaurus.config.ts)` — `customFields.feedbackWebhookUrl` from `process.env.FEEDBACK_WEBHOOK_URL`
- `[.github/workflows/deploy-github-pages.yml](.github/workflows/deploy-github-pages.yml)` — pass secret into `npm run build`
- `[README.md](README.md)` — env + n8n notes

## Your follow-up (n8n + Asana)

- Webhook → parse JSON → Asana node: title, notes, project/section, assignee → if `screenshot`, add attachment (binary from base64).
- Put a **non-guessable token** in the webhook path or query if you want basic obscurity.
- Mute the Asana **project** or tune notifications to limit email noise.


export interface ConfigItem {
  field: string;
  location: string;
  description: string;
  required: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  tags: string[];
  triggerEvents: string[];
  description: string;
  configuration: ConfigItem[];
  relatedScenarios?: string[];
  json: object;
}

// Human-readable display for trigger events
export const TRIGGER_DISPLAY: Record<string, string> = {
  'domain.message.created': 'Message Created',
  'domain.chat.resolved': 'Chat Resolved',
  'domain.chat.assigned': 'Chat Assigned',
  'domain.chat.pending': 'Chat Pending',
  'domain.chat.updated.externalBot': 'External Bot Changed',
  'app.bot.chat.setExternal': 'External Bot Changed',
  'app.message.statusRequest': 'Message Status Update',
  'app.scenarios.customTriggers.cron': 'Scheduled',
  'domain.channel.health.problem.resolved': 'Channel Health Alert',
  'domain.chat.unsubscribed': 'Chat Unsubscribed',
  'domain.chat.subscribed': 'Chat Subscribed',
};

// Human-readable display for action types
export const ACTION_DISPLAY: Record<string, string> = {
  request: 'Send Webhook',
  chatUpdateLabels: 'Update Labels',
  chatAssign: 'Assign Chat',
  sendMessage: 'Send Message',
  runBot: 'Run Bot',
  sendEmail: 'Send Email',
  chatUpdateExternalBot: 'Set External Bot',
  setData: 'Set Data Item',
  deleteData: 'Delete Data Item',
};

export const SCENARIOS: Scenario[] = [
  // ── Subscription scenarios ──────────────────────────────────────────────────
  {
    id: 'sub-all-messages',
    name: '(SUB) All Messages',
    tags: ['on-message', 'webhook', 'subscription'],
    triggerEvents: ['domain.message.created'],
    description:
      'Sends a webhook POST for every new message — both incoming and outgoing. The simplest way to mirror all WhatsApp traffic to an external system in real time.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the message and chat payload on every message event.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) All Messages',
      description: 'Sends a webhook for each new message (incoming & outgoing)',
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {'##provide': {provider: 'message', key: 'parent_chat'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'newMessage',
              eventData: {
                message: {'##provide': {provider: 'message', key: 'message'}},
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-new-incoming-messages',
    name: '(SUB) New Incoming Messages',
    tags: ['on-message', 'webhook', 'subscription'],
    triggerEvents: ['domain.message.created'],
    description:
      'Sends a webhook POST for every new incoming customer message. Useful for CRMs, notification services, AI pipelines, or any external system that needs to react to inbound messages.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the message and chat payload on each incoming message.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) New Incoming Messages',
      description: 'Sends a webhook for each new incoming message',
      triggerEvents: ['domain.message.created'],
      loaders: {
        afterConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {'##provide': {provider: 'message', key: 'parent_chat'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'direction == "incoming"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'newIncomingMessage',
              eventData: {
                message: {'##provide': {provider: 'message', key: 'message'}},
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-messages-with-specific-text',
    name: '(SUB) Messages with Specific Text',
    tags: ['on-message', 'webhook', 'subscription'],
    triggerEvents: ['domain.message.created'],
    description:
      'Sends a webhook only when an incoming message matches specific keywords. Configure the words list to trigger on exact phrases — useful for routing, escalation, or keyword-based integrations.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the matching message and chat payload.',
        required: true,
      },
      {
        field: 'Keywords to match',
        location: 'conditions[0][1].params.expression',
        description:
          'Replace `{{word1}}`, `{{word2}}` in the filtrex expression with the words you want to match (exact match on message text):\n\n```\ntext == "keyword1" or text == "keyword2"\n```\n\nAdd or remove `or` clauses to match more or fewer keywords.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Messages with Specific Text',
      description: 'Sends a webhook when a new incoming message includes a specific word(s).',
      triggerEvents: ['domain.message.created'],
      loaders: {
        afterConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {'##provide': {provider: 'message', key: 'parent_chat'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'direction == "incoming"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'text == "{{word1}}" or text == "{{word2}}"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'newMatchedMessage',
              eventData: {
                message: {'##provide': {provider: 'message', key: 'message'}},
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-messages-with-attachments',
    name: '(SUB) Messages with Attachments',
    tags: ['on-message', 'webhook', 'subscription'],
    triggerEvents: ['domain.message.created'],
    description:
      'Sends a webhook when an incoming message contains a media attachment — **image, video, document, audio, or sticker**. Useful for feeding media into processing pipelines or external storage.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the media message and chat payload.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Messages with Attachments',
      description:
        'Sends a webhook when a new incoming message includes a media item (image / video / document / audio / sticker)',
      triggerEvents: ['domain.message.created'],
      loaders: {
        afterConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {'##provide': {provider: 'message', key: 'parent_chat'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'direction == "incoming"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'type == "media"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'newMediaMessage',
              eventData: {
                message: {'##provide': {provider: 'message', key: 'message'}},
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-messages-failed-to-deliver',
    name: '(SUB) Messages Failed to Deliver',
    tags: ['on-message-status-change', 'webhook', 'subscription', 'failed-message'],
    triggerEvents: ['app.message.statusRequest'],
    description:
      'Sends a webhook when an outgoing message fails to deliver (blocked or rejected by Meta). Fires on status codes `4` and `5`. Useful for alerting, retry logic, or audit trails.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the failed message status payload including error details.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Messages Failed to Deliver',
      description: 'Sends a webhook when an outgoing message fails to deliver (blocked by Meta)',
      triggerEvents: ['app.message.statusRequest'],
      loaders: {
        afterConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              name: {'##provide': {provider: 'messageStatusRequest', key: 'chat.name'}},
              accountId: {'##provide': {provider: 'messageStatusRequest', key: 'chat.accountId'}},
              idByChannel: {'##provide': {provider: 'messageStatusRequest', key: 'chat.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 4,
              value: {'##provide': {provider: 'messageStatusRequest', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 5,
              value: {'##provide': {provider: 'messageStatusRequest', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'messageFailed',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
                error: '%messageStatusRequest:error%',
                timestamp: '%messageStatusRequest:timestamp%',
                externalId: '%messageStatusRequest:ids%',
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-message-status-changed',
    name: '(SUB) Message Status Changed',
    tags: ['on-message-status-change', 'webhook', 'subscription'],
    triggerEvents: ['app.message.statusRequest'],
    description:
      'Sends a webhook for every outgoing message status change — from **Sent** to **Delivered**, from **Delivered** to **Seen**, etc. Useful for tracking read receipts and delivery analytics in external systems.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your endpoint that will receive the status update including the current status code, timestamp, and message ID.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Messages Status Changed',
      description: 'Sends a webhook for all outgoing messages status changes (e.g., from "Delivered" to "Seen")',
      triggerEvents: ['app.message.statusRequest'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              name: {'##provide': {provider: 'messageStatusRequest', key: 'chat.name'}},
              accountId: {'##provide': {provider: 'messageStatusRequest', key: 'chat.accountId'}},
              idByChannel: {'##provide': {provider: 'messageStatusRequest', key: 'chat.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'messageStatusChanged',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
                messageStatus: '%messageStatusRequest:status%',
                error: '%messageStatusRequest:error%',
                timestamp: '%messageStatusRequest:timestamp%',
                externalId: '%messageStatusRequest:ids%',
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-chat-unsubscribed',
    name: '(SUB) Chat Unsubscribed',
    tags: ['on-unsubscribe', 'webhook', 'subscription'],
    triggerEvents: ['domain.chat.unsubscribed'],
    relatedScenarios: ['sub-chat-subscribed'],
    description:
      'Sends a webhook when a chat opts out of template messages — for example when the customer replies with an opt-out keyword such as **"הסר"**. Use this to sync suppression lists or update consent in external systems.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description:
          'Your endpoint that will receive the chat payload when the unsubscribe event fires.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Chat Unsubscribed',
      description:
        'Sends a webhook when a chat unsubscribed from receiving template messages (e.g., by replying "הסר")',
      triggerEvents: ['domain.chat.unsubscribed'],
      loaders: {},
      conditions: [],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'chatUnsubscribed',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-chat-subscribed',
    name: '(SUB) Chat Subscribed',
    tags: ['on-subscribe', 'webhook', 'subscription'],
    triggerEvents: ['domain.chat.subscribed'],
    relatedScenarios: ['sub-chat-unsubscribed'],
    description:
      'Sends a webhook when a chat subscribes or opts back in to receiving template messages. Use this to refresh consent or resume outreach in external systems.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description:
          'Your endpoint that will receive the chat payload when the subscribe event fires.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Chat Subscribed',
      description:
        'Sends a webhook when a chat subscribes or opts back in to receiving template messages.',
      triggerEvents: ['domain.chat.subscribed'],
      loaders: {},
      conditions: [],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'chatSubscribed',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sub-chat-assigned',
    name: '(SUB) Chat Assigned',
    tags: ['on-assign', 'webhook', 'subscription'],
    triggerEvents: ['domain.chat.assigned'],
    relatedScenarios: ['sub-chat-subscribed', 'sub-chat-unsubscribed'],
    description:
      'Sends a webhook when a chat is taken by an agent, including the full chat and a narrowed agent profile (`id`, `crmId`, `email`, `displayName`, `roles`). Use this to sync assignment with CRMs, routing tools, or custom backends.',
    configuration: [
      {
        field: 'Webhook URL',
        location: 'actions[0].params.url',
        description:
          'Your endpoint that will receive the chat and agent payload when a chat is assigned.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: '(SUB) Chat Assigned',
      description:
        'Sends a webhook when a chat is assigned, with full chat data and a narrowed agent object.',
      triggerEvents: ['domain.chat.assigned'],
      loaders: {},
      conditions: [],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              eventName: 'chatAssigned',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
                agent: {
                  id: {'##provide': {provider: 'agent', key: '_id'}},
                  crmId: {'##provide': {provider: 'agent', key: 'crmId'}},
                  email: {'##provide': {provider: 'agent', key: 'email'}},
                  displayName: {'##provide': {provider: 'agent', key: 'displayName'}},
                  roles: {'##provide': {provider: 'agent', key: 'roles'}},
                },
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },

  // ── Automation scenarios ────────────────────────────────────────────────────
  {
    id: 'assign-chat-on-echo-message',
    name: 'Assign Chat on Echo Message',
    tags: ['on-message', 'assign-chat'],
    triggerEvents: ['domain.message.created'],
    description:
      'Automatically assigns a chat to a specific agent when an **echo message** is detected — a message sent directly from the WhatsApp Business App (not through Texter). This is a system scenario auto-generated during onboarding for WhatsApp Business accounts.',
    configuration: [
      {
        field: 'Agent User ID',
        location: 'actions[0].params.agent',
        description:
          'The Texter internal user ID (`{{agentUserId}}`) of the agent to assign the chat to. Find this in your Texter team settings.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Assign chat on echo message',
      description: 'Assign chat to admin user when message was sent to chat directly from WhatsApp Business App',
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'channelAccount',
            alias: 'channel',
            params: {
              name: {'##provide': {provider: 'message', key: 'chatChannelInfo.name'}},
              accountId: {'##provide': {provider: 'message', key: 'chatChannelInfo.accountId'}},
            },
            confidentialData: false,
          },
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {'##provide': {provider: 'message', key: 'parent_chat'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Not equal',
              compareTo: true,
              value: {'##provide': {provider: 'channel', key: 'botDisable'}},
            },
            confidentialData: false,
          },
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 'outgoing',
              value: {'##provide': {provider: 'message', key: 'direction'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'exists(special.isEchoMessage) and special.isEchoMessage',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: true,
          },
          {
            name: 'compare',
            params: {
              comparison: 'Not equal',
              compareTo: 2,
              value: {'##provide': {provider: 'chat', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatAssign',
          params: {
            status: 'Assigned',
            agent: '{{agentUserId}}',
            chatId: {'##provide': {provider: 'message', key: 'parent_chat'}},
          },
          confidentialData: false,
        },
      ],
      tags: ['whatsapp-business-app-echo-assign'],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'assign-failed-label-on-message-error',
    name: 'Assign Failed Label on Message Error',
    tags: ['on-message-status-change', 'add-label', 'failed-message'],
    triggerEvents: ['app.message.statusRequest'],
    description:
      'Adds a label to a chat whenever a sent message fails to deliver (status `4` or `5`). Makes it easy to filter and follow up on chats with delivery failures from the Texter inbox.',
    configuration: [
      {
        field: 'Label ID',
        location: 'actions[0].params.labels[0]',
        description:
          'The label ID in Texter to apply when a message fails. Create this label in your Texter settings first. Default: `failed_message`.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Assign Failed Label on Message Error',
      description: 'Add the label failed_message to the chat whenever the sent message failed. Allows easy filtering',
      triggerEvents: ['app.message.statusRequest'],
      loaders: {
        afterConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              name: {'##provide': {provider: 'messageStatusRequest', key: 'chat.name'}},
              accountId: {'##provide': {provider: 'messageStatusRequest', key: 'chat.accountId'}},
              idByChannel: {'##provide': {provider: 'messageStatusRequest', key: 'chat.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 4,
              value: {'##provide': {provider: 'messageStatusRequest', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 5,
              value: {'##provide': {provider: 'messageStatusRequest', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateLabels',
          params: {
            operation: 'add',
            labels: ['failed_message'],
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'message-on-chat-assigned',
    name: 'Message on Chat Assigned',
    tags: ['on-assign', 'send-message'],
    triggerEvents: ['domain.chat.assigned'],
    description:
      "Sends an automatic greeting message to the customer the moment an agent takes a chat — but only if there was incoming activity in the last 24 hours (avoids sending to stale chats). The message dynamically includes the assigned agent's name via [data injection](/docs/YAML/Data%20Injection/Overview).",
    configuration: [
      {
        field: 'Message Text',
        location: 'actions[0].params.message.text',
        description:
          "The greeting message to send. Supports data injection — `%chat:agent.displayName%` is replaced with the assigned agent's name at send time.",
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Message on chat assigned',
      description: 'Send message to chat when that chat is assigned',
      triggerEvents: ['domain.chat.assigned'],
      loaders: {},
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Greater than',
              compareTo: '%time:now-1d("x")|parseInt%',
              value: {'##provide': {provider: 'chat', key: 'lastIncomingMessageTimestamp'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'sendMessage',
          params: {
            message: {
              text: 'Hi, this is %chat:agent.displayName% — how can I help you?',
              type: 'text',
            },
            chat: {
              name: 'whatsapp',
              '##provide': {provider: 'chat', key: 'channelInfo'},
              accountId: {'##provide': {provider: 'chat', key: 'channelInfo.accountId'}},
              id: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'remember-last-agent-on-chat-assigned',
    name: 'Remember Last Agent on Chat Assigned',
    tags: ['on-assign', 'data-storage'],
    triggerEvents: ['domain.chat.assigned'],
    description:
      "When an agent takes a chat, stores the agent's **UID** and **display name** into the **`ChatsLastAgent`** data storage collection, keyed by chat ID. Use this as a building block: a bot can later read who the last agent was via a `dataStorage` func node and act on it — e.g. auto-assign the chat back to that agent the next time the customer messages, or include the agent in a webhook payload. Records expire after **1 day** by default (max **7 days**, server-enforced).",
    configuration: [
      {
        field: 'Data Collection Name',
        location: 'actions[0].params.collection',
        description:
          'The data storage collection name. Default: `ChatsLastAgent`. Customize for namespacing or to avoid collisions with other scenarios. Allowed characters: `a-z`, `A-Z`, `0-9`, `_`, `-`. Max 100 chars.',
        required: false,
      },
      {
        field: 'Record TTL',
        location: 'actions[0].params.expiresIn, actions[0].params.expiresInUnit',
        description:
          'How long each record lives before expiring. Default: **1 day**. Units: `minutes`, `hours`, or `days`. **Server-enforced maximum: 7 days** (≈168 hours / 10080 minutes) — values above the cap are rejected. Pick a TTL that fits how long after a hand-off you still want to route follow-ups back to the same agent.',
        required: false,
      },
      {
        field: 'Stored Data Shape',
        location: 'actions[0].params.data',
        description:
          'The object written into storage. Defaults capture `latestAgentUid`, `latestAgentName`, and the assignment date. Add or remove fields per your use case — any [data injection](/docs/YAML/Data%20Injection/Overview) expression is supported.',
        required: false,
      },
    ],
    json: {
      version: 'v1',
      name: 'Set agent details when chat is taken',
      description: "When agent takes a chat, set ChatsLastAgent collection with the agents display name and uid",
      triggerEvents: ['domain.chat.assigned'],
      loaders: {},
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(agent.uid)',
              value: '%chat:chat%',
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'setData',
          params: {
            expiresInUnit: 'days',
            collection: 'ChatsLastAgent',
            key: '%chat:_id|toString%',
            data: {
              latestAgentUid: '%chat:agent.uid%',
              latestAgentName: '%chat:agent.displayName%',
              date: '%time:now("dd/MM/yyyy")%',
            },
            tags: [],
            expiresIn: 1,
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'alert-new-account-issue',
    name: 'Alert New Account Issue',
    tags: ['on-channel-event', 'send-email'],
    triggerEvents: ['domain.channel.health.problem.resolved'],
    description:
      'Sends a formatted HTML email alert whenever a **WhatsApp account health problem** is detected. Includes the error code, severity, affected functionality, and remediation instructions. Useful for proactive monitoring without needing a separate alerting system.',
    configuration: [
      {
        field: 'SMTP Email',
        location: 'actions[0].params.transport.auth.user, actions[0].params.from, actions[0].params.replyTo',
        description:
          'The Gmail address used to send the alert. Replace **all three** occurrences of `{{yourSmtpEmail}}`.',
        required: true,
      },
      {
        field: 'SMTP App Password',
        location: 'actions[0].params.transport.auth.pass',
        description:
          'Gmail **App Password** (not your account password). Generate one at **Google Account → Security → App Passwords**.',
        required: true,
      },
      {
        field: 'Recipient Email',
        location: 'actions[0].params.to',
        description: 'The email address that should receive the alert.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Alert New Account Issue',
      description: 'alert by mail when a new account error occurs on ',
      triggerEvents: ['domain.channel.health.problem.resolved'],
      loaders: {},
      conditions: [],
      actions: [
        {
          name: 'sendEmail',
          params: {
            cc: '',
            bcc: '',
            transport: {
              auth: {
                user: '{{yourSmtpEmail}}',
                pass: '{{yourSmtpAppPassword}}',
              },
              service: 'gmail',
            },
            replyTo: '{{yourSmtpEmail}}',
            priority: '',
            textEncoding: '',
            from: '{{yourSmtpEmail}}',
            sender: 'Texterchat',
            subject: 'עדכון על בעיה שאותרה בחשבון הווטסאפ שלך',
            to: '{{recipientEmail}}',
            html: [
              '<!doctype html>',
              '<html lang="he" dir="rtl">',
              '<head>',
              '  <meta charset="utf-8">',
              '  <meta name="viewport" content="width=device-width,initial-scale=1">',
              '  <title>Texter — התראת WhatsApp</title>',
              '  <style>',
              '    body {',
              '      margin: 0;',
              '      padding: 0;',
              '      background-color: #f4f6f8;',
              '      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
              '      direction: rtl;',
              '    }',
              '    table { border-collapse: collapse; }',
              '    .container {',
              '      width: 100%;',
              '      max-width: 640px;',
              '      margin: 0 auto;',
              '      background: #ffffff;',
              '      border-radius: 6px;',
              '      overflow: hidden;',
              '      box-shadow: 0 1px 4px rgba(0,0,0,0.06);',
              '    }',
              '    .header {',
              '      background: #0b67ff;',
              '      color: #ffffff;',
              '      padding: 16px 20px;',
              '      font-size: 17px;',
              '      font-weight: 600;',
              '      text-align: right;',
              '    }',
              '    .content {',
              '      padding: 20px;',
              '      color: #0f1724;',
              '      font-size: 15px;',
              '      line-height: 1.5;',
              '      text-align: right;',
              '    }',
              '    .kv { margin: 6px 0; }',
              '    .error-box {',
              '      background:#fff6f6;',
              '      border:1px solid #ffd6d6;',
              'padding:10px;',
              '      border-radius:4px;',
              '      margin:12px 0;',
              '      color:#7a1b1b;',
              '      font-size:14px;',
              '    }',
              '    .footer {',
              '      padding:14px 20px;',
              '      font-size:13px;',
              '      color:#68707a;',
              '      background:#fbfcfd;',
              '      text-align: right;',
              '    }',
              '  </style>',
              '</head>',
              '<body>',
              '  <table width=\\"100%\\" cellpadding="0" cellspacing="0" role="presentation">',
              '    <tr>',
              '      <td align="center" style="padding:16px;">',
              '        <table class="container" cellpadding="0" cellspacing="0" role="presentation">',
              '          <!-- Header -->',
              '          <tr>',
              '            <td class="header">התראת חשבון WhatsApp</td>',
              '          </tr>',
              '          <!-- Content -->',
              '          <tr>',
              '            <td class="content">',
              '              <p><strong>נושא:</strong> התראה: זוהתה בעיה בחשבון ה-WhatsApp שלך</p>',
              '              <p>שלום,</p>',
              '              <p>זיהינו בעיה בחשבון ה-WhatsApp שלך. פרטי התקלה:</p>',
              '              <div class="kv"><b>מספר חשבון:</b> %problem:accountId%</div>',
              '              <div class="kv"><b>תאריך:</b> %problem:startedAt%</div>',
              '              <div class="kv"><b>קוד שגיאה:</b> %problem:name%</div>',
              '              <div class="kv"><b>חומרה:</b> %problem:severity%</div>',
              '              <div class="kv"><b>סטטוס תפקוד:</b></div>',
              '              <div style="margin-right:12px;">',
              '                <div class="kv">• שליחת הודעות: %problem:impairedFunctionality|hbTpl("{{#when true \'eq\' send}}מושבת{{else}}תקין{{/when}}")%</div>',
              '                <div class="kv">• קבלת הודעות: %problem:impairedFunctionality|hbTpl("{{#when true \'eq\' receive}}מושבת{{else}}תקין{{/when}}")%</div>',
              '              </div>',
              '              <div style="margin-top:12px;">',
              '                <div><b>הודעת שגיאה:</b></div>',
              '                <div class="error-box">%problem:message%</div>',
              '              </div>',
              ' ',
              '              <div style="margin-top:8px;">',
              '                <div><b>הנחיות לטיפול:</b></div>',
              '                <div>%problem:instructions%</div>',
              '              </div>',
              ' ',
              '              <p style="margin-top:16px;">',
              '                אנא בדוק את החשבון שלך ',
              '                <a href="https://business.facebook.com/" target="_blank">במנהל החשבונות של Meta</a> ',
              '                ונסה לפתור את הבעיה בהתאם להנחיות למעלה.  ',
              '                במידה ואתה זקוק לעזרתנו, צוות התמיכה שלנו ישמח לסייע לך דרך WhatsApp: ',
              '                <a href="{whatsapp_support_link}" target="_blank">https://wa.me/972586640430</a>.',
              '              </p>',
              ' ',
              '              <p>בברכה,<br><strong>צוות Texter</strong></p>',
              '              ',
              '              <div style="margin-bottom: 20px;">',
              '                <img src="https://texterchat.com/wp-content/uploads/2021/04/texter-logo.png" alt="Texter Logo" style="height: 50px;" />',
              '              </div>',
              '            </td>',
              '          </tr>',
              '          <!-- Footer -->',
              '          <tr>',
              '            <td class="footer">',
              '              מייל זה מכיל מידע חשוב לגבי החשבון שלך. אם קיבלת הודעה זו בטעות, אנא צור קשר עם התמיכה.',
              '            </td>',
              '          </tr>',
              '        </table>',
              '      </td>',
              '    </tr>',
              '  </table>',
              '</body>',
              '</html>',
            ],
            attachments: [],
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },

  {
    id: 'run-bot-on-agent-resolve',
    name: 'Run Bot on Agent Resolve',
    tags: ['on-resolve', 'run-bot'],
    triggerEvents: ['domain.chat.resolved'],
    description:
      'When an agent (not the bot) resolves a chat, automatically resumes the bot from a configurable node — for example `close_chat` to run a closing branch. Equivalent to the agent manually clicking **"close and route to bot branch"**, but applied to every agent resolve.\n\n**Limitation:** the resume node is the same for all chats, so the post-resolve flow is identical for everyone.',
    configuration: [
      {
        field: 'Bot Resume Node',
        location: 'actions[0].params.nodeName',
        description:
          'The bot node name to resume from after the agent resolves the chat. Must match a node in your [bot YAML](/docs/YAML/Overview) (e.g. `close_chat`).',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Run close_chat after agent resolve',
      triggerEvents: ['domain.chat.resolved'],
      loaders: {},
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(agent.uid)',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'runBot',
          params: {
            nodeName: 'close_chat',
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },

  // ── SLA scenarios ───────────────────────────────────────────────────────────
  {
    id: 'sla-set-item-on-incoming-message',
    name: '(SLA) Set Item On Incoming Message',
    tags: ['sla', 'on-message', 'data-storage'],
    triggerEvents: ['domain.message.created'],
    description:
      'When a customer sends an incoming message in an active chat (**pending**, **assigned**, or **resolved**), and no SLA record exists yet, writes one with the current timestamp and chat id so other SLA scenarios can later add/remove the SLA label.',
    configuration: [
      {
        field: 'Data Collection Name',
        location: 'actions[0].params.collection, loaders.beforeConditions[1].params.collection',
        description:
          'The [data store](/docs/YAML/Data%20Injection/Overview) collection used to track SLA timestamps per chat. Keep the **same value across all SLA scenarios**. Default: `sla_chats_collection`.',
        required: false,
      },
      {
        field: 'Record TTL',
        location: 'actions[0].params.expiresIn, actions[0].params.expiresInUnit',
        description:
          'How long the SLA record should live before expiring automatically (default: 24 hours).',
        required: false,
      },
    ],
    json: {
      version: 'v1',
      name: '(SLA) Set Item On Incoming Message',
      description:
        'when customer sends a new message in a chat in pending or taken chat, add record to store',
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {
              id: {
                '##provide': {provider: 'message', key: 'parent_chat'},
              },
            },
            confidentialData: false,
          },
          {
            name: 'getData',
            alias: 'record',
            params: {
              collection: 'sla_chats_collection',
              key: {
                '##provide': {provider: 'message', key: 'chatChannelInfo.id'},
              },
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              value: '%message:direction%',
              comparison: 'Equal',
              compareTo: 'incoming',
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'empty(record.data.timestamp)',
              value: {record: '%record:record%'},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'status in (1,2,3)',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'setData',
          params: {
            expiresInUnit: 'hours',
            collection: 'sla_chats_collection',
            data: {
              timestamp: '%message:timestamp%',
              chatId: '%chat:_id%',
            },
            tags: [],
            expiresIn: 24,
            key: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sla-set-item-on-chat-pending',
    name: '(SLA) Set Item On Set to pending',
    tags: ['sla', 'on-pending', 'data-storage'],
    triggerEvents: ['domain.chat.pending'],
    description:
      'When a chat is set to **pending** status and no SLA record exists yet, writes one with the current timestamp and chat id so other SLA scenarios can later add/remove the SLA label.',
    configuration: [
      {
        field: 'Data Collection Name',
        location: 'actions[0].params.collection, loaders.beforeConditions[0].params.collection',
        description:
          'The [data store](/docs/YAML/Data%20Injection/Overview) collection used to track SLA timestamps per chat. Keep the **same value across all SLA scenarios**. Default: `sla_chats_collection`.',
        required: false,
      },
      {
        field: 'Record TTL',
        location: 'actions[0].params.expiresIn, actions[0].params.expiresInUnit',
        description:
          'How long the SLA record should live before expiring automatically (default: 24 hours).',
        required: false,
      },
    ],
    json: {
      version: 'v1',
      name: '(SLA) Set Item On Set to pending',
      description:
        'when customer sends a new message in a chat in pending or taken chat, add record to store',
      triggerEvents: ['domain.chat.pending'],
      loaders: {
        beforeConditions: [
          {
            name: 'getData',
            alias: 'record',
            params: {
              collection: 'sla_chats_collection',
              key: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'empty(record.data.timestamp)',
              value: {record: '%record:record%'},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'status in (1,2,3)',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'setData',
          params: {
            expiresInUnit: 'hours',
            collection: 'sla_chats_collection',
            data: {timestamp: '%time:now("x")%', chatId: '%chat:_id%'},
            tags: [],
            expiresIn: 24,
            key: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sla-apply-sla-label-by-cron',
    name: '(SLA) Set SLA Label For all Records',
    tags: ['sla', 'scheduled', 'add-label', 'data-storage'],
    triggerEvents: ['app.scenarios.customTriggers.cron'],
    description:
      'On a cron schedule, scans all stored SLA records and adds the `sla` label to chats whose timer exceeded the threshold (default: **20 minutes**). This is the enforcement step that marks chats as breached/late.',
    configuration: [
      {
        field: 'Cron Schedule',
        location: 'Nihul → Customer Config',
        description:
          'Add this entry to the customer config `cron.schedule` array in Nihul:\n\n```json\n{\n  "task": "ScenariosCustomTriggerCronTask",\n  "expr": "*/10 * * * *",\n  "params": { "name": "sla_scenario" }\n}\n```\n\nThe scenario uses the cron name to filter executions, so `params.name` must match exactly.',
        required: true,
      },
      {
        field: 'Cron Name',
        location: 'conditions[0][0].params.compareTo (cron.name)',
        description:
          'Must match the cron `params.name` registered in Nihul. Default in this template: `sla_scenario`.',
        required: true,
      },
      {
        field: 'SLA Threshold',
        location: 'conditions[0][1].params.expression',
        description:
          'Adjust the time window by changing `now-20m` to your desired threshold. Default is **20 minutes** but should be set per customer — e.g. `now-10m`, `now-30m`.',
        required: true,
      },
      {
        field: 'Data Collection Name',
        location: 'loaders.beforeConditions[0].params.collection',
        description:
          'The [data store](/docs/YAML/Data%20Injection/Overview) collection used to track SLA timestamps per chat. Keep the **same value across all SLA scenarios**. Default: `sla_chats_collection`.',
        required: false,
      },
    ],
    json: {
      version: 'v1.1',
      name: '(SLA) Set SLA Label For all Records',
      description: 'set record for all records in store',
      triggerEvents: ['app.scenarios.customTriggers.cron'],
      loaders: {
        beforeConditions: [
          {
            name: 'listData',
            alias: 'records',
            params: {
              limit: 50,
              skip: 0,
              collection: 'sla_chats_collection',
              tags: [],
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              value: 'sla_scenario',
              comparison: 'Equal',
              compareTo: {'##provide': {provider: 'cron', key: 'name'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression:
                'not empty(record.data.chatId) and record.data.timestamp < timestamp',
              value: {
                timestamp: '%time:now-20m("x")|parseInt%',
                record: {'##provide': {provider: 'item', key: '__item'}},
              },
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateLabels',
          params: {
            chatId: '%item:data.chatId%',
            operation: 'add',
            labels: ['sla'],
          },
          confidentialData: false,
        },
      ],
      loops: [
        {
          loop: {
            type: 'foreach',
            as: 'item',
            input: '%records:items%',
            confidentialData: false,
            foreachMode: 'parallel',
            concurency: 5,
          },
          position: 'beforeConditions',
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'sla-remove-item-on-chat-resolved',
    name: '(SLA) Remove Item On Resolve Chat',
    tags: ['sla', 'on-resolve', 'add-label', 'data-storage'],
    triggerEvents: ['domain.chat.resolved'],
    description:
      'When a chat is resolved, clears the SLA tracking record and removes the `sla` label (if present). Keeps the data store clean and ensures resolved chats are not shown as SLA-breached.',
    configuration: [
      {
        field: 'Data Collection Name',
        location: 'actions[1].params.collection, loaders.beforeConditions[0].params.collection',
        description:
          'The [data store](/docs/YAML/Data%20Injection/Overview) collection used to track SLA timestamps per chat. Keep the **same value across all SLA scenarios**. Default: `sla_chats_collection`.',
        required: false,
      }
    ],
    json: {
      version: 'v1',
      name: '(SLA) Remove Item On Resolve Chat',
      description: '',
      triggerEvents: ['domain.chat.resolved'],
      loaders: {
        beforeConditions: [
          {
            name: 'getData',
            alias: 'record',
            params: {
              collection: 'sla_chats_collection',
              key: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'not empty(record.data.timestamp)',
              value: {record: '%record:record%'},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateLabels',
          params: {
            operation: 'remove',
            labels: ['sla'],
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'deleteData',
          params: {
            collection: 'sla_chats_collection',
            key: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: true},
    },
  },
  {
    id: 'sla-remove-item-on-outgoing-message',
    name: '(SLA) Remove Item On outgoing Message',
    tags: ['sla', 'on-message', 'add-label', 'data-storage'],
    triggerEvents: ['domain.message.created'],
    description:
      'When an agent sends an outgoing message in an active chat, clears the SLA tracking record and removes the `sla` label. Marks the chat as **responded** and resets SLA tracking until the next incoming message.',
    configuration: [
      {
        field: 'Data Collection Name',
        location: 'actions[0].params.collection, loaders.beforeConditions[1].params.collection',
        description:
          'The [data store](/docs/YAML/Data%20Injection/Overview) collection used to track SLA timestamps per chat. Keep the **same value across all SLA scenarios**. Default: `sla_chats_collection`.',
        required: false,
      },
    ],
    json: {
      version: 'v1',
      name: '(SLA) Remove Item On outgoing Message',
      description: '',
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {id: {'##provide': {provider: 'message', key: 'parent_chat'}}},
            confidentialData: false,
          },
          {
            name: 'getData',
            alias: 'record',
            params: {
              collection: 'sla_chats_collection',
              key: {'##provide': {provider: 'message', key: 'chatChannelInfo.id'}},
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'status in (1,2)',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
          {
            name: 'compare',
            params: {
              value: '%message:direction%',
              comparison: 'Equal',
              compareTo: 'outgoing',
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'not empty(record.data.timestamp)',
              value: {record: '%record:record%'},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'deleteData',
          params: {
            collection: 'sla_chats_collection',
            key: {'##provide': {provider: 'message', key: 'chatChannelInfo.id'}},
          },
          confidentialData: false,
        },
        {
          name: 'chatUpdateLabels',
          params: {
            operation: 'remove',
            labels: ['sla'],
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: true},
    },
  },

  // ── CRM / Salesforce scenarios ──────────────────────────────────────────────
  {
    id: 'update-service-request-on-chat-taken',
    name: 'Update Service Request on Chat Taken',
    tags: ['on-assign', 'crm-update', 'salesforce'],
    triggerEvents: ['domain.chat.assigned'],
    description:
      "When an agent takes a chat in Texter, updates the `OwnerId` of the linked Salesforce Service Request to match the agent's CRM ID. Requires the chat to have a CRM opportunity ID set via the [Salesforce adapter](/docs/YAML/Adapters/Salesforce). Uses OAuth for authentication.",
    configuration: [
      {
        field: 'Salesforce Instance URL',
        location: 'actions[0].params.url',
        description:
          'Your Salesforce instance URL with the object type path. Replace `{{yourOrg}}` (e.g. `acme.my.salesforce.com`) and `{{YourObject__c}}` with your actual Salesforce setup.',
        required: true,
      },
      {
        field: 'CRM Opportunity Field',
        location: 'conditions[0][0].params.expression',
        description:
          'The dot-notation path to the CRM field holding the linked service request ID. Default: `crmData.opportunityid`.',
        required: false,
      },
    ],
    json: {
      version: 'v1',
      name: 'Update Service Request on chat taken',
      description: "When agent takes the chat in Texter, update the Owner ID in the service request in Salesforce",
      triggerEvents: ['domain.chat.assigned'],
      loaders: {
        beforeConditions: [],
        afterConditions: [
          {
            name: 'oauth',
            alias: 'oauth',
            params: {service: 'salesforce'},
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(crmData.opportunityid)',
              value: '%chat:chat%',
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: 'https://{{yourOrg}}.my.salesforce.com/services/data/v62.0/sobjects/{{YourObject__c}}/%chat:crmData.opportunityid%',
            method: 'patch',
            keepResponse: true,
            json: true,
            headers: {Authorization: 'Bearer %oauth:accessToken%'},
            data: {OwnerId: '%agent:crmId%'},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'close-service-request-on-resolve',
    name: 'Close Service Request on Chat Resolved',
    tags: ['on-resolve', 'crm-update', 'salesforce'],
    triggerEvents: ['domain.chat.resolved'],
    description:
      'When a chat is resolved in Texter, closes the linked Salesforce Service Request by updating its status field. Only fires if the chat has an associated CRM opportunity ID. Pairs well with **Update Service Request on Chat Taken**.',
    configuration: [
      {
        field: 'Salesforce Instance URL',
        location: 'actions[0].params.url',
        description:
          'Your Salesforce instance URL with the object type. Replace `{{yourOrg}}` and `{{YourObject__c}}` with your actual Salesforce setup.',
        required: true,
      },
      {
        field: 'Closed Status Value',
        location: 'actions[0].params.data',
        description:
          'The field name and value that marks the record as closed in Salesforce, e.g. `{ "Status__c": "Closed" }`.',
        required: true,
      },
    ],
    relatedScenarios: ['update-service-request-on-chat-taken'],
    json: {
      version: 'v1',
      name: 'Close Service Request on resolve chat',
      triggerEvents: ['domain.chat.resolved'],
      loaders: {
        beforeConditions: [],
        afterConditions: [
          {
            name: 'oauth',
            alias: 'oauth',
            params: {service: 'salesforce'},
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(crmData.opportunityid)',
              value: '%chat:chat%',
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: 'https://{{yourOrg}}.my.salesforce.com/services/data/v62.0/sobjects/{{YourObject__c}}/%chat:crmData.opportunityid%',
            method: 'patch',
            keepResponse: true,
            json: true,
            headers: {Authorization: 'Bearer %oauth:accessToken%'},
            data: {'Status__c': 'Closed'},
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },

  // ── Q-AI suite ──────────────────────────────────────────────────────────────
  {
    id: 'q-ai-turn-on-ai-bot',
    name: 'Q-AI: Turn On AI Bot',
    tags: ['on-external-bot', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.chat.updated.externalBot', 'app.bot.chat.setExternal'],
    description:
      'Part of the **Q-AI suite**. When `externalBot` is enabled on a chat, forwards the full chat object and current session messages to your AI service as a `setExternalTrue` event — the entry point of the AI handoff flow.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[0].params.url',
        description:
          'Your AI service webhook that receives the `setExternalTrue` event with the chat and session messages when AI mode is turned on.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Turn On AI Bot',
      description: 'When external bot is set to true, forward the chat and current session messages to AI',
      triggerEvents: ['domain.chat.updated.externalBot', 'app.bot.chat.setExternal'],
      loaders: {
        afterConditions: [
          {
            name: 'chatMessages',
            alias: 'messages',
            params: {
              chatId: {'##provide': {provider: 'chat', key: '_id'}},
            },
            confidentialData: false,
          },
          {
            name: 'environment',
            alias: 'env',
            params: {},
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalTrue',
              eventData: {
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
                messages:
                  '%messages:botSession|map("type::type","timestamp::timestamp","text::text","media::media","direction::direction","list::listOptions","buttons::buttonsOptions","special::specialExtraInfo","postback::postback")%',
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'q-ai-forward-incoming-message',
    name: 'Q-AI: Forward Incoming Message to AI',
    tags: ['on-message', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.message.created'],
    description:
      'Part of the **Q-AI suite**. When a new incoming message arrives and `externalBot` is active, forwards the message and chat objects to the AI service as a `newIncomingMessage` event.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[0].params.url',
        description:
          'Your AI service webhook that receives the `newIncomingMessage` payload for each inbound message while AI mode is active.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Forward Incoming Message to AI',
      description: 'When a new incoming message is received and external bot is set to true, forward the message and the chat objects to AI',
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {id: {'##provide': {provider: 'message', key: 'parent_chat'}}},
            confidentialData: false,
          },
        ],
        afterConditions: [
          {
            name: 'environment',
            alias: 'env',
            params: {},
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression: 'direction == "incoming"',
              value: {'##provide': {provider: 'message', key: 'message'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'newIncomingMessage',
              eventData: {
                message: {'##provide': {provider: 'message', key: 'message'}},
                chat: {'##provide': {provider: 'chat', key: 'chat'}},
              },
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'q-ai-end-ai-session-run-bot',
    name: 'Q-AI: End AI Session & Run Bot',
    tags: ['on-external-bot', 'webhook', 'run-bot', 'ai-bot'],
    triggerEvents: ['domain.chat.updated.externalBot', 'app.bot.chat.setExternal'],
    description:
      'Part of the **Q-AI suite**. When `externalBot` is disabled and the chat is in **with bot** status, resumes the Texter bot from a specified node and notifies the AI service with `setExternalFalse`. Handles the handoff back from AI to Texter.',
    configuration: [
      {
        field: 'Bot Resume Node',
        location: 'actions[0].params.nodeName',
        description:
          'The bot node name to resume from when returning from AI. Must match a node in your [bot YAML](/docs/YAML/Overview) (e.g. `back_to_texter`).',
        required: true,
      },
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description:
          'Your AI service webhook that receives the `setExternalFalse` event to close the AI session.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI End AI Session & Run Bot',
      description: "When externalBot is set to false and the chat status is 'with bot', close the AI session and run the bot",
      triggerEvents: ['domain.chat.updated.externalBot', 'app.bot.chat.setExternal'],
      loaders: {
        afterConditions: [
          {name: 'environment', alias: 'env', params: {}, confidentialData: false},
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: false,
              value: {'##provide': {provider: 'chat', key: 'externalBot'}},
            },
            confidentialData: false,
          },
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 0,
              value: {'##provide': {provider: 'chat', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'runBot',
          params: {
            nodeName: 'back_to_texter',
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalFalse',
              eventData: {chat: {'##provide': {provider: 'chat', key: 'chat'}}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: true},
    },
  },
  {
    id: 'q-ai-disable-after-template-message',
    name: 'Q-AI: Disable External Bot After Template Message',
    tags: ['on-message', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.message.created'],
    description:
      'Part of the **Q-AI suite**. If AI mode is active and a template message is sent (chat moves to **bulk** status), automatically disables `externalBot` and notifies the AI service with `setExternalFalse`. Prevents AI from handling a chat that was just contacted via a template.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description: 'Your AI service webhook that receives the `setExternalFalse` event.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Disable External Bot after Template Message',
      description: "If external bot is true and a template message is sent (chat status = 'bulk'), set external bot to false and close AI session",
      triggerEvents: ['domain.message.created'],
      loaders: {
        beforeConditions: [
          {
            name: 'chat',
            alias: 'chat',
            params: {id: {'##provide': {provider: 'message', key: 'parent_chat'}}},
            confidentialData: false,
          },
        ],
        afterConditions: [
          {name: 'environment', alias: 'env', params: {}, confidentialData: false},
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 4,
              value: {'##provide': {provider: 'chat', key: 'status'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateExternalBot',
          params: {
            externalBot: false,
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalFalse',
              eventData: {chat: {'##provide': {provider: 'chat', key: 'chat'}}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'q-ai-disable-after-manual-resolve',
    name: 'Q-AI: Disable External Bot After Manual Resolve',
    tags: ['on-resolve', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.chat.resolved'],
    description:
      'Part of the **Q-AI suite**. When a chat is resolved manually in Texter while AI mode is active, disables `externalBot` and notifies the AI service with `setExternalFalse` to end the session.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description:
          'Your AI service webhook that receives the `setExternalFalse` event when a chat is manually resolved.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-assign',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Disable External Bot After Manual Resolve',
      description: 'When chat is resolved within Texter and externalBot is true, set externalBot to false and forward the event',
      triggerEvents: ['domain.chat.resolved'],
      loaders: {
        afterConditions: [
          {name: 'environment', alias: 'env', params: {}, confidentialData: false},
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateExternalBot',
          params: {
            externalBot: false,
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalFalse',
              eventData: {chat: {'##provide': {provider: 'chat', key: 'chat'}}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'q-ai-disable-after-manual-assign',
    name: 'Q-AI: Disable External Bot After Manual Assign',
    tags: ['on-assign', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.chat.assigned'],
    description:
      'Part of the **Q-AI suite**. When an agent manually takes a chat while AI mode is active, disables `externalBot` and notifies the AI service with `setExternalFalse`. Ensures the AI stops handling a chat once a human steps in.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description:
          'Your AI service webhook that receives the `setExternalFalse` event when a chat is manually assigned.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-on-chat-pending',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Disable External Bot After Manual Assign',
      description: 'When chat is assigned within Texter and externalBot is true, set externalBot to false and forward the event',
      triggerEvents: ['domain.chat.assigned'],
      loaders: {
        afterConditions: [
          {name: 'environment', alias: 'env', params: {}, confidentialData: false},
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateExternalBot',
          params: {
            externalBot: false,
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalFalse',
              eventData: {chat: {'##provide': {provider: 'chat', key: 'chat'}}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'q-ai-disable-on-chat-pending',
    name: 'Q-AI: Disable External Bot On Pending Chat',
    tags: ['on-pending', 'webhook', 'ai-bot'],
    triggerEvents: ['domain.chat.pending'],
    description:
      'Part of the **Q-AI suite**. When a chat is set to **pending** status (e.g. an agent manually reassigns the chat to a different agent while AI mode is active), disables `externalBot` and notifies the AI service with `setExternalFalse`. Covers the handoff case where the AI session should end because a human took over via the pending workflow.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description:
          'Your AI service webhook that receives the `setExternalFalse` event when a chat is set to pending while AI mode was active.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
    ],
    json: {
      version: 'v1',
      name: 'Q-AI Disable External Bot On Pending Chat',
      description: 'When chat is set to pending and externalBot is true, set externalBot to false and forward the event',
      triggerEvents: ['domain.chat.pending'],
      loaders: {
        afterConditions: [
          {name: 'environment', alias: 'env', params: {}, confidentialData: false},
        ],
      },
      conditions: [
        [
          {
            name: 'filtrex',
            params: {
              expression: 'exists(externalBot) and externalBot',
              value: {'##provide': {provider: 'chat', key: 'chat'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatUpdateExternalBot',
          params: {
            externalBot: false,
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: '{{yourAIWebhookURL}}',
            method: 'post',
            json: true,
            data: {
              projectId: '%env:projectId|replace("texter-", "")%',
              eventName: 'setExternalFalse',
              eventData: {chat: {'##provide': {provider: 'chat', key: 'chat'}}},
            },
          },
          confidentialData: false,
        },
      ],
      options: {unorderedActions: false},
    },
  },

  // ── Scheduled scenarios ─────────────────────────────────────────────────────
  {
    id: 'end-of-day-closing-message',
    name: 'End-of-Day Closing Message',
    tags: ['scheduled', 'send-message'],
    triggerEvents: ['app.scenarios.customTriggers.cron'],
    description:
      'Finds all pending chats active within the last **~9 hours** at the end of the business day and sends a notification that a response will be provided the following business day, excluding those with the `waiting_for_customer` label. Runs on a custom cron schedule configured per customer in Nihul and sends up to **10 messages concurrently**.',
    configuration: [
      {
        field: 'Cron Schedule',
        location: 'Nihul → Customer Config',
        description:
          'Add to the `cron.schedule` array in the customer config in Nihul:\n\n```json\n{\n  "task": "ScenariosCustomTriggerCronTask",\n  "expr": "30 18 * * 0-4",\n  "params": { "name": "end-of-day-message-sending" }\n}\n```\n\nThe example runs **Sun–Thu at 18:30** — adjust the cron expression per customer request.',
        required: true,
      },
      {
        field: 'Exclude Label',
        location: 'loaders.afterConditions[0].params.filters[0].labels.exclude[0]',
        description:
          'Label ID to skip — chats tagged with this label won\'t receive the message. Default: `waiting_for_customer`.',
        required: false,
      },
      {
        field: 'Time Window',
        location: 'loaders.afterConditions[0].params.filters[0].lastMessageTimestamp.after',
        description:
          'How far back to look for pending chats. Defaults to **9 hours** (`now-9h`). Can be adjusted per customer but must stay under 24 hours.',
        required: false,
      },
      {
        field: 'Message Text',
        location: 'actions[0].params.message.text',
        description:
          'The closing message body to send. Customize per customer. Supports the full [message payload](/docs/YAML/Types/Notify) (text, media, template).',
        required: false,
      },
    ],
    json: {
      version: 'v1.1',
      name: 'End-of-day closing message',
      description: 'On cron trigger, find pending chats active in last ~9h and send a closing message.',
      triggerEvents: ['app.scenarios.customTriggers.cron'],
      loaders: {
        afterConditions: [
          {
            name: 'chatsList',
            alias: 'chats',
            params: {
              limit: 1000,
              skip: 0,
              filters: [
                {
                  lastMessageTimestamp: {
                    after: '%time:now-9h("x")|parseInt%',
                    before: '%time:now("x")|parseInt%',
                  },
                  status: ['PENDING'],
                  channel: [],
                  department: [],
                  agent: [],
                  labels: {
                    include: [],
                    exclude: ['waiting_for_customer'],
                  },
                },
              ],
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 'end-of-day-message-sending',
              value: {'##provide': {provider: 'cron', key: 'name'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'sendMessage',
          params: {
            message: {
              type: 'text',
              text: 'היי, ראינו את ההודעה אבל לא הספקנו לענות, נחזור אליכם ביום העסקים הבא',
            },
            chat: {
              name: {'##provide': {provider: 'chat', key: 'channelInfo.name'}},
              accountId: {'##provide': {provider: 'chat', key: 'channelInfo.accountId'}},
              id: {'##provide': {provider: 'chat', key: 'channelInfo.id'}},
            },
          },
          confidentialData: false,
        },
      ],
      loops: [
        {
          loop: {
            type: 'foreach',
            as: 'chat',
            input: {'##provide': {provider: 'chats', key: 'chats'}},
            confidentialData: false,
            foreachMode: 'parallel',
            concurency: 10,
          },
          position: 'beforeActions',
        },
      ],
      options: {unorderedActions: false},
    },
  },
  {
    id: 'handle-passive-marketing-chats',
    name: 'Handle Passive Marketing Chats',
    tags: ['scheduled', 'assign-chat', 'crm-update', 'webhook', 'rapid'],
    triggerEvents: ['app.scenarios.customTriggers.cron'],
    description:
      'Runs once a day to find **BULK** chats from the previous day whose last message was one of the configured marketing templates. For each matching chat, assigns it to the `sales` department with **Pending** status and updates the lead status in **Rapid CRM**.\n\nDesigned for Rapid CRM customers using the **Tyntec** WhatsApp provider — see the configuration items below for the non-Tyntec variant.',
    configuration: [
      {
        field: 'Cron Schedule',
        location: 'Nihul → Customer Config',
        description:
          'Add to the `cron.schedule` array in the customer config in Nihul:\n\n```json\n{\n  "task": "ScenariosCustomTriggerCronTask",\n  "expr": "0 8 * * *",\n  "params": { "name": "reassign-and-update-passive-bulk-chats" }\n}\n```\n\nThe example runs **daily at 08:00** — adjust the cron expression per customer request.',
        required: true,
      },
      {
        field: 'Rapid API URL',
        location: 'actions[1].params.url',
        description:
          'Replace the subdomain with the customer\'s Rapid subdomain. Example:\n\n```\nhttps://{{rapidSubdomain}}.rapid-image.net/api/import/leads/%chat:crmData.leadExternalId%\n```\n\n**Prerequisite:** the chat\'s `crmData` must contain `leadExternalId` (populated when the bot creates the lead) and `leadSource`. Without these the `request` action silently fails — verify `crmData` is populated before enabling.',
        required: true,
      },
      {
        field: 'Marketing Template IDs',
        location: 'conditions[0][1].params.expression',
        description:
          'Ask the customer which templates should trigger this flow and update the ID list accordingly.\n\nTo match any template (no ID filtering), simplify the filtrex to:\n\n```\nexists(special.whatsappTyntec.template)\n```',
        required: true,
      },
      {
        field: 'Sales Department ID',
        location: 'actions[0].params.departmentId',
        description: 'The department ID to assign matching chats to. Defaults to `sales`.',
        required: false,
      },
      {
        field: 'Rapid Update Payload',
        location: 'actions[1].params.data',
        description:
          'Key-value pairs to send to the Rapid API on the matched lead. Any fields the customer\'s Rapid API accepts — not limited to `status`.',
        required: false,
      },
      {
        field: 'WhatsApp Provider (non-Tyntec)',
        location: 'conditions[0][1].params.expression',
        description:
          'This scenario is built for the Tyntec provider. For other providers, replace the filtrex expression with:\n\n```\nexists(special.whatsapp.template) and (special.whatsapp.template.name in ("template_name_1", "template_name_2"))\n```\n\nOr to match any template:\n\n```\nexists(special.whatsapp.template)\n```',
        required: false,
      },
    ],
    json: {
      version: 'v1.1',
      name: 'Handle Passive Marketing Chats',
      description:
        'Once a day, check yesterdays chats that are still in bulk where the last template message sent fits one of the marketing messages, and assign to sales department + update lead status in Rapid',
      triggerEvents: ['app.scenarios.customTriggers.cron'],
      loaders: {
        beforeConditions: [
          {
            name: 'chatsList',
            alias: 'chats',
            params: {
              limit: 1000,
              skip: 0,
              filters: [
                {
                  lastMessageTimestamp: {
                    before: '%time:now-16h("x")|parseInt%',
                    after: '%time:now-41h("x")|parseInt%',
                  },
                  status: ['BULK'],
                  channel: [],
                  department: [],
                  agent: [],
                  labels: {
                    include: [],
                    exclude: [],
                  },
                },
              ],
            },
            confidentialData: false,
          },
        ],
      },
      conditions: [
        [
          {
            name: 'compare',
            params: {
              comparison: 'Equal',
              compareTo: 'reassign-and-update-passive-bulk-chats',
              value: {'##provide': {provider: 'cron', key: 'name'}},
            },
            confidentialData: false,
          },
          {
            name: 'filtrex',
            params: {
              expression:
                'exists(special.whatsappTyntec.template) and (special.whatsappTyntec.template.templateId in ("inbox_marketing_108", "inbox_utility_111", "inbox_marketing_109", "inbox_marketing_107"))',
              value: {'##provide': {provider: 'chat', key: 'lastMessage'}},
            },
            confidentialData: false,
          },
        ],
      ],
      actions: [
        {
          name: 'chatAssign',
          params: {
            status: 'Pending',
            departmentId: 'sales',
            chatId: {'##provide': {provider: 'chat', key: '_id'}},
          },
          confidentialData: false,
        },
        {
          name: 'request',
          params: {
            url: 'https://{{rapidSubdomain}}.rapid-image.net/api/import/leads/%chat:crmData.leadExternalId%',
            method: 'patch',
            json: true,
            headers: {
              Authorization: 'RoAuth LeadSource=%chat:crmData.leadSource%',
            },
            data: {
              status: 93,
            },
          },
          confidentialData: false,
        },
      ],
      loops: [
        {
          loop: {
            type: 'foreach',
            as: 'chat',
            input: {'##provide': {provider: 'chats', key: 'chats'}},
            confidentialData: false,
            foreachMode: 'parallel',
            concurency: 10,
          },
          position: 'beforeConditions',
        },
      ],
      options: {
        unorderedActions: true,
      },
    },
  },
];

export const ALL_TAGS: string[] = Array.from(
  new Set(SCENARIOS.flatMap((s) => s.tags)),
).sort();

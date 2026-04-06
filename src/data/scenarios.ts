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
  'domain.chat.updated.externalBot': 'External Bot Changed',
  'app.bot.chat.setExternal': 'External Bot Changed',
  'app.message.statusRequest': 'Message Status Update',
  'app.scenarios.customTriggers.cron': 'Scheduled',
  'domain.channel.health.problem.resolved': 'Channel Health Alert',
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
  setData: 'Store Data',
  deleteData: 'Delete Data',
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
          'Replace {{word1}}, {{word2}} in the filtrex expression with the words you want to match (exact match on message text). Add or remove conditions to match more or fewer keywords.',
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
      'Sends a webhook when an incoming message contains a media attachment — image, video, document, audio, or sticker. Useful for feeding media into processing pipelines or external storage.',
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
    tags: ['on-message-status-change', 'webhook', 'subscription'],
    triggerEvents: ['app.message.statusRequest'],
    description:
      'Sends a webhook when an outgoing message fails to deliver (blocked or rejected by Meta). Fires on status codes 4 and 5. Useful for alerting, retry logic, or audit trails.',
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
      'Sends a webhook for every outgoing message status change — from Sent to Delivered, from Delivered to Seen, etc. Useful for tracking read receipts and delivery analytics in external systems.',
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

  // ── Automation scenarios ────────────────────────────────────────────────────
  {
    id: 'assign-chat-on-echo-message',
    name: 'Assign Chat on Echo Message',
    tags: ['on-message', 'assign-chat'],
    triggerEvents: ['domain.message.created'],
    description:
      'Automatically assigns a chat to a specific agent when an "echo message" is detected — a message sent directly from the WhatsApp Business App (not through Texter). This is a system scenario auto-generated during onboarding for WhatsApp Business accounts.',
    configuration: [
      {
        field: 'Agent User ID',
        location: 'actions[0].params.agent',
        description: 'The Texter internal user ID of the agent to assign the chat to. Find this in your Texter team settings.',
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
    tags: ['on-message-status-change', 'add-label'],
    triggerEvents: ['app.message.statusRequest'],
    description:
      'Adds a label to a chat whenever a sent message fails to deliver (status 4 or 5). Makes it easy to filter and follow up on chats with delivery failures from the Texter inbox.',
    configuration: [
      {
        field: 'Label ID',
        location: 'actions[0].params.labels[0]',
        description:
          'The label ID in Texter to apply when a message fails. Create this label in your Texter settings first. Default value in the example is "failed_message".',
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
      "Sends an automatic greeting message to the customer the moment an agent takes a chat — but only if there was incoming activity in the last 24 hours (avoids sending to stale chats). The message dynamically includes the assigned agent's name via data injection.",
    configuration: [
      {
        field: 'Message Text',
        location: 'actions[0].params.message.text',
        description:
          "The greeting message to send. Supports data injection — %chat:agent.displayName% is replaced with the assigned agent's name at send time.",
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
    id: 'alert-new-account-issue',
    name: 'Alert New Account Issue',
    tags: ['on-channel-event', 'send-email'],
    triggerEvents: ['domain.channel.health.problem.resolved'],
    description:
      'Sends a formatted HTML email alert whenever a WhatsApp account health problem is detected. Includes the error code, severity, affected functionality, and remediation instructions. Useful for proactive monitoring without needing a separate alerting system.',
    configuration: [
      {
        field: 'SMTP Credentials',
        location: 'actions[0].params.transport',
        description: 'Your SMTP service name (e.g. "gmail"), email address, and app password. For Gmail, generate an App Password in your Google account security settings.',
        required: true,
      },
      {
        field: 'Recipient Email',
        location: 'actions[0].params.to',
        description: 'The email address that should receive the alert.',
        required: true,
      },
      {
        field: 'Sender Email',
        location: 'actions[0].params.from',
        description: 'The "from" address shown to the recipient — must match the authenticated SMTP account.',
        required: true,
      },
    ],
    json: {
      version: 'v1',
      name: 'Alert New Account Issue',
      description: 'Alert by email when a new account health problem is detected',
      triggerEvents: ['domain.channel.health.problem.resolved'],
      loaders: {},
      conditions: [],
      actions: [
        {
          name: 'sendEmail',
          params: {
            transport: {
              auth: {
                user: 'your-email@gmail.com',
                pass: '{{yourSmtpAppPassword}}',
              },
              service: 'gmail',
            },
            from: 'your-email@gmail.com',
            sender: 'Texter Alerts',
            to: 'recipient@yourcompany.com',
            cc: '',
            bcc: '',
            replyTo: 'your-email@gmail.com',
            subject: 'WhatsApp Account Health Alert',
            html: [
              '<!doctype html>',
              '<html lang="en">',
              '<head><meta charset="utf-8"><title>Texter — WhatsApp Alert</title></head>',
              '<body style="font-family: sans-serif; background: #f4f6f8; margin: 0; padding: 16px;">',
              '  <div style="max-width: 640px; margin: 0 auto; background: #fff; border-radius: 6px; overflow: hidden;">',
              '    <div style="background: #0b67ff; color: #fff; padding: 16px 20px; font-size: 17px; font-weight: 600;">WhatsApp Account Health Alert</div>',
              '    <div style="padding: 20px; color: #0f1724; font-size: 15px; line-height: 1.5;">',
              '      <p>A health issue was detected on your WhatsApp account.</p>',
              '      <div><b>Account ID:</b> %problem:accountId%</div>',
              '      <div><b>Date:</b> %problem:startedAt%</div>',
              '      <div><b>Error Code:</b> %problem:name%</div>',
              '      <div><b>Severity:</b> %problem:severity%</div>',
              '      <div style="margin-top: 12px;"><b>Error Message:</b></div>',
              '      <div style="background:#fff6f6; border:1px solid #ffd6d6; padding:10px; border-radius:4px; color:#7a1b1b; margin: 8px 0;">%problem:message%</div>',
              '      <div><b>Remediation:</b></div>',
              '      <div>%problem:instructions%</div>',
              '    </div>',
              '  </div>',
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

  // ── CRM / Salesforce scenarios ──────────────────────────────────────────────
  {
    id: 'update-service-request-on-chat-taken',
    name: 'Update Service Request on Chat Taken',
    tags: ['on-assign', 'crm-update', 'salesforce'],
    triggerEvents: ['domain.chat.assigned'],
    description:
      "When an agent takes a chat in Texter, updates the Owner ID of the linked Salesforce Service Request to match the agent's CRM ID. Requires the chat to have a CRM opportunity ID set via the Salesforce adapter. Uses OAuth for authentication.",
    configuration: [
      {
        field: 'Salesforce Instance URL',
        location: 'actions[0].params.url',
        description: 'Your Salesforce instance URL with the object type path. Replace the domain (e.g. "yourorg.my.salesforce.com") and object type with your actual Salesforce setup.',
        required: true,
      },
      {
        field: 'CRM Opportunity Field',
        location: 'conditions[0][0].params.expression',
        description: 'The dot-notation path to the CRM field holding the linked service request ID. Default: "crmData.opportunityid".',
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
      'When a chat is resolved in Texter, closes the linked Salesforce Service Request by updating its status field. Only fires if the chat has an associated CRM opportunity ID. Pairs well with "Update Service Request on Chat Taken".',
    configuration: [
      {
        field: 'Salesforce Instance URL',
        location: 'actions[0].params.url',
        description: 'Your Salesforce instance URL with the object type. Replace the domain and object name with your actual Salesforce setup.',
        required: true,
      },
      {
        field: 'Closed Status Value',
        location: 'actions[0].params.data',
        description: 'The field name and value that marks the record as closed in Salesforce (e.g. Status__c: "Closed").',
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
      'Part of the Q-AI suite. When external bot is enabled on a chat, forwards the full chat object and current session messages to your AI service. This is the entry point of the AI handoff flow.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your AI service webhook that receives the chat and session messages when AI mode is turned on.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
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
      'Part of the Q-AI suite. When a new incoming message arrives and external bot is active, forwards the message and chat objects to the AI service for processing.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[0].params.url',
        description: 'Your AI service webhook that receives each incoming message while AI mode is active.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
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
      'Part of the Q-AI suite. When external bot is disabled and the chat is in "with bot" status, resumes the Texter bot from a specified node and notifies the AI service to close the session. Handles the handoff back from AI to Texter.',
    configuration: [
      {
        field: 'Bot Resume Node',
        location: 'actions[0].params.nodeName',
        description: 'The bot node name to resume from when returning from AI. Must match a node in your bot YAML (e.g. "back_to_texter").',
        required: true,
      },
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description: 'Your AI service webhook that receives the "setExternalFalse" event to close the AI session.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
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
      'Part of the Q-AI suite. If AI mode is active and a template message is sent (chat moves to "bulk" status), automatically disables the external bot and notifies the AI service. Prevents AI from handling a chat that was just contacted via a template.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description: 'Your AI service webhook that receives the "setExternalFalse" event.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-manual-resolve',
      'q-ai-disable-after-manual-assign',
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
      'Part of the Q-AI suite. When a chat is resolved manually in Texter while AI mode is active, disables the external bot flag and notifies the AI service to end the session.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description: 'Your AI service webhook that receives the "setExternalFalse" event when a chat is manually resolved.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-assign',
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
      'Part of the Q-AI suite. When an agent manually takes a chat while AI mode is active, disables the external bot flag and notifies the AI service. Ensures the AI stops handling a chat once a human steps in.',
    configuration: [
      {
        field: 'AI Webhook URL',
        location: 'actions[1].params.url',
        description: 'Your AI service webhook that receives the "setExternalFalse" event when a chat is manually assigned.',
        required: true,
      },
    ],
    relatedScenarios: [
      'q-ai-turn-on-ai-bot',
      'q-ai-forward-incoming-message',
      'q-ai-end-ai-session-run-bot',
      'q-ai-disable-after-template-message',
      'q-ai-disable-after-manual-resolve',
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
];

export const ALL_TAGS: string[] = Array.from(
  new Set(SCENARIOS.flatMap((s) => s.tags)),
).sort();

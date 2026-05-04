import {useState, type ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Markdown from '@site/src/components/Markdown';
import {
  ArrowRight,
  Bot,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  Database,
  Clock,
  Code,
  Copy,
  Hourglass,
  Mail,
  MailCheck,
  MailX,
  MessageSquare,
  Play,
  Tag,
  Trash2,
  TriangleAlert,
  UserPlus,
  Webhook,
  Wrench,
} from 'lucide-react';
import type {Scenario} from '@site/src/data/scenarios';
import {TRIGGER_DISPLAY, ACTION_DISPLAY} from '@site/src/data/scenarios';
import styles from './styles.module.css';

/** Lucide sizing for chip + inline controls (inherits chip `color` as stroke). */
const L13 = {size: 13, strokeWidth: 2, 'aria-hidden': true} as const;

// ── Trigger / action icon maps (Lucide only — see add-scenario skill) ────────

const TRIGGER_ICONS: Record<string, ReactNode> = {
  'Message Created': <MessageSquare {...L13} />,
  'Chat Assigned': <UserPlus {...L13} />,
  'Chat Resolved': <CircleCheck {...L13} />,
  'Chat Pending': <Hourglass {...L13} />,
  'External Bot Changed': <Bot {...L13} />,
  'Message Status Update': <CheckCheck {...L13} />,
  'Scheduled': <Clock {...L13} />,
  'Channel Health Alert': <TriangleAlert {...L13} />,
  'Chat Unsubscribed': <MailX {...L13} />,
  'Chat Subscribed': <MailCheck {...L13} />,
};

const ACTION_ICONS: Record<string, ReactNode> = {
  'Send Webhook': <Webhook {...L13} />,
  'Update Labels': <Tag {...L13} />,
  'Assign Chat': <UserPlus {...L13} />,
  'Send Message': <MessageSquare {...L13} />,
  'Run Bot': <Play {...L13} />,
  'Send Email': <Mail {...L13} />,
  'Set External Bot': <Bot {...L13} />,
  'Set Data Item': <Database {...L13} />,
  'Delete Data Item': <Trash2 {...L13} />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUniqueTriggerLabels(triggerEvents: string[]): string[] {
  return [...new Set(triggerEvents.map((e) => TRIGGER_DISPLAY[e] ?? e))];
}

function getUniqueActionLabels(json: object): string[] {
  const actions: Array<{name?: string}> = (json as {actions?: Array<{name?: string}>}).actions ?? [];
  return [...new Set(actions.map((a) => ACTION_DISPLAY[a.name ?? ''] ?? a.name ?? '').filter(Boolean))];
}

/** Renders scenario copy as Markdown (links, inline code, lists, line breaks). */
function ScenarioMarkdown({text, className}: {text: string; className?: string}): ReactNode {
  return (
    <div className={className}>
      <Markdown
        hardBreaks
        linkClassName={styles.mdLink}
        components={{
          code: ({className: codeClass, children, ...props}) => {
            const isBlock = Boolean(codeClass?.includes('language-'));
            return (
              <code
                className={isBlock ? codeClass : styles.inlineCode}
                {...props}>
                {children}
              </code>
            );
          },
        }}>
        {text}
      </Markdown>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: Scenario;
}

export default function ScenarioCard({scenario}: ScenarioCardProps): ReactNode {
  const [configOpen, setConfigOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);

  const jsonString = JSON.stringify(scenario.json, null, 2);
  const triggerLabels = getUniqueTriggerLabels(scenario.triggerEvents);
  const actionLabels = getUniqueActionLabels(scenario.json);

  function handleCopy() {
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('JSON copied', {duration: 2000});
    });
  }

  return (
    <div className={styles.card}>

      {/* ── Icon strip + copy ── */}
      <div className={styles.iconStrip}>
        <div className={styles.iconFlow}>
          {triggerLabels.map((label) => (
            <span key={label} className={clsx(styles.iconChip, styles.iconChipTrigger)}>
              {TRIGGER_ICONS[label] ?? null}
              <span className={styles.iconChipLabel}>{label}</span>
            </span>
          ))}
          {actionLabels.length > 0 && (
            <>
              <span className={styles.flowDivider}><ArrowRight {...L13} /></span>
              {actionLabels.map((label) => (
                <span key={label} className={clsx(styles.iconChip, styles.iconChipAction)}>
                  {ACTION_ICONS[label] ?? null}
                  <span className={styles.iconChipLabel}>{label}</span>
                </span>
              ))}
            </>
          )}
        </div>
        <button className={styles.copyBtn} onClick={handleCopy} title="Copy JSON to clipboard">
          <Copy {...L13} />
          <span className={styles.copyBtnText}>Copy JSON</span>
        </button>
      </div>

      {/* ── Content ── */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{scenario.name}</h3>
        <ScenarioMarkdown text={scenario.description} className={clsx(styles.description, styles.richText)} />
        <div className={styles.tags}>
          {scenario.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Collapsibles ── */}
      <div className={styles.collapsibles}>
        {scenario.configuration.length > 0 && (
          <div className={styles.collapsibleSection}>
            <button
              className={styles.collapsibleToggle}
              onClick={() => setConfigOpen((o) => !o)}
              aria-expanded={configOpen}
            >
              <Wrench {...L13} />
              What to configure
              <span className={styles.configCount}>{scenario.configuration.length}</span>
              <span className={clsx(styles.chevron, configOpen && styles.chevronOpen)}>
                <ChevronDown {...L13} />
              </span>
            </button>
            <div className={clsx(styles.collapsibleContent, configOpen && styles.open)}>
              <ul className={styles.configList}>
                {scenario.configuration.map((item) => (
                  <li key={item.field} className={styles.configItem}>
                    <div className={styles.configItemHeader}>
                      <span className={styles.configField}>{item.field}</span>
                      {item.required ? (
                        <span className={styles.requiredBadge}>required</span>
                      ) : (
                        <span className={styles.optionalBadge}>optional</span>
                      )}
                    </div>
                    <code className={styles.configLocation}>{item.location}</code>
                    <ScenarioMarkdown text={item.description} className={clsx(styles.configDesc, styles.richText)} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className={styles.collapsibleSection}>
          <button
            className={styles.collapsibleToggle}
            onClick={() => setJsonOpen((o) => !o)}
            aria-expanded={jsonOpen}
          >
            <Code {...L13} />
            View JSON
            <span className={clsx(styles.chevron, jsonOpen && styles.chevronOpen)}>
              <ChevronDown {...L13} />
            </span>
          </button>
          <div className={clsx(styles.collapsibleContent, jsonOpen && styles.open)}>
            <div className={styles.jsonWrapper}>
              <CodeBlock language="json">{jsonString}</CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import {useState, type ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type {Scenario} from '@site/src/data/scenarios';
import {TRIGGER_DISPLAY, ACTION_DISPLAY} from '@site/src/data/scenarios';
import styles from './styles.module.css';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCopy(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconChevron(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconWrench(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconFlowArrow(): ReactNode {
  return (
    <svg width="13" height="10" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="6" x2="13" y2="6" />
      <polyline points="8 1 14 6 8 11" />
    </svg>
  );
}

function IconCode(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

// ── Trigger / action icon maps ────────────────────────────────────────────────

const TRIGGER_ICONS: Record<string, ReactNode> = {
  'Message Created': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'Chat Assigned': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  'Chat Resolved': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  'External Bot Changed': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 14h.01M16 14h.01" />
    </svg>
  ),
  'Message Status Update': (
    <svg width="15" height="11" viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 9 5 14 12 3" />
      <polyline points="9 9 13 14 21 3" />
    </svg>
  ),
  'Scheduled': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  'Channel Health Alert': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const ACTION_ICONS: Record<string, ReactNode> = {
  'Send Webhook': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  'Update Labels': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  'Assign Chat': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  'Send Message': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'Run Bot': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  'Send Email': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  'Set External Bot': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 14h.01M16 14h.01" />
    </svg>
  ),
  'Store Data': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  'Delete Data': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUniqueTriggerLabels(triggerEvents: string[]): string[] {
  return [...new Set(triggerEvents.map((e) => TRIGGER_DISPLAY[e] ?? e))];
}

function getUniqueActionLabels(json: object): string[] {
  const actions: Array<{name?: string}> = (json as {actions?: Array<{name?: string}>}).actions ?? [];
  return [...new Set(actions.map((a) => ACTION_DISPLAY[a.name ?? ''] ?? a.name ?? '').filter(Boolean))];
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
              <span className={styles.flowDivider}><IconFlowArrow /></span>
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
          <IconCopy />
          <span className={styles.copyBtnText}>Copy JSON</span>
        </button>
      </div>

      {/* ── Content ── */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{scenario.name}</h3>
        <p className={styles.description}>{scenario.description}</p>
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
              <IconWrench />
              What to configure
              <span className={styles.configCount}>{scenario.configuration.length}</span>
              <span className={clsx(styles.chevron, configOpen && styles.chevronOpen)}>
                <IconChevron />
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
                    <p className={styles.configDesc}>{item.description}</p>
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
            <IconCode />
            View JSON
            <span className={clsx(styles.chevron, jsonOpen && styles.chevronOpen)}>
              <IconChevron />
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

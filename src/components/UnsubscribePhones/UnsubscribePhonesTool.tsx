import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';

import styles from './styles.module.css';

type InputMode = 'paste' | 'csv';

/** Same hover/focus tooltip pattern as the Templates Import tool — a small ?
    icon next to each label so the form stays compact. */
function HelpIcon({tip, label}: {tip: ReactNode; label?: string}): ReactNode {
  return (
    <button
      type="button"
      className={styles.helpIcon}
      tabIndex={0}
      aria-label={label ?? (typeof tip === 'string' ? tip : 'Help')}>
      <span aria-hidden="true">?</span>
      <span className={styles.helpTip} role="tooltip">
        {tip}
      </span>
    </button>
  );
}

/** Pull phone numbers out of a comma / newline / semicolon separated paste.
    Trims, drops empties and obvious header words. */
function parsePastedPhones(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== 'phone');
}

/** Minimal CSV parser: header row + data rows, comma-separated, no quoted
    commas (phone columns never contain them). Returns the values from the
    column whose header matches `phone` case-insensitively. Throws if no
    `phone` column is found so the user gets a clear error. */
function parsePhonesFromCsv(text: string): string[] {
  const lines = text
    .replace(/^﻿/, '') // strip BOM
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const phoneIdx = headers.indexOf('phone');
  if (phoneIdx < 0) {
    throw new Error(
      `CSV must have a "phone" column. Found columns: ${headers.join(', ') || '(none)'}`
    );
  }
  const out: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const raw = cols[phoneIdx] ?? '';
    const cleaned = raw.trim().replace(/^"|"$/g, '');
    if (cleaned.length > 0) out.push(cleaned);
  }
  return out;
}

export default function UnsubscribePhonesTool(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const webhookUrl =
    (siteConfig.customFields?.unsubscribePhonesWebhookUrl as
      | string
      | undefined) ?? '';
  const webhookConfigured = Boolean(webhookUrl);

  const [projectId, setProjectId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [accountId, setAccountId] = useState('');

  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [pasteText, setPasteText] = useState('');
  const [csvFileLabel, setCsvFileLabel] = useState<string | null>(null);
  const [csvPhones, setCsvPhones] = useState<string[] | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const phones = useMemo(() => {
    if (inputMode === 'paste') return parsePastedPhones(pasteText);
    return csvPhones ?? [];
  }, [inputMode, pasteText, csvPhones]);

  const onCsvFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvError(null);
    setCsvPhones(null);
    setCsvFileLabel(null);
    if (!file) return;
    setCsvFileLabel(file.name);
    if (!/\.csv$/i.test(file.name)) {
      setCsvError(
        'Only .csv files are supported. Convert your spreadsheet to CSV first (File → Save As → CSV in Excel / Sheets).'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed = parsePhonesFromCsv(text);
        if (parsed.length === 0) {
          throw new Error('No phone numbers found in the "phone" column.');
        }
        setCsvPhones(parsed);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : String(err));
      }
    };
    reader.onerror = () => setCsvError('Could not read the selected file.');
    reader.readAsText(file, 'UTF-8');
  }, []);

  const switchInputMode = useCallback(
    (next: InputMode) => {
      if (submitting) return;
      setInputMode(next);
      setCsvError(null);
      if (next !== 'paste') setPasteText('');
      if (next !== 'csv') {
        setCsvFileLabel(null);
        setCsvPhones(null);
      }
    },
    [submitting]
  );

  const requiredOk = Boolean(
    projectId.trim() && apiToken.trim() && phones.length > 0
  );

  const handleSubmit = useCallback(async () => {
    if (!webhookConfigured) {
      toast.error(
        'Webhook URL is not configured for this build (UNSUBSCRIBE_PHONES_WEBHOOK_URL).'
      );
      return;
    }
    if (!requiredOk) {
      toast.error('Fill in all required fields and add at least one phone.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          projectId: projectId.trim(),
          apiToken: apiToken.trim(),
          accountId: accountId.trim(),
          phones,
        }),
      });
      if (!res.ok) {
        toast.error(`Webhook responded ${res.status} ${res.statusText}`.trim());
      } else {
        toast.success(
          `Request sent - ${phones.length} number${phones.length === 1 ? '' : 's'} queued.`
        );
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? `Request failed: ${e.message}` : 'Request failed.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    webhookConfigured,
    webhookUrl,
    requiredOk,
    projectId,
    apiToken,
    accountId,
    phones,
  ]);

  return (
    <div className={styles.root}>
      <p className={styles.lead}>
        Unsubscribe phone numbers from a Texter environment in bulk. Numbers can
        be pasted as a comma-separated list or uploaded as a CSV with a{' '}
        <code>phone</code> column.
      </p>

      {!webhookConfigured ? (
        <div className={styles.warn}>
          <strong>Webhook is not configured for this deploy.</strong> Set the
          <code>UNSUBSCRIBE_PHONES_WEBHOOK_URL</code> environment variable at
          build time.
        </div>
      ) : null}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Configuration</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="up-project">
            Project ID <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip={
                <>
                  Host becomes{' '}
                  <code>https://&lt;project&gt;.texterchat.com/server/api/v2</code>
                </>
              }
              label="Project ID help"
            />
          </label>
          <input
            id="up-project"
            className={styles.input}
            autoComplete="off"
            placeholder="e.g. mycompany"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={submitting}
            required
            aria-required="true"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="up-token">
            API token <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip={
                <>
                  Bearer token with the <strong>Manage All Chats</strong> scope.
                </>
              }
              label="API token help"
            />
          </label>
          <input
            id="up-token"
            type="password"
            className={styles.input}
            autoComplete="off"
            placeholder="Bearer token"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            disabled={submitting}
            required
            aria-required="true"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="up-account">
            Account ID <span className={styles.optional}>(optional)</span>
            <HelpIcon
              tip="If empty, the numbers are unsubscribed from every WhatsApp account connected to this Texter environment."
              label="Account ID help"
            />
          </label>
          <input
            id="up-account"
            className={styles.input}
            autoComplete="off"
            placeholder="e.g. 972501234567"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Phone numbers <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip="Paste a comma-, semicolon-, or newline-separated list, or upload a CSV file with a 'phone' column."
              label="Phone numbers help"
            />
          </span>
          <div className={styles.modeTabs} role="tablist" aria-label="Phone input mode">
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'paste'}
              className={clsx(
                styles.modeTab,
                inputMode === 'paste' && styles.modeTabActive
              )}
              onClick={() => switchInputMode('paste')}
              disabled={submitting}>
              Paste numbers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'csv'}
              className={clsx(
                styles.modeTab,
                inputMode === 'csv' && styles.modeTabActive
              )}
              onClick={() => switchInputMode('csv')}
              disabled={submitting}>
              Upload CSV
            </button>
          </div>

          {inputMode === 'paste' && (
            <>
              <textarea
                className={styles.pasteArea}
                placeholder="972501234567, 972502345678, ..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={submitting}
                spellCheck={false}
                rows={6}
              />
              {phones.length > 0 ? (
                <p className={styles.hint}>
                  <span className={styles.metaOk}>{phones.length}</span> number
                  {phones.length === 1 ? '' : 's'} parsed.
                </p>
              ) : null}
            </>
          )}

          {inputMode === 'csv' && (
            <>
              <input
                id="up-csv"
                type="file"
                accept=".csv,text/csv"
                className={styles.fileInput}
                onChange={onCsvFile}
                disabled={submitting}
              />
              {csvError ? (
                <p className={styles.hint}>
                  <span className={styles.metaBad}>{csvError}</span>
                </p>
              ) : csvFileLabel ? (
                <p className={styles.fileLine}>
                  Selected: <span className={styles.fileName}>{csvFileLabel}</span>
                  {csvPhones && (
                    <>
                      {' '}
                      —{' '}
                      <span className={styles.metaOk}>
                        {csvPhones.length} number{csvPhones.length === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="button button--primary"
            disabled={submitting || !requiredOk || !webhookConfigured}
            title={!requiredOk ? 'Fill in all required fields (marked *)' : undefined}
            onClick={() => void handleSubmit()}>
            {submitting ? 'Sending…' : 'Send unsubscribe request'}
          </button>
        </div>
      </section>
    </div>
  );
}

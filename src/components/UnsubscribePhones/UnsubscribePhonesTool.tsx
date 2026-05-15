import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useHistory} from '@docusaurus/router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';

import styles from './styles.module.css';

type InputMode = 'paste' | 'csv';

/** Hard cap on how many numbers can be sent in a single request. n8n keeps the
    HTTP response open for the full run; past ~5 minutes the response can time
    out, and large lists are slow enough that the user shouldn't be waiting on
    a single click. They can split into multiple submits if they have more. */
const MAX_PHONES_PER_REQUEST = 5000;

type FailureRow = {
  phone: string;
  status: number | null;
  reason: string;
};

type ResultSummary = {
  total: number;
  ok: number;
  failed: number;
  failures: FailureRow[];
  /** Set when n8n's pre-flight probe short-circuited the run. When present,
      no numbers were attempted and the message describes why (bad token,
      missing account, etc.). */
  fatalError?: string;
};

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
  const history = useHistory();
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
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showFailures, setShowFailures] = useState(false);

  const phones = useMemo(() => {
    if (inputMode === 'paste') return parsePastedPhones(pasteText);
    return csvPhones ?? [];
  }, [inputMode, pasteText, csvPhones]);

  const overCap = phones.length > MAX_PHONES_PER_REQUEST;

  // While a request is in progress, guard against leaving the page so the user
  // doesn't lose the result summary. Two layers:
  //   - `beforeunload`: refresh / tab close / typed-URL navigation. Browser
  //     forces its own generic "Leave site?" dialog (custom message ignored
  //     since ~2016).
  //   - `history.block`: in-app navigation (clicking the docs sidebar, navbar,
  //     or any internal link). React-router shows window.confirm with our
  //     custom message; clicking Cancel keeps the user on this page.
  // Both listeners are only attached while `submitting` is true.
  useEffect(() => {
    if (!submitting) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // returnValue is the legacy mechanism but still required by Chrome/Edge
      // to actually trigger the dialog. preventDefault alone is not enough.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const unblock = history.block(
      'A request is in progress. If you leave this page, you will not see the result summary (the unsubscribe job will still run).'
    );
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      unblock();
    };
  }, [submitting, history]);

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
    projectId.trim() && apiToken.trim() && phones.length > 0 && !overCap
  );

  const handleSubmit = useCallback(async () => {
    if (!webhookConfigured) {
      toast.error(
        'Webhook URL is not configured for this build (UNSUBSCRIBE_PHONES_WEBHOOK_URL).'
      );
      return;
    }
    if (overCap) {
      toast.error(
        `Too many numbers — limit is ${MAX_PHONES_PER_REQUEST.toLocaleString()} per request. Split your list and send in batches.`
      );
      return;
    }
    if (!requiredOk) {
      toast.error('Fill in all required fields and add at least one phone.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    setRequestError(null);
    setShowFailures(false);
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
        setRequestError(
          `Webhook responded ${res.status} ${res.statusText}. The unsubscribe job may still have run — check the Texter UI.`.trim()
        );
        return;
      }
      const data = (await res.json()) as Partial<ResultSummary>;
      const summary: ResultSummary = {
        total: typeof data.total === 'number' ? data.total : phones.length,
        ok: typeof data.ok === 'number' ? data.ok : 0,
        failed: typeof data.failed === 'number' ? data.failed : 0,
        failures: Array.isArray(data.failures) ? data.failures : [],
        ...(typeof data.fatalError === 'string' && data.fatalError.length > 0
          ? {fatalError: data.fatalError}
          : {}),
      };
      setResult(summary);
    } catch (e) {
      setRequestError(
        e instanceof Error
          ? `Request failed: ${e.message}. The unsubscribe job may still have run — check the Texter UI.`
          : 'Request failed. The unsubscribe job may still have run — check the Texter UI.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    webhookConfigured,
    overCap,
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
                  <span className={overCap ? styles.metaBad : styles.metaOk}>
                    {phones.length.toLocaleString()}
                  </span>{' '}
                  number{phones.length === 1 ? '' : 's'} parsed.
                  {overCap && (
                    <>
                      {' '}
                      <span className={styles.metaBad}>
                        Exceeds the {MAX_PHONES_PER_REQUEST.toLocaleString()}-per-request
                        limit. Split your list and send in batches.
                      </span>
                    </>
                  )}
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
                      <span className={overCap ? styles.metaBad : styles.metaOk}>
                        {csvPhones.length.toLocaleString()} number
                        {csvPhones.length === 1 ? '' : 's'}
                      </span>
                      {overCap && (
                        <>
                          .{' '}
                          <span className={styles.metaBad}>
                            Exceeds the {MAX_PHONES_PER_REQUEST.toLocaleString()}-per-request
                            limit. Split your list and send in batches.
                          </span>
                        </>
                      )}
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
            title={
              overCap
                ? `Limit is ${MAX_PHONES_PER_REQUEST.toLocaleString()} per request`
                : !requiredOk
                ? 'Fill in all required fields (marked *)'
                : undefined
            }
            onClick={() => void handleSubmit()}>
            {submitting ? 'Processing… (this may take a minute)' : 'Send unsubscribe request'}
          </button>
        </div>
      </section>

      {(submitting || result || requestError) && (
        <section className={clsx(styles.card, styles.resultCard)}>
          <h2 className={styles.cardTitle}>
            {submitting
              ? 'Processing'
              : requestError
              ? 'Request error'
              : result?.fatalError
              ? 'Aborted'
              : 'Result'}
          </h2>

          {submitting && (
            <p className={styles.processingLine}>
              <span className={styles.spinner} aria-hidden="true" />
              Sending {phones.length.toLocaleString()} unsubscribe request
              {phones.length === 1 ? '' : 's'}… you can switch tabs, but don't refresh
              or leave this page or you won't see the summary.
            </p>
          )}

          {requestError && !submitting && (
            <p className={styles.hint}>
              <span className={styles.metaBad}>{requestError}</span>
            </p>
          )}

          {result?.fatalError && !submitting && (
            <p className={styles.hint}>
              <span className={styles.metaBad}>{result.fatalError}</span>
              <br />
              No numbers were unsubscribed.
            </p>
          )}

          {result && !result.fatalError && !submitting && (
            <>
              <p className={styles.resultCounts}>
                ✅ {result.ok.toLocaleString()} unsubscribed
                {result.failed > 0 && (
                  <>
                    <br />
                    ❌ {result.failed.toLocaleString()} failed
                  </>
                )}
              </p>
              {result.failures.length > 0 && (
                <div className={styles.failureBlock}>
                  <button
                    type="button"
                    className={styles.failureToggle}
                    onClick={() => setShowFailures((v) => !v)}
                    aria-expanded={showFailures}>
                    {showFailures ? '▾' : '▸'} {showFailures ? 'Hide' : 'Show'}{' '}
                    failures ({result.failures.length})
                  </button>
                  {showFailures && (
                    <ul className={styles.failureList}>
                      {result.failures.map((f, i) => (
                        <li key={`${f.phone}-${i}`}>
                          <code>{f.phone}</code>:{' '}
                          {f.status ? (
                            <span className={styles.failureStatus}>HTTP {f.status}</span>
                          ) : null}
                          {f.status ? ' · ' : ''}
                          {f.reason || 'Unknown error'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

import clsx from 'clsx';
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  parseTemplatesJsonFile,
  runTemplatesImport,
  type TemplateInput,
  type TemplatesImportConfig,
} from '@site/src/lib/templatesJsonToTexter';

import styles from './styles.module.css';

/**
 * Embedded in docs (MDX). Doc layout supplies the page title; this is the form + log only.
 */
export default function TemplatesImportTool(): ReactNode {
  const [projectId, setProjectId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [keepNames, setKeepNames] = useState(false);
  const [nameSuffix, setNameSuffix] = useState('');
  const [delayMs, setDelayMs] = useState(2000);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateInput[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev, line]);
  }, []);

  const onFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setTemplates(null);
    setFileLabel(null);
    if (!file) {
      return;
    }
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed = parseTemplatesJsonFile(text);
        setTemplates(parsed);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : String(err));
      }
    };
    reader.onerror = () => {
      setFileError('Could not read the selected file.');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleRun = useCallback(async () => {
    if (!templates?.length) {
      setFileError('Load a valid JSON file with at least one template first.');
      return;
    }
    setRunning(true);
    setLogLines([]);
    setLastSummary(null);
    const ac = new AbortController();
    abortRef.current = ac;

    const config: TemplatesImportConfig = {
      projectId: projectId.trim(),
      apiKey,
      accountId: accountId.trim(),
      keepNames,
      nameSuffix,
      delayMsBetweenCreates: Math.max(0, Math.floor(delayMs) || 0),
    };

    try {
      appendLog('Starting import…');
      const summary = await runTemplatesImport(
        config,
        templates,
        appendLog,
        ac.signal
      );

      const cOk = summary.createResults.filter((r) => r.status === 'success').length;
      const cFail = summary.createResults.filter((r) => r.status === 'failed').length;
      const lOk = summary.localizationResults.filter((r) => r.status === 'success').length;
      const lFail = summary.localizationResults.filter((r) => r.status === 'failed').length;
      const lSkip = summary.localizationResults.filter((r) => r.status === 'skipped').length;
      const sOk = summary.submissionResults.filter((r) => r.status === 'success').length;
      const sFail = summary.submissionResults.filter((r) => r.status === 'failed').length;
      const sSkip = summary.submissionResults.filter((r) => r.status === 'skipped').length;

      appendLog('');
      appendLog(`${'='.repeat(60)}`);
      appendLog('SUMMARY');
      appendLog(`${'='.repeat(60)}`);
      appendLog(`Create: ${cOk} ok, ${cFail} failed`);
      appendLog(`Localizations: ${lOk} ok, ${lFail} failed, ${lSkip} skipped`);
      appendLog(`Submit: ${sOk} ok, ${sFail} failed, ${sSkip} skipped`);

      setLastSummary(
        `Create ${cOk}/${summary.createResults.length} · ` +
          `Localize ${lOk} ok · Submit ${sOk} ok`
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        appendLog('Stopped by user.');
      } else {
        appendLog('Fatal:');
        const msg = e instanceof Error ? e.message : String(e);
        for (const line of msg.split('\n')) {
          appendLog(`  ${line}`);
        }
        if (
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('cors') ||
          msg.toLowerCase().includes('err_network')
        ) {
          appendLog(
            'Tip: If you see no HTTP response, the browser may be blocking cross-origin calls (CORS). Run the flow from your own backend, or ask your platform team to allow this origin.'
          );
        }
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [
    templates,
    projectId,
    apiKey,
    accountId,
    keepNames,
    nameSuffix,
    delayMs,
    appendLog,
  ]);

  return (
    <div className={styles.root}>
      <p className={styles.lead}>
        Enter your project credentials, upload the same JSON shape you would feed the import
        notebook, then run create → localizations → submit against the Texter API from your
        browser.
      </p>

      <div className={styles.warn}>
        Your API key is sent only from this browser directly to{' '}
        <code>*.texterchat.com</code>. It is not stored by Texter Docs. Anyone with access to your
        machine or this tab can intercept it, so use a dedicated key and revoke it when finished.
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Configuration</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-project">
              Project ID
            </label>
            <input
              id="ti-project"
              className={styles.input}
              autoComplete="off"
              placeholder="e.g. mycompany"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={running}
            />
            <p className={styles.hint}>
              Host becomes <code>https://&lt;project&gt;.texterchat.com/server/api/v2</code>
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-key">
              API key
            </label>
            <input
              id="ti-key"
              type="password"
              className={styles.input}
              autoComplete="off"
              placeholder="Bearer token"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={running}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-account">
              WhatsApp account ID
            </label>
            <input
              id="ti-account"
              className={styles.input}
              autoComplete="off"
              placeholder="e.g. 972501234567"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={running}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-file">
              Templates JSON file
            </label>
            <input
              id="ti-file"
              type="file"
              accept=".json,application/json"
              className={styles.fileInput}
              onChange={onFile}
              disabled={running}
            />
            <p className={styles.hint}>
              Array of objects with <code>provider_template</code>, or{' '}
              <code>{'{"templates": [...] }'}</code>, or a single template object.
            </p>
            {fileLabel && (
              <p className={styles.hint}>
                Selected: <strong>{fileLabel}</strong>
                {templates && (
                  <>
                    {' '}
                    — <span className={styles.metaOk}>{templates.length} template(s)</span>
                  </>
                )}
              </p>
            )}
            {fileError && (
              <p className={styles.hint}>
                <span className={styles.metaBad}>{fileError}</span>
              </p>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxRow}>
              <input
                id="ti-keep"
                type="checkbox"
                checked={keepNames}
                onChange={(e) => setKeepNames(e.target.checked)}
                disabled={running}
              />
              <label htmlFor="ti-keep">Keep original template names from JSON</label>
            </div>
            <p className={styles.hint}>
              When off, the create payload omits <code>name</code> so the API can auto-assign.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-suffix">
              Name suffix (optional)
            </label>
            <input
              id="ti-suffix"
              className={styles.input}
              placeholder="_new"
              value={nameSuffix}
              onChange={(e) => setNameSuffix(e.target.value)}
              disabled={running || !keepNames}
            />
            <p className={styles.hint}>Only applied when &quot;Keep original names&quot; is on.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-delay">
              Delay after each successful create (ms)
            </label>
            <input
              id="ti-delay"
              type="number"
              min={0}
              step={100}
              className={styles.input}
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              disabled={running}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="button button--primary"
              disabled={running || !templates?.length}
              onClick={() => void handleRun()}
            >
              {running ? 'Running…' : 'Run import'}
            </button>
            <button
              type="button"
              className={clsx('button', 'button--outline')}
              disabled={!running}
              onClick={handleAbort}
            >
              Stop
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Log</h2>
          {lastSummary && (
            <div className={styles.summary}>
              <span className={styles.summaryItem}>Last run: {lastSummary}</span>
            </div>
          )}
          <pre className={styles.log} aria-live="polite">
            {logLines.length ? logLines.join('\n') : 'Output appears here when you run import.'}
          </pre>
        </section>
      </div>
    </div>
  );
}

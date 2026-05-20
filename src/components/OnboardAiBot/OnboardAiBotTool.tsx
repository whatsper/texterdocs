import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useHistory} from '@docusaurus/router';
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';

import styles from './styles.module.css';

type ActivateChoice = 'True' | 'False';

type SuccessPayload = {
  success: true;
  projectId?: string;
  [k: string]: unknown;
};

type ErrorPayload = {
  success?: false;
  error?: string;
  message?: string;
  node?: string;
  lastNodeExecuted?: string;
  [k: string]: unknown;
};

const N8N_EXECUTIONS_URL =
  'https://n8n.texter.chat/workflow/GZdoyXTxqhJK0HLc/executions';

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

export default function OnboardAiBotTool(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const history = useHistory();
  const webhookUrl =
    (siteConfig.customFields?.onboardAiBotWebhookUrl as
      | string
      | undefined) ?? '';
  const webhookConfigured = Boolean(webhookUrl);

  const [projectId, setProjectId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [activate, setActivate] = useState<ActivateChoice>('True');
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    node?: string;
    payload?: unknown;
    status?: number;
    /** True when n8n returned nothing actionable (workflow errored before
        Respond Success fired) — in that case we show a generic message and
        point support at the execution log instead of leaking a vague body. */
    unhelpful?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!submitting) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const unblock = history.block(
      'Onboarding is running. If you leave this page you will not see the result (the workflow will still finish on the n8n side).'
    );
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      unblock();
    };
  }, [submitting, history]);

  const onFiles = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
  }, []);

  const requiredOk = Boolean(
    projectId.trim() &&
      businessName.trim() &&
      businessPhone.trim() &&
      apiToken.trim()
  );

  const handleSubmit = useCallback(async () => {
    if (!webhookConfigured) {
      toast.error(
        'Webhook URL is not configured for this build (ONBOARD_AI_BOT_WEBHOOK_URL).'
      );
      return;
    }
    if (!requiredOk) {
      toast.error('Fill in all required fields (marked *).');
      return;
    }
    setSubmitting(true);
    setSuccess(null);
    setErrorInfo(null);

    const fd = new FormData();
    fd.append('Project ID', projectId.trim());
    fd.append('Business Name', businessName.trim());
    fd.append('Business Phone Number', businessPhone.trim());
    fd.append('API Token', apiToken.trim());
    fd.append('Admin Email', adminEmail.trim());
    fd.append('Activate', activate);
    for (const f of files) {
      fd.append('Knowledge Base Files', f, f.name);
    }

    try {
      const res = await fetch(webhookUrl, {method: 'POST', body: fd});
      const raw = await res.text();
      let parsed: unknown = null;
      try {
        parsed = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        /* keep null */
      }

      if (res.ok && parsed && (parsed as ErrorPayload).success !== false) {
        setSuccess(parsed as SuccessPayload);
        return;
      }

      const err = (parsed ?? {}) as ErrorPayload;
      const node = err.node ?? err.lastNodeExecuted;
      // Treat the response as "unhelpful" when n8n only returned its default
      // generic body (just `message`, no `node`, no explicit `error`). That's
      // what comes back when the workflow errored before Respond Success
      // fired — there's nothing to display, so we point support at the
      // executions log instead of dumping a vague body.
      const unhelpful = !node && !err.error;
      const message = unhelpful
        ? 'Something went wrong before the workflow could report a result.'
        : (err.error ?? err.message ?? '');
      setErrorInfo({
        message,
        node,
        payload: parsed,
        status: res.status,
        unhelpful,
      });
    } catch (e) {
      setErrorInfo({
        message:
          e instanceof Error
            ? `Request failed: ${e.message}`
            : 'Request failed.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    webhookConfigured,
    requiredOk,
    webhookUrl,
    projectId,
    businessName,
    businessPhone,
    apiToken,
    adminEmail,
    activate,
    files,
  ]);

  return (
    <div className={styles.root}>
      <p className={styles.lead}>
        Provisions a new AI customer end-to-end: creates the OpenAI vector store,
        database customer + AI config rows, the Google Drive folder tree (knowledge
        base / reports / system prompt), copies default templates, optionally
        shares the root folder with an admin, and finally imports the default
        scenarios into the customer's Texter inbox.
      </p>

      {!webhookConfigured ? (
        <div className={styles.warn}>
          <strong>Webhook is not configured for this deploy.</strong> Set the
          <code> ONBOARD_AI_BOT_WEBHOOK_URL </code> environment variable at build
          time.
        </div>
      ) : null}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>New customer details</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="oai-project">
            Project ID <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip={
                <>
                  Customer's Texter subdomain. Becomes{' '}
                  <code>https://&lt;project&gt;.texterchat.com</code> and the OpenAI
                  vector store name.
                </>
              }
              label="Project ID help"
            />
          </label>
          <input
            id="oai-project"
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
          <label className={styles.label} htmlFor="oai-business-name">
            Business Name <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip="Used to replace <business_name> in the default system-prompt document."
              label="Business name help"
            />
          </label>
          <input
            id="oai-business-name"
            className={styles.input}
            autoComplete="off"
            placeholder="e.g. My Company"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={submitting}
            required
            aria-required="true"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="oai-business-phone">
            Business Phone Number <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip="Used to replace <business_phone_number> in the default system-prompt document."
              label="Business phone help"
            />
          </label>
          <input
            id="oai-business-phone"
            className={styles.input}
            autoComplete="off"
            placeholder="e.g. 972501234567"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            disabled={submitting}
            required
            aria-required="true"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="oai-token">
            API Token <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip={
                <>
                  Bearer token generated in Texter. Used during onboarding to
                  import scenarios, and later by the AI bot at runtime, so it
                  needs all of these scopes:
                  <ul>
                    <li>Send Session Messages</li>
                    <li>List All Chats</li>
                    <li>Manage All Chats</li>
                    <li>View All Chats</li>
                    <li>Create Scenarios</li>
                    <li>Manage Scenarios on behalf of User</li>
                  </ul>
                </>
              }
              label="API token help"
            />
          </label>
          <input
            id="oai-token"
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
          <label className={styles.label} htmlFor="oai-admin-email">
            Admin Email <span className={styles.optional}>(optional)</span>
            <HelpIcon
              tip="If set, the new root Drive folder is shared with this address and an email notification is sent."
              label="Admin email help"
            />
          </label>
          <input
            id="oai-admin-email"
            type="email"
            className={styles.input}
            autoComplete="off"
            placeholder="someone@example.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Activate <span className={styles.req} aria-hidden="true">*</span>
            <HelpIcon
              tip={
                <>
                  When <strong>True</strong>: imported scenarios are created as{' '}
                  <code>active</code> on the target inbox, <em>and</em> the new
                  Google Drive folders are registered for change-listening (so
                  knowledge-base updates sync to the vector store going forward).
                  When <strong>False</strong>: scenarios import as{' '}
                  <code>inactive</code> and no Drive listeners are set up.
                </>
              }
              label="Activate help"
            />
          </span>
          <div
            className={styles.radioGroup}
            role="radiogroup"
            aria-label="Activate scenarios on import">
            {(['True', 'False'] as const).map((opt) => (
              <label
                key={opt}
                className={clsx(
                  styles.radioOption,
                  activate === opt && styles.active,
                  submitting && styles.disabled
                )}>
                <input
                  type="radio"
                  name="oai-activate"
                  value={opt}
                  checked={activate === opt}
                  onChange={() => setActivate(opt)}
                  disabled={submitting}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="oai-files">
            Knowledge Base Files <span className={styles.optional}>(optional)</span>
            <HelpIcon
              tip="Uploaded into the new customer's Knowledge Base Drive folder. PDFs, docs, txt, etc."
              label="Knowledge base files help"
            />
          </label>
          <input
            id="oai-files"
            type="file"
            multiple
            className={styles.fileInput}
            onChange={onFiles}
            disabled={submitting}
          />
          {files.length > 0 && (
            <p className={styles.fileLine}>
              Selected:{' '}
              <span className={styles.fileName}>
                {files.length} file{files.length === 1 ? '' : 's'}
              </span>{' '}
              ({files.map((f) => f.name).join(', ')})
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="button button--primary"
            disabled={submitting || !requiredOk || !webhookConfigured}
            title={!requiredOk ? 'Fill in all required fields (marked *)' : undefined}
            onClick={() => void handleSubmit()}>
            {submitting ? 'Onboarding… (this may take a minute)' : 'Onboard'}
          </button>
        </div>
      </section>

      {(submitting || success || errorInfo) && (
        <section className={clsx(styles.card, styles.resultCard)}>
          <h2 className={styles.cardTitle}>
            {submitting ? 'Processing' : success ? 'Success' : 'Something went wrong'}
          </h2>

          {submitting && (
            <p className={styles.processingLine}>
              <span className={styles.spinner} aria-hidden="true" />
              Provisioning <code>{projectId}</code>… don't refresh or leave this
              page or you won't see the summary.
            </p>
          )}

          {!submitting && success && (
            <>
              <p className={styles.resultLine}>
                ✅ Onboarding completed
                {success.projectId ? (
                  <>
                    {' '}
                    for <code>{success.projectId}</code>
                  </>
                ) : null}
                .
              </p>
              {Object.keys(success).length > 0 && (
                <pre className={styles.errorPayload}>
                  {JSON.stringify(success, null, 2)}
                </pre>
              )}
            </>
          )}

          {!submitting && errorInfo && (
            <>
              <p className={styles.resultLine}>❌ {errorInfo.message}</p>
              <div className={styles.errorDetail}>
                {errorInfo.node ? (
                  <>
                    Failed at node: <code>{errorInfo.node}</code>
                    <br />
                  </>
                ) : null}
                {typeof errorInfo.status === 'number' ? (
                  <>
                    HTTP <code>{errorInfo.status}</code>
                    <br />
                  </>
                ) : null}
                Texter Support: check the latest execution in n8n for the full
                stack trace —{' '}
                <a
                  href={N8N_EXECUTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer">
                  open executions log
                </a>
                .
              </div>
              {!errorInfo.unhelpful && errorInfo.payload != null && (
                <pre className={styles.errorPayload}>
                  {JSON.stringify(errorInfo.payload, null, 2)}
                </pre>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

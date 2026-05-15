import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  parseTemplatesJsonFile,
  runTemplatesExport,
  runTemplatesImport,
  type ImportPhase,
  type ImportProgress,
  type TemplateInput,
  type TemplatesExportConfig,
  type TemplatesImportConfig,
} from '@site/src/lib/templatesJsonToTexter';
import {
  PARTNER_BUNDLES,
  type PartnerSeedField,
} from '@site/src/data/partnerBundles';

import styles from './styles.module.css';

type Mode = 'import' | 'export';
type InputMode = 'file' | 'paste' | 'partner';
type ExportOutput = 'file' | 'inline';

/** Initial selection state: every partner empty. The user picks a partner
    explicitly — opens the modal with nothing selected and the Save button
    disabled until something is ticked. */
function initialPartnerSelection(): Record<string, Set<string>> {
  const init: Record<string, Set<string>> = {};
  for (const partner of PARTNER_BUNDLES) {
    init[partner.id] = new Set();
  }
  return init;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Read the template's display title (top-level `title` field). */
function getTemplateTitle(tpl: TemplateInput): string {
  return typeof tpl.title === 'string' ? tpl.title : '';
}

/** Read the API-side template name (provider_template.name). */
function getTemplateApiName(tpl: TemplateInput): string {
  if (isPlainObject(tpl.provider_template)) {
    const n = tpl.provider_template.name;
    if (typeof n === 'string') return n;
  }
  return '';
}

/** Read the first localization's BODY component text, if present. */
function getTemplateBodyText(tpl: TemplateInput): string {
  if (!isPlainObject(tpl.provider_template)) return '';
  const locs = tpl.provider_template.localizations;
  if (!Array.isArray(locs) || locs.length === 0) return '';
  const first = locs[0];
  if (!isPlainObject(first) || !Array.isArray(first.components)) return '';
  for (const c of first.components) {
    if (isPlainObject(c) && c.type === 'BODY' && typeof c.text === 'string') {
      return c.text;
    }
  }
  return '';
}

/**
 * Recursively replace every occurrence of `find` with `replace` in every
 * string field of an arbitrary JSON-like value. Used to swap partner-bundle
 * placeholders (e.g. "שם הקליניקה") with the value the user typed in the
 * seed input. Returns a new object — the input is not mutated.
 */
function deepStringReplace(
  value: unknown,
  replacements: {find: string; replace: string}[]
): unknown {
  if (replacements.length === 0) return value;
  if (typeof value === 'string') {
    let s = value;
    for (const r of replacements) {
      if (r.replace.length === 0) continue;
      s = s.split(r.find).join(r.replace);
    }
    return s;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepStringReplace(v, replacements));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      out[k] = deepStringReplace(
        (value as Record<string, unknown>)[k],
        replacements
      );
    }
    return out;
  }
  return value;
}

/** Apply a partner's seed values across every string in a template payload. */
function applyPartnerSeedsToTemplate(
  tpl: TemplateInput,
  seedFields: PartnerSeedField[] | undefined,
  seedValues: Record<string, string> | undefined
): TemplateInput {
  if (!seedFields || seedFields.length === 0) return tpl;
  const replacements: {find: string; replace: string}[] = [];
  for (const f of seedFields) {
    const v = seedValues?.[f.id];
    if (v && v.length > 0) {
      replacements.push({find: f.placeholder, replace: v});
    }
  }
  if (replacements.length === 0) return tpl;
  return deepStringReplace(tpl, replacements) as TemplateInput;
}

/** Apply inline edits to a partner template payload via deep clone, leaving
    the source bundle entry untouched so the picker can be reopened safely. */
function applyPartnerEditsToTemplate(
  tpl: TemplateInput,
  edit: {title?: string; name?: string; body?: string} | undefined
): TemplateInput {
  if (!edit || (edit.title === undefined && edit.name === undefined && edit.body === undefined)) {
    return tpl;
  }
  // Structured clone keeps types correct vs JSON.parse(JSON.stringify())
  // and is widely supported.
  const cloned =
    typeof structuredClone === 'function'
      ? structuredClone(tpl)
      : (JSON.parse(JSON.stringify(tpl)) as TemplateInput);
  if (edit.title !== undefined) {
    cloned.title = edit.title;
  }
  if (edit.name !== undefined && isPlainObject(cloned.provider_template)) {
    cloned.provider_template.name = edit.name;
    if (typeof cloned.name === 'string') {
      cloned.name = edit.name;
    }
  }
  if (edit.body !== undefined && isPlainObject(cloned.provider_template)) {
    const locs = cloned.provider_template.localizations;
    if (Array.isArray(locs) && locs.length > 0 && isPlainObject(locs[0])) {
      const first = locs[0] as Record<string, unknown>;
      const components = first.components;
      if (Array.isArray(components)) {
        for (const c of components) {
          if (isPlainObject(c) && c.type === 'BODY') {
            (c as Record<string, unknown>).text = edit.body;
            break;
          }
        }
      }
    }
  }
  return cloned;
}

/**
 * Small hover/focus tooltip used in place of inline helper paragraphs. The form
 * gets crowded fast — surfacing hints behind a ? icon keeps the visible UI
 * cleaner while staying discoverable.
 */
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

type PhaseState = {
  step: number;
  totalSteps: number;
  ok: number;
  failed: number;
  skipped: number;
};

const PHASE_LABELS: Record<ImportPhase, string> = {
  create: 'Create templates',
  localization: 'Add localizations',
  submit: 'Submit for approval',
};

const PHASES: ImportPhase[] = ['create', 'localization', 'submit'];

type Outcome = 'idle' | 'running' | 'success' | 'partial' | 'failed' | 'skipped';

function emptyPhase(): PhaseState {
  return {step: 0, totalSteps: 0, ok: 0, failed: 0, skipped: 0};
}

function phaseOutcome(
  s: PhaseState,
  isActive: boolean,
  hasStarted: boolean
): Outcome {
  if (isActive) return 'running';
  if (!hasStarted || s.totalSteps === 0) return 'idle';
  const completed = s.step >= s.totalSteps;
  if (!completed) return 'running';
  // Phase loop completed. Classify by produced outcomes.
  const realWork = s.ok + s.failed;
  if (realWork === 0) return 'skipped';
  if (s.failed === 0) return 'success';
  if (s.ok === 0) return 'failed';
  return 'partial';
}

function aggregateOutcome(outcomes: Outcome[]): Outcome {
  if (outcomes.includes('running')) return 'running';
  if (outcomes.every((o) => o === 'idle')) return 'idle';
  const real = outcomes.filter((o) => o !== 'idle' && o !== 'skipped');
  if (real.length === 0) return 'skipped';
  if (real.every((o) => o === 'success')) return 'success';
  if (real.every((o) => o === 'failed')) return 'failed';
  return 'partial';
}

const OUTCOME_CLASS: Record<Outcome, string> = {
  idle: '',
  running: '',
  success: 'fillSuccess',
  partial: 'fillPartial',
  failed: 'fillFailed',
  skipped: 'fillSkipped',
};

function outcomeLabel(o: Outcome): string {
  switch (o) {
    case 'success':
      return 'Done';
    case 'partial':
      return 'Partial';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'running':
      return 'Running…';
    default:
      return '';
  }
}

/**
 * Embedded in docs (MDX). Doc layout supplies the page title; this is the form + log only.
 */
export default function TemplatesImportTool(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const proxyUrl =
    (siteConfig.customFields?.templateImportProxyUrl as string | undefined) ??
    '';
  const proxyConfigured = Boolean(proxyUrl);

  const [mode, setMode] = useState<Mode>('import');
  const [projectId, setProjectId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [keepNames, setKeepNames] = useState(false);
  const [nameSuffix, setNameSuffix] = useState('');
  const [delayMs, setDelayMs] = useState(2000);
  const [submitMode, setSubmitMode] = useState<'submit' | 'draft'>('submit');

  // Export mode state
  const [exportOutput, setExportOutput] = useState<ExportOutput>('file');
  const [exportRunning, setExportRunning] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResultJson, setExportResultJson] = useState<string | null>(null);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [exportDownloadedAs, setExportDownloadedAs] = useState<string | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [pasteText, setPasteText] = useState('');
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateInput[] | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  // Partner Bundle picker state. `partnerSelection[partnerId]` is the set of
  // currently-checked template ids for that partner. Initialized to all-on
  // since users usually want the whole bundle.
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerSelection, setPartnerSelection] = useState<
    Record<string, Set<string>>
  >(initialPartnerSelection);
  const [partnerExpanded, setPartnerExpanded] = useState<Record<string, boolean>>(
    {}
  );
  /** Per-template expand state inside a partner — keyed by template id. */
  const [partnerTplExpanded, setPartnerTplExpanded] = useState<
    Record<string, boolean>
  >({});
  /** Edits the user has made inline before clicking Save. Each entry is
      keyed by template id and stores optional overrides for title (top-level),
      name (provider_template.name), and body (first localization's BODY text). */
  type PartnerEdit = {title?: string; name?: string; body?: string};
  const [partnerEdits, setPartnerEdits] = useState<Record<string, PartnerEdit>>(
    {}
  );
  /** Partner-level seed values: `partnerSeed[partnerId][fieldId] = userValue`.
      Replaced into template payloads at display & save time. */
  const [partnerSeed, setPartnerSeed] = useState<
    Record<string, Record<string, string>>
  >({});
  /** Names of partners whose templates are currently loaded — used for the
      "loaded from Rapid + Optima" status line under the tab. */
  const [partnerLoadedFrom, setPartnerLoadedFrom] = useState<string[]>([]);

  const [logLines, setLogLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [showFullLog, setShowFullLog] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [phaseStates, setPhaseStates] = useState<Record<ImportPhase, PhaseState>>(
    {
      create: emptyPhase(),
      localization: emptyPhase(),
      submit: emptyPhase(),
    }
  );
  const [activePhase, setActivePhase] = useState<ImportPhase | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logScrollRef = useRef<HTMLPreElement | null>(null);
  const formCardRef = useRef<HTMLElement | null>(null);
  /** Right card's own max-height tracks the left form card's total height,
      so the bottoms align exactly when the log is long. */
  const [rightCardMaxHeight, setRightCardMaxHeight] = useState<number | undefined>(undefined);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    if (!showFullLog) return;
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logLines, showFullLog]);

  /**
   * Mirror the left form card's height onto the right card as a max-height.
   * Combined with `display: flex; flex-direction: column` on the right card
   * and `flex: 1 1 auto; min-height: 0; overflow: auto` on the log, this means:
   * - log content fits within the right card's natural size → card content-sized,
   *   log content-sized, no fake stretching;
   * - log content exceeds available space → card caps at the form's height, log
   *   shrinks to fit and scrolls internally, card bottoms align exactly.
   */
  useEffect(() => {
    const formEl = formCardRef.current;
    if (!formEl || typeof ResizeObserver === 'undefined') return;
    const compute = () => setRightCardMaxHeight(formEl.offsetHeight);
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(formEl);
    return () => obs.disconnect();
  }, [showFullLog, hasStarted, mode, submitMode, keepNames, exportRunning]);

  const parsePaste = useCallback((text: string) => {
    setInputError(null);
    setTemplates(null);
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    try {
      const parsed = parseTemplatesJsonFile(trimmed);
      setTemplates(parsed);
    } catch (err) {
      setInputError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const onFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setInputError(null);
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
        setInputError(err instanceof Error ? err.message : String(err));
      }
    };
    reader.onerror = () => {
      setInputError('Could not read the selected file.');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const onPasteChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setPasteText(text);
      parsePaste(text);
    },
    [parsePaste]
  );

  const switchInputMode = useCallback(
    (mode: InputMode) => {
      if (running) return;
      setInputMode(mode);
      setInputError(null);
      setTemplates(null);
      setPartnerLoadedFrom([]);
      if (mode !== 'paste') {
        setPasteText('');
      }
      if (mode !== 'file') {
        setFileLabel(null);
      }
      // Open the partner picker automatically when entering Partner mode —
      // the modal IS the primary action for this tab.
      if (mode === 'partner') {
        setPartnerModalOpen(true);
      }
    },
    [running]
  );

  /** Single-partner constraint helper: returns a fresh selection map with
      every partner emptied except `keepId` (whose existing set is preserved). */
  const clearOtherPartners = useCallback(
    (
      prev: Record<string, Set<string>>,
      keepId: string
    ): Record<string, Set<string>> => {
      const next: Record<string, Set<string>> = {};
      for (const p of PARTNER_BUNDLES) {
        next[p.id] = p.id === keepId ? new Set(prev[p.id] ?? []) : new Set();
      }
      return next;
    },
    []
  );

  /** Toggle a single template's checked state within a partner.
      Selecting in one partner clears the other partner's selection
      (single-partner-at-a-time constraint). */
  const togglePartnerTemplate = useCallback(
    (partnerId: string, templateId: string) => {
      setPartnerSelection((prev) => {
        const next = clearOtherPartners(prev, partnerId);
        const set = next[partnerId];
        if (set.has(templateId)) {
          set.delete(templateId);
        } else {
          set.add(templateId);
        }
        return next;
      });
    },
    [clearOtherPartners]
  );

  /** Tick or untick every template under a partner. Other partners get cleared. */
  const togglePartnerAll = useCallback(
    (partnerId: string) => {
      setPartnerSelection((prev) => {
        const partner = PARTNER_BUNDLES.find((p) => p.id === partnerId);
        if (!partner) return prev;
        const current = prev[partnerId] ?? new Set<string>();
        const allOn = current.size === partner.templates.length;
        const next = clearOtherPartners(prev, partnerId);
        next[partnerId] = allOn
          ? new Set<string>()
          : new Set(partner.templates.map((t) => t.id));
        return next;
      });
    },
    [clearOtherPartners]
  );

  const togglePartnerExpanded = useCallback((partnerId: string) => {
    setPartnerExpanded((prev) => ({...prev, [partnerId]: !prev[partnerId]}));
  }, []);

  const togglePartnerTplExpanded = useCallback((templateId: string) => {
    setPartnerTplExpanded((prev) => ({...prev, [templateId]: !prev[templateId]}));
  }, []);

  const setPartnerEditField = useCallback(
    (templateId: string, field: keyof PartnerEdit, value: string) => {
      setPartnerEdits((prev) => ({
        ...prev,
        [templateId]: {...(prev[templateId] ?? {}), [field]: value},
      }));
    },
    []
  );

  const setPartnerSeedValue = useCallback(
    (partnerId: string, fieldId: string, value: string) => {
      setPartnerSeed((prev) => ({
        ...prev,
        [partnerId]: {...(prev[partnerId] ?? {}), [fieldId]: value},
      }));
    },
    []
  );

  /** Pull the actual TemplateInput[] out of partner bundles for the currently
      checked set, applying inline edits, push it into the importer state,
      switch default submit mode to draft, and close the modal. */
  const applyPartnerSelection = useCallback(() => {
    const picked: TemplateInput[] = [];
    const partnersUsed: string[] = [];
    for (const partner of PARTNER_BUNDLES) {
      const set = partnerSelection[partner.id];
      if (!set || set.size === 0) continue;
      const fromThis = partner.templates.filter((t) => set.has(t.id));
      if (fromThis.length === 0) continue;
      partnersUsed.push(partner.name);
      const seedsForPartner = partnerSeed[partner.id];
      for (const t of fromThis) {
        // Seed-replace placeholders (e.g. "שם הקליניקה") across the whole
        // template payload first, then layer the user's explicit per-template
        // edits on top so those win for fields they touched.
        const seeded = applyPartnerSeedsToTemplate(
          t.template,
          partner.seedFields,
          seedsForPartner
        );
        picked.push(applyPartnerEditsToTemplate(seeded, partnerEdits[t.id]));
      }
    }
    if (picked.length === 0) {
      setInputError('Pick at least one template before saving.');
      return;
    }
    setInputError(null);
    setTemplates(picked);
    setPartnerLoadedFrom(partnersUsed);
    // Default to draft for partner bundles — users typically want to tweak
    // template text in the Texter UI before submitting for approval.
    setSubmitMode('draft');
    // Partner bundles ship with deliberate template names (e.g.
    // `rapid_welcome`); auto-enable keep-names so the API doesn't replace
    // them with auto-assigned ones. User can untick after if they prefer.
    setKeepNames(true);
    setPartnerModalOpen(false);
  }, [partnerSelection, partnerEdits]);

  const cancelPartnerModal = useCallback(() => {
    setPartnerModalOpen(false);
  }, []);

  // ESC closes the partner modal.
  useEffect(() => {
    if (!partnerModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPartnerModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [partnerModalOpen]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    exportAbortRef.current?.abort();
    exportAbortRef.current = null;
  }, []);

  const resetProgress = useCallback(() => {
    setPhaseStates({
      create: emptyPhase(),
      localization: emptyPhase(),
      submit: emptyPhase(),
    });
    setActivePhase(null);
    setHasStarted(false);
  }, []);

  /** Trigger a browser download of arbitrary text content as a file. */
  const downloadTextAsFile = useCallback(
    (filename: string, content: string, mimeType = 'application/json') => {
      const blob = new Blob([content], {type: mimeType});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revocation so Safari has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    []
  );

  const exportRequiredOk = Boolean(
    projectId.trim() && apiKey.trim() && accountId.trim()
  );

  const handleRunExport = useCallback(async () => {
    if (!proxyConfigured) {
      setExportError(
        'The template import proxy URL is not configured for this site. Set TEMPLATE_IMPORT_PROXY_URL at build time.'
      );
      return;
    }
    if (!exportRequiredOk) {
      setExportError('Fill in all required fields (marked *).');
      return;
    }
    setExportRunning(true);
    setExportError(null);
    setExportResultJson(null);
    setExportCount(null);
    setExportDownloadedAs(null);

    const ac = new AbortController();
    exportAbortRef.current = ac;

    const config: TemplatesExportConfig = {
      projectId: projectId.trim(),
      apiKey,
      accountId: accountId.trim(),
      proxyUrl,
    };

    try {
      const templates = await runTemplatesExport(config, ac.signal);
      const pretty = JSON.stringify(templates, null, 2);
      setExportCount(templates.length);
      if (exportOutput === 'file') {
        const safeProject = projectId.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'project';
        const filename = `${safeProject}_templates.json`;
        downloadTextAsFile(filename, pretty);
        setExportDownloadedAs(filename);
      } else {
        setExportResultJson(pretty);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setExportError('Stopped by user.');
      } else {
        setExportError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setExportRunning(false);
      exportAbortRef.current = null;
    }
  }, [
    proxyConfigured,
    exportRequiredOk,
    projectId,
    apiKey,
    accountId,
    proxyUrl,
    exportOutput,
    downloadTextAsFile,
  ]);


  const handleRun = useCallback(async () => {
    if (!proxyConfigured) {
      setInputError(
        'The template import proxy URL is not configured for this site. Set TEMPLATE_IMPORT_PROXY_URL at build time.'
      );
      return;
    }
    if (!templates?.length) {
      setInputError('Load a valid JSON with at least one template first.');
      return;
    }
    setRunning(true);
    setLogLines([]);
    setLastSummary(null);
    resetProgress();
    setHasStarted(true);
    setActivePhase('create');
    const ac = new AbortController();
    abortRef.current = ac;

    const config: TemplatesImportConfig = {
      projectId: projectId.trim(),
      apiKey,
      accountId: accountId.trim(),
      keepNames,
      nameSuffix,
      delayMsBetweenCalls: Math.max(0, Math.floor(delayMs) || 0),
      proxyUrl,
      submitMode,
    };

    const onProgress = (p: ImportProgress) => {
      // The lib emits one "seed" event per phase at the start of every run so
      // the UI can render full-width bars at 0/total. Those events all have
      // step=0 and zero counters — we must NOT shift activePhase on them, or
      // the last seed (submit) would briefly flash the spinner on Phase 3
      // before Phase 1's first real event corrects it.
      const isSeed =
        p.step === 0 && p.ok === 0 && p.failed === 0 && p.skipped === 0;
      if (!isSeed) {
        setActivePhase(p.phase);
      }
      setPhaseStates((prev) => ({
        ...prev,
        [p.phase]: {
          step: p.step,
          totalSteps: p.totalSteps,
          ok: p.ok,
          failed: p.failed,
          skipped: p.skipped,
        },
      }));
    };

    try {
      appendLog('Starting import…');
      const summary = await runTemplatesImport(
        config,
        templates,
        appendLog,
        ac.signal,
        onProgress
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
      appendLog('');
      appendLog(`${'='.repeat(40)}`);
      appendLog('SUMMARY');
      appendLog(`${'='.repeat(40)}`);
      appendLog(`Create: ${cOk} ok, ${cFail} failed`);
      appendLog(`Localizations: ${lOk} ok, ${lFail} failed, ${lSkip} skipped`);
      if (submitMode === 'draft') {
        appendLog('Submit: skipped (draft mode)');
      } else {
        appendLog(`Submit: ${sOk} ok, ${sFail} failed, ${sSkip} skipped`);
      }

      const fmtPhase = (label: string, ok: number, fail: number, total: number) => {
        if (ok === 0 && fail === 0) return `${label}: skipped`;
        if (fail === 0) return `${label}: ${ok}/${total}`;
        if (ok === 0) return `${label}: 0/${total} failed`;
        return `${label}: ${ok} ok, ${fail} failed`;
      };
      const summaryParts = [
        fmtPhase('Create', cOk, cFail, summary.createResults.length),
        fmtPhase('Localize', lOk, lFail, lOk + lFail + lSkip),
      ];
      if (submitMode === 'draft') {
        summaryParts.push('Submit: draft mode');
      } else {
        summaryParts.push(fmtPhase('Submit', sOk, sFail, sOk + sFail + sSkip));
      }
      setLastSummary(summaryParts.join(' · '));
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
          msg.toLowerCase().includes('proxy') ||
          msg.toLowerCase().includes('err_network')
        ) {
          appendLog(
            'Tip: If you see no HTTP response, the import proxy may be down or misconfigured. Check that the n8n workflow is active.'
          );
        }
      }
    } finally {
      setRunning(false);
      setActivePhase(null);
      abortRef.current = null;
    }
  }, [
    proxyConfigured,
    proxyUrl,
    templates,
    projectId,
    apiKey,
    accountId,
    keepNames,
    nameSuffix,
    delayMs,
    submitMode,
    appendLog,
    resetProgress,
  ]);

  /** Phases that actually run — used for overall progress & aggregate outcome.
      The phase LIST always renders all three rows; the submit row is shown
      disabled in draft mode so the right card's natural height stays consistent. */
  const visiblePhases = useMemo(
    () => (submitMode === 'draft' ? PHASES.slice(0, 2) : PHASES),
    [submitMode]
  );

  /** True when at least one template from any partner is currently ticked.
      Used to disable the Save selection button so users can't save an empty
      set. */
  const hasAnyPartnerSelection = useMemo(
    () => Object.values(partnerSelection).some((set) => set.size > 0),
    [partnerSelection]
  );

  const requiredOk = Boolean(
    projectId.trim() && apiKey.trim() && accountId.trim() && templates?.length
  );

  const totalProgressPct = useMemo(() => {
    const segments = visiblePhases.map((p) => {
      const s = phaseStates[p];
      if (s.totalSteps === 0) return 0;
      return s.step / s.totalSteps;
    });
    return Math.round((segments.reduce((a, b) => a + b, 0) / visiblePhases.length) * 100);
  }, [phaseStates]);

  return (
    <div className={styles.root}>
      {/* Mode toggle — swaps the entire tool between Import and Export. */}
      <div
        className={clsx(styles.modeTabs, styles.modeTabsLarge)}
        role="tablist"
        aria-label="Tool mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'import'}
          className={clsx(styles.modeTab, mode === 'import' && styles.modeTabActive)}
          onClick={() => setMode('import')}
          disabled={running || exportRunning}>
          Import
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'export'}
          className={clsx(styles.modeTab, mode === 'export' && styles.modeTabActive)}
          onClick={() => setMode('export')}
          disabled={running || exportRunning}>
          Export
        </button>
      </div>

      {mode === 'import' ? (
        <p className={styles.lead}>
          Bulk-create WhatsApp templates in a Texter project from JSON — for seeding a new
          account or restoring an export.
        </p>
      ) : (
        <p className={styles.lead}>
          Download all WhatsApp templates from one Texter account as JSON — mainly for
          backups or feeding the import tab.
        </p>
      )}

      <div className={styles.warn}>
        Your API key is sent from this browser to the Texter Docs proxy and forwarded to{' '}
        <code>*.texterchat.com</code>. It is never stored, but anyone with access to this tab
        can intercept it — use a dedicated key with the minimum scopes you need and revoke it
        when finished.
      </div>

      {!proxyConfigured ? (
        <div className={styles.warn}>
          <strong>Proxy is not configured for this deploy.</strong> Set the
          <code> TEMPLATE_IMPORT_PROXY_URL</code> environment variable at build time.
        </div>
      ) : null}

      {mode === 'import' ? (
      <div className={styles.grid}>
        <section className={styles.card} ref={formCardRef}>
          <h2 className={styles.cardTitle}>Configuration</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-project">
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
              id="ti-project"
              className={styles.input}
              autoComplete="off"
              placeholder="e.g. mycompany"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={running}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-key">
              API key <span className={styles.req} aria-hidden="true">*</span>
              <HelpIcon
                tip={
                  <>
                    Bearer token with the <strong>Manage Template Messages</strong> scope.
                  </>
                }
                label="API key help"
              />
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
              required
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-account">
              WhatsApp account ID <span className={styles.req} aria-hidden="true">*</span>
              <HelpIcon
                tip="The phone-number ID of the WhatsApp Business account that owns these templates."
                label="WhatsApp account ID help"
              />
            </label>
            <input
              id="ti-account"
              className={styles.input}
              autoComplete="off"
              placeholder="e.g. 972501234567"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={running}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              Templates JSON <span className={styles.req} aria-hidden="true">*</span>
              <HelpIcon
                tip={
                  <>
                    Accepts an array of template objects with{' '}
                    <code>provider_template</code>,{' '}
                    <code>{'{"templates": [...] }'}</code>, or a single template object.
                  </>
                }
                label="Templates JSON format"
              />
            </span>
            <div className={styles.modeTabs} role="tablist" aria-label="Input mode">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'file'}
                className={clsx(styles.modeTab, inputMode === 'file' && styles.modeTabActive)}
                onClick={() => switchInputMode('file')}
                disabled={running}>
                Upload file
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'paste'}
                className={clsx(styles.modeTab, inputMode === 'paste' && styles.modeTabActive)}
                onClick={() => switchInputMode('paste')}
                disabled={running}>
                Paste JSON
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'partner'}
                className={clsx(styles.modeTab, inputMode === 'partner' && styles.modeTabActive)}
                onClick={() => switchInputMode('partner')}
                disabled={running}>
                Partner Bundle
              </button>
            </div>

            {inputMode === 'file' && (
              <>
                <input
                  id="ti-file"
                  type="file"
                  accept=".json,application/json"
                  className={styles.fileInput}
                  onChange={onFile}
                  disabled={running}
                />
                {inputError ? (
                  <p className={styles.hint}>
                    <span className={styles.metaBad}>{inputError}</span>
                  </p>
                ) : fileLabel ? (
                  <p className={styles.hint}>
                    Selected: <strong>{fileLabel}</strong>
                    {templates && (
                      <>
                        {' '}
                        — <span className={styles.metaOk}>{templates.length} template(s)</span>
                      </>
                    )}
                  </p>
                ) : null}
              </>
            )}

            {inputMode === 'paste' && (
              <>
                <textarea
                  className={styles.pasteArea}
                  placeholder='[{ "title": "...", "provider_template": { ... } }, ...]'
                  value={pasteText}
                  onChange={onPasteChange}
                  disabled={running}
                  spellCheck={false}
                  rows={8}
                />
                {inputError ? (
                  <p className={styles.hint}>
                    <span className={styles.metaBad}>{inputError}</span>
                  </p>
                ) : templates ? (
                  <p className={styles.hint}>
                    <span className={styles.metaOk}>{templates.length} template(s)</span> parsed.
                  </p>
                ) : null}
              </>
            )}

            {inputMode === 'partner' && (
              <div className={styles.partnerPicker}>
                <button
                  type="button"
                  className={styles.partnerOpenBtn}
                  onClick={() => setPartnerModalOpen(true)}
                  disabled={running}>
                  {templates && partnerLoadedFrom.length > 0
                    ? 'Change selection…'
                    : 'Choose partner templates…'}
                </button>
                {inputError ? (
                  <p className={styles.hint}>
                    <span className={styles.metaBad}>{inputError}</span>
                  </p>
                ) : templates && partnerLoadedFrom.length > 0 ? (
                  <p className={styles.hint}>
                    <span className={styles.metaOk}>{templates.length} template(s)</span>{' '}
                    loaded from {partnerLoadedFrom.join(' + ')}.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-submit-mode">
              Submit mode
              <HelpIcon
                tip="Draft skips the final submit-for-approval call, so localizations stay editable in the Texter UI."
                label="Submit mode help"
              />
            </label>
            <select
              id="ti-submit-mode"
              className={styles.input}
              value={submitMode}
              onChange={(e) => setSubmitMode(e.target.value as 'submit' | 'draft')}
              disabled={running}>
              <option value="submit">Auto-submit for WhatsApp approval</option>
              <option value="draft">Draft - create + localize only (no submit)</option>
            </select>
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
              <HelpIcon
                tip={
                  <>
                    When off, the create payload omits <code>name</code> so the API
                    auto-assigns one.
                  </>
                }
                label="Keep names help"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-suffix">
              Name suffix <span className={styles.optional}>(optional)</span>
              <HelpIcon
                tip="Appended to each name. Letters, digits and underscores only. Only used when 'Keep original names' is on."
                label="Name suffix help"
              />
            </label>
            <input
              id="ti-suffix"
              className={styles.input}
              placeholder="_new"
              value={nameSuffix}
              onChange={(e) => setNameSuffix(e.target.value)}
              disabled={running || !keepNames}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ti-delay">
              Delay between API calls (ms)
              <HelpIcon
                tip="Wait this long between every create / localize / submit call to avoid rate-limiting on the Texter API."
                label="Delay help"
              />
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
              disabled={running || !requiredOk || !proxyConfigured}
              title={!requiredOk ? 'Fill in all required fields (marked *)' : undefined}
              onClick={() => void handleRun()}>
              {running ? 'Running…' : 'Run import'}
            </button>
            <button
              type="button"
              className={clsx('button', 'button--outline')}
              disabled={!running}
              onClick={handleAbort}>
              Stop
            </button>
          </div>
        </section>

        <section
          className={styles.card}
          style={
            rightCardMaxHeight
              ? {
                  height: `${rightCardMaxHeight}px`,
                  display: 'flex',
                  flexDirection: 'column',
                }
              : undefined
          }>
          <div className={styles.logHeader}>
            <h2 className={styles.cardTitle}>Progress</h2>
          </div>

          {lastSummary && (
            <div className={styles.summaryRow}>
              <span className={clsx(styles.summaryPill, styles[`pill_${aggregateOutcome(visiblePhases.map((p) => phaseOutcome(phaseStates[p], false, hasStarted)))}`])}>
                Last run: {lastSummary}
              </span>
            </div>
          )}

          {hasStarted ? (() => {
            const outcomes = visiblePhases.map((p) =>
              phaseOutcome(phaseStates[p], activePhase === p && running, hasStarted)
            );
            const overall = running ? 'running' : aggregateOutcome(outcomes);
            const overallFillClass = OUTCOME_CLASS[overall];
            return (
              <div
                className={styles.overallBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={totalProgressPct}
                aria-label="Overall import progress">
                <div
                  className={clsx(
                    styles.overallFill,
                    overallFillClass && styles[overallFillClass],
                    running && styles.overallFillRunning
                  )}
                  style={{width: `${totalProgressPct}%`}}
                />
                <span className={styles.overallText}>
                  {running ? `${totalProgressPct}%` : outcomeLabel(overall) || `${totalProgressPct}%`}
                </span>
              </div>
            );
          })() : null}

          <ul className={styles.phaseList}>
            {PHASES.map((phase, idx) => {
              const isDraftDisabled = submitMode === 'draft' && phase === 'submit';
              const s = phaseStates[phase];
              const total = s.totalSteps || (templates?.length ?? 0);
              const pct = total > 0 ? Math.round((s.step / total) * 100) : 0;
              const isActive = activePhase === phase && running && !isDraftDisabled;
              const outcome = isDraftDisabled
                ? 'skipped'
                : phaseOutcome(s, isActive, hasStarted);
              const fillClass = OUTCOME_CLASS[outcome];
              const showSkipped = s.skipped > 0;
              return (
                <li
                  key={phase}
                  className={clsx(
                    styles.phaseRow,
                    isDraftDisabled && styles.phaseRowDisabled
                  )}
                  aria-disabled={isDraftDisabled || undefined}>
                  <div className={styles.phaseHead}>
                    <span className={styles.phaseLabel}>
                      <span className={styles.phaseIndex}>Phase {idx + 1}</span>
                      <span className={styles.phaseName}>{PHASE_LABELS[phase]}</span>
                      {isActive ? <span className={styles.spinner} aria-hidden="true" /> : null}
                    </span>
                    <span className={styles.phaseCounts}>
                      {isDraftDisabled ? (
                        <span className={styles.countSkip}>draft mode</span>
                      ) : outcome === 'skipped' && !running ? (
                        <span className={styles.countSkip}>skipped</span>
                      ) : (
                        <>
                          <span className={styles.phaseStep}>
                            {s.step}/{total || '—'}
                          </span>
                          {s.ok > 0 && (
                            <span className={styles.countOk}>{s.ok} ok</span>
                          )}
                          {s.failed > 0 && (
                            <span className={styles.countBad}>{s.failed} failed</span>
                          )}
                          {showSkipped && outcome !== 'skipped' && (
                            <span className={styles.countSkip}>{s.skipped} skipped</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      styles.phaseBar,
                      isActive && styles.phaseBarActive,
                      outcome === 'success' && styles.phaseBarDone
                    )}>
                    <div
                      className={clsx(
                        styles.phaseFill,
                        fillClass && styles[fillClass],
                        isActive && styles.phaseFillRunning
                      )}
                      style={{
                        width:
                          isDraftDisabled || (outcome === 'skipped' && !running)
                            ? '100%'
                            : `${pct}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className={styles.logToggleRow}>
            <button
              type="button"
              className={styles.logToggle}
              onClick={() => setShowFullLog((v) => !v)}
              aria-expanded={showFullLog}>
              {showFullLog ? '▾ Hide full log' : '▸ Show full log'}
            </button>
            {logLines.length > 0 && !showFullLog ? (
              <span className={styles.hint}>
                {logLines.length} line{logLines.length === 1 ? '' : 's'} recorded
              </span>
            ) : null}
          </div>

          {showFullLog ? (
            <pre
              className={styles.log}
              aria-live="polite"
              ref={logScrollRef}
              style={{flex: '1 1 auto', minHeight: 0}}>
              {logLines.length ? logLines.join('\n') : 'Output appears here when you run import.'}
            </pre>
          ) : null}
        </section>
      </div>
      ) : (
        <div className={styles.grid}>
          <section className={styles.card} ref={formCardRef}>
            <h2 className={styles.cardTitle}>Configuration</h2>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="te-project">
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
                id="te-project"
                className={styles.input}
                autoComplete="off"
                placeholder="e.g. mycompany"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={exportRunning}
                required
                aria-required="true"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="te-key">
                API key <span className={styles.req} aria-hidden="true">*</span>
                <HelpIcon
                  tip={
                    <>
                      Bearer token with the <strong>View Template Messages</strong> scope.
                    </>
                  }
                  label="API key help"
                />
              </label>
              <input
                id="te-key"
                type="password"
                className={styles.input}
                autoComplete="off"
                placeholder="Bearer token"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={exportRunning}
                required
                aria-required="true"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="te-account">
                WhatsApp account ID <span className={styles.req} aria-hidden="true">*</span>
                <HelpIcon
                  tip="The phone-number ID of the WhatsApp Business account you want to export."
                  label="WhatsApp account ID help"
                />
              </label>
              <input
                id="te-account"
                className={styles.input}
                autoComplete="off"
                placeholder="e.g. 972501234567"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={exportRunning}
                required
                aria-required="true"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="te-output">
                Output
                {exportOutput === 'file' ? (
                  <HelpIcon
                    tip={
                      <>
                        Saves as <code>&lt;projectId&gt;_templates.json</code> in your
                        browser&apos;s downloads folder.
                      </>
                    }
                    label="Output help"
                  />
                ) : null}
              </label>
              <select
                id="te-output"
                className={styles.input}
                value={exportOutput}
                onChange={(e) => setExportOutput(e.target.value as ExportOutput)}
                disabled={exportRunning}>
                <option value="file">Download JSON File</option>
                <option value="inline">Print JSON Result</option>
              </select>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="button button--primary"
                disabled={exportRunning || !exportRequiredOk || !proxyConfigured}
                title={!exportRequiredOk ? 'Fill in all required fields (marked *)' : undefined}
                onClick={() => void handleRunExport()}>
                {exportRunning ? 'Running…' : 'Run export'}
              </button>
            </div>
          </section>

          <section
            className={styles.card}
            style={
              rightCardMaxHeight
                ? {
                    height: `${rightCardMaxHeight}px`,
                    display: 'flex',
                    flexDirection: 'column',
                  }
                : undefined
            }>
            <h2 className={styles.cardTitle}>Result</h2>

            {exportRunning ? (
              <p className={styles.hint}>
                <span className={styles.spinner} aria-hidden="true" /> Fetching templates…
              </p>
            ) : null}

            {exportError ? (
              <p className={styles.hint}>
                <span className={styles.metaBad}>{exportError}</span>
              </p>
            ) : null}

            {!exportRunning && !exportError && exportCount === null ? (
              <p className={styles.hint}>
                Output appears here when you run export.
              </p>
            ) : null}

            {!exportRunning && exportCount !== null && exportDownloadedAs ? (
              <p className={styles.hint}>
                <span className={styles.metaOk}>
                  Downloaded {exportCount} template{exportCount === 1 ? '' : 's'}
                </span>{' '}
                as <code>{exportDownloadedAs}</code>.
              </p>
            ) : null}

            {!exportRunning && exportResultJson !== null ? (
              <div className={styles.resultBlockWrap}>
                <p className={styles.resultCount}>
                  <span className={styles.metaOk}>
                    {exportCount} template{exportCount === 1 ? '' : 's'}
                  </span>{' '}
                  returned.
                </p>
                <div className={styles.codeBlockHost}>
                  <CodeBlock language="json">{exportResultJson}</CodeBlock>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {/* ─── Partner Bundle picker modal ─── */}
      {partnerModalOpen && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-modal-title"
          onClick={cancelPartnerModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 id="partner-modal-title" className={styles.modalTitle}>
                Partner Bundles
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close"
                onClick={cancelPartnerModal}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalIntro}>
                Tick a partner to include all of its starter templates, or
                expand to pick individual templates. The Save button loads your
                selection into the importer below.
              </p>

              {PARTNER_BUNDLES.map((partner) => {
                const set = partnerSelection[partner.id] ?? new Set<string>();
                const total = partner.templates.length;
                const selected = set.size;
                const allOn = selected === total;
                const someOn = selected > 0 && selected < total;
                const expanded = !!partnerExpanded[partner.id];
                return (
                  <div key={partner.id} className={styles.partnerSection}>
                    <div className={styles.partnerHead}>
                      <label className={styles.partnerHeadLabel}>
                        <input
                          type="checkbox"
                          checked={allOn}
                          ref={(el) => {
                            if (el) el.indeterminate = someOn;
                          }}
                          onChange={() => togglePartnerAll(partner.id)}
                        />
                        <span className={styles.partnerName}>{partner.name}</span>
                        <span className={styles.partnerCount}>
                          {selected}/{total}
                        </span>
                      </label>
                      <button
                        type="button"
                        className={styles.partnerExpandBtn}
                        onClick={() => togglePartnerExpanded(partner.id)}
                        aria-expanded={expanded}
                        aria-controls={`partner-list-${partner.id}`}>
                        {expanded ? '▾' : '▸'} {expanded ? 'Hide' : 'Show'} templates
                      </button>
                    </div>
                    {partner.description && (
                      <p className={styles.partnerDescription}>
                        {partner.description}
                      </p>
                    )}
                    {/* Seed inputs only matter once the partner is actually
                        chosen (i.e., has at least one template ticked) — hide
                        them until then so the modal stays compact when the
                        partner isn't being used. */}
                    {partner.seedFields &&
                      partner.seedFields.length > 0 &&
                      selected > 0 && (
                      <div className={styles.partnerSeedFields}>
                        {partner.seedFields.map((field) => (
                          <label
                            key={field.id}
                            className={styles.partnerSeedLabel}>
                            <span className={styles.partnerSeedLabelText}>
                              {field.label}
                            </span>
                            <input
                              type="text"
                              className={styles.partnerSeedInput}
                              value={
                                partnerSeed[partner.id]?.[field.id] ?? ''
                              }
                              onChange={(e) =>
                                setPartnerSeedValue(
                                  partner.id,
                                  field.id,
                                  e.target.value
                                )
                              }
                              placeholder={field.inputPlaceholder}
                            />
                            {field.hint && (
                              <span className={styles.partnerSeedHint}>
                                {field.hint}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    {expanded && (
                      <ul
                        id={`partner-list-${partner.id}`}
                        className={styles.partnerTemplateList}>
                        {partner.templates.map((t) => {
                          const checked = set.has(t.id);
                          const tplExpanded = !!partnerTplExpanded[t.id];
                          const edit = partnerEdits[t.id] ?? {};
                          // Apply the partner's seed values for display, so
                          // empty edits show the seeded version (e.g.
                          // "תודה - Optima Dental Clinic") instead of the
                          // raw placeholder.
                          const seededTpl = applyPartnerSeedsToTemplate(
                            t.template,
                            partner.seedFields,
                            partnerSeed[partner.id]
                          );
                          const currentTitle =
                            edit.title ?? getTemplateTitle(seededTpl);
                          const currentName =
                            edit.name ?? getTemplateApiName(seededTpl);
                          const currentBody =
                            edit.body ?? getTemplateBodyText(seededTpl);
                          return (
                            <li key={t.id} className={styles.partnerTemplateItem}>
                              <div className={styles.partnerTemplateRow}>
                                <label className={styles.partnerTemplateLabel}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      togglePartnerTemplate(partner.id, t.id)
                                    }
                                  />
                                  <span className={styles.partnerTemplateTitle}>
                                    {currentTitle || t.name}
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  className={styles.partnerTemplateExpand}
                                  onClick={() => togglePartnerTplExpanded(t.id)}
                                  aria-expanded={tplExpanded}
                                  aria-controls={`partner-tpl-${t.id}`}>
                                  {tplExpanded ? '▾' : '▸'}
                                </button>
                              </div>
                              {tplExpanded && (
                                <div
                                  id={`partner-tpl-${t.id}`}
                                  className={styles.partnerTemplateEdit}>
                                  <label className={styles.partnerEditLabel}>
                                    Title
                                    <input
                                      type="text"
                                      className={styles.partnerEditInput}
                                      value={currentTitle}
                                      onChange={(e) =>
                                        setPartnerEditField(
                                          t.id,
                                          'title',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className={styles.partnerEditLabel}>
                                    Name
                                    <input
                                      type="text"
                                      className={clsx(
                                        styles.partnerEditInput,
                                        styles.partnerEditInputMono
                                      )}
                                      value={currentName}
                                      onChange={(e) =>
                                        setPartnerEditField(
                                          t.id,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      pattern="[a-zA-Z0-9_]+"
                                    />
                                    <span className={styles.partnerEditSub}>
                                      Letters, digits and underscores only.
                                    </span>
                                  </label>
                                  <label className={styles.partnerEditLabel}>
                                    Body
                                    <textarea
                                      className={clsx(
                                        styles.partnerEditInput,
                                        styles.partnerEditTextarea
                                      )}
                                      value={currentBody}
                                      onChange={(e) =>
                                        setPartnerEditField(
                                          t.id,
                                          'body',
                                          e.target.value
                                        )
                                      }
                                      rows={3}
                                    />
                                  </label>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={cancelPartnerModal}>
                Cancel
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={applyPartnerSelection}
                disabled={!hasAnyPartnerSelection}
                title={!hasAnyPartnerSelection ? 'Pick a partner first' : undefined}>
                Save selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

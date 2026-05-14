/**
 * Client-side WhatsApp template import against Texter HTTP API v2.
 * Mirrors the flow from templates_json_to_texter.ipynb (create → localizations → submit).
 *
 * All HTTP calls are tunneled through an n8n CORS proxy because the Texter API's
 * CORS allow-list doesn't include Content-Type, so a direct browser→API JSON POST
 * fails preflight. The proxy validates URLs against a texterchat.com whitelist
 * and passes upstream status + body through unchanged.
 */

const MAX_ERROR_BODY_CHARS = 8000;

class HttpResponseError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data: unknown;
  constructor(status: number, statusText: string, data: unknown) {
    super(`HTTP ${status}${statusText ? ` ${statusText}` : ''}`);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export type SubmitMode = 'submit' | 'draft';

export type TemplatesImportConfig = {
  projectId: string;
  apiKey: string;
  accountId: string;
  keepNames: boolean;
  nameSuffix: string;
  /** Delay between every API call (ms). Includes localization & submit, not just creates. */
  delayMsBetweenCalls: number;
  /** n8n CORS proxy webhook URL. Browser POSTs `{ method, url, headers, payload }` here. */
  proxyUrl: string;
  /** When 'draft', skip the submit phase entirely so templates stay editable. */
  submitMode: SubmitMode;
};

export type ImportPhase = 'create' | 'localization' | 'submit';

export type ImportProgress = {
  phase: ImportPhase;
  /** 1-based count of items processed in this phase, including the current one. */
  step: number;
  totalSteps: number;
  ok: number;
  failed: number;
  skipped: number;
};

export type TemplateInput = Record<string, unknown>;

export type CreateResult =
  | {status: 'success'; name: string; response: unknown}
  | {status: 'failed'; name: string; error: string};

export type LocalizationOpResult =
  | {name: string; status: 'success'; response: unknown}
  | {name: string; status: 'failed'; error: string}
  | {name: string; status: 'skipped'; message: string};

export type SubmitOpResult =
  | {name: string; language: string; status: 'success'; response: unknown}
  | {name: string; language: string; status: 'failed'; error: string}
  | {name: string; language?: string; status: 'skipped'; message: string};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getProvider(template: TemplateInput): Record<string, unknown> {
  const pt = template.provider_template;
  if (!isRecord(pt)) {
    throw new Error('Each template must include a "provider_template" object.');
  }
  return pt;
}

function pickField(
  template: TemplateInput,
  provider: Record<string, unknown>,
  field: string
): unknown {
  if (field in template) {
    return template[field];
  }
  if (field in provider) {
    return provider[field];
  }
  return undefined;
}

function buildCreatePayload(
  template: TemplateInput,
  config: TemplatesImportConfig
): Record<string, unknown> {
  const provider = getProvider(template);
  const payload: Record<string, unknown> = {};

  const required = ['title', 'category', 'usage', 'chatStatus'] as const;
  for (const field of required) {
    const v = pickField(template, provider, field);
    if (v === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
    payload[field] = v;
  }

  let currentName: string | undefined;
  if (typeof template.name === 'string') {
    currentName = template.name;
  } else if (typeof provider.name === 'string') {
    currentName = provider.name;
  }

  if (config.keepNames && currentName) {
    payload.name =
      config.nameSuffix.length > 0
        ? `${currentName}${config.nameSuffix}`
        : currentName;
  }

  const optional = [
    'isDefault',
    'departments',
    'setBotNode',
    'responsibleAgent',
    'responsibleDepartment',
    'replyText',
  ] as const;
  for (const field of optional) {
    const v = pickField(template, provider, field);
    if (v !== undefined) {
      payload[field] = v;
    }
  }

  const cat = String(payload.category);
  if (!['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(cat)) {
    throw new Error(`Invalid category: ${cat}`);
  }
  const usage = String(payload.usage);
  if (!['inbox', 'bulk'].includes(usage)) {
    throw new Error(`Invalid usage: ${usage}`);
  }

  return payload;
}

function stringifyResponseBody(data: unknown): string {
  if (data === undefined || data === null || data === '') {
    return '(empty)';
  }
  if (typeof data === 'string') {
    return data.length > MAX_ERROR_BODY_CHARS
      ? `${data.slice(0, MAX_ERROR_BODY_CHARS)}…`
      : data;
  }
  try {
    const s = JSON.stringify(data, null, 2);
    return s.length > MAX_ERROR_BODY_CHARS
      ? `${s.slice(0, MAX_ERROR_BODY_CHARS)}…`
      : s;
  } catch {
    return String(data);
  }
}

/**
 * Turns fetch / network failures into a multi-line message for the import log.
 * HTTP errors always include response body when the server returned one.
 *
 * `displayUrl` is the upstream Texter URL (not the proxy) so logs stay readable.
 */
export function formatTemplatesImportRequestError(
  displayUrl: string,
  err: unknown
): string {
  const safeUrl = displayUrl.split('?')[0] ?? displayUrl;

  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request aborted.';
  }

  const lines: string[] = [];

  if (err instanceof HttpResponseError) {
    lines.push(
      `HTTP ${err.status}${err.statusText ? ` ${err.statusText}` : ''}`.trim()
    );
    lines.push(`Response body:\n${stringifyResponseBody(err.data)}`);
  } else if (err instanceof TypeError) {
    // fetch throws TypeError for network failures (DNS, CORS, offline, etc.)
    lines.push('No HTTP response (network or proxy unreachable).');
    if (err.message) {
      lines.push(err.message);
    }
  } else if (err instanceof Error) {
    lines.push(`${err.name}: ${err.message}`);
  } else {
    lines.push(String(err));
  }

  lines.push(`Request: POST ${safeUrl}`);
  return lines.join('\n');
}

function logIndentedMessage(
  log: (line: string) => void,
  err: unknown
): void {
  const msg = err instanceof Error ? err.message : String(err);
  for (const line of msg.split('\n')) {
    log(`  ${line}`);
  }
}

async function postJson(
  proxyUrl: string,
  targetUrl: string,
  apiKey: string,
  body: unknown | undefined,
  signal: AbortSignal | undefined
): Promise<unknown> {
  const upstreamHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body !== undefined) {
    upstreamHeaders['Content-Type'] = 'application/json';
  }

  const envelope: Record<string, unknown> = {
    method: 'POST',
    url: targetUrl,
    headers: upstreamHeaders,
  };
  if (body !== undefined) {
    envelope.payload = body;
  }

  let res: Response;
  try {
    res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(envelope),
      signal,
    });
  } catch (e) {
    throw new Error(formatTemplatesImportRequestError(targetUrl, e));
  }

  // Read body once. JSON if the proxy says so, otherwise plain text we surface
  // verbatim so users can still see what came back.
  const contentType = res.headers.get('content-type') ?? '';
  let parsed: unknown;
  if (contentType.toLowerCase().includes('application/json')) {
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
  } else {
    try {
      parsed = await res.text();
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    throw new Error(
      formatTemplatesImportRequestError(
        targetUrl,
        new HttpResponseError(res.status, res.statusText, parsed)
      )
    );
  }

  return parsed ?? null;
}

function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      {once: true}
    );
  });
}

export function parseTemplatesJsonFile(raw: string): TemplateInput[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (Array.isArray(data)) {
    return data as TemplateInput[];
  }
  if (isRecord(data) && Array.isArray(data.templates)) {
    return data.templates as TemplateInput[];
  }
  if (isRecord(data) && 'provider_template' in data) {
    return [data as TemplateInput];
  }
  throw new Error(
    'JSON must be an array of templates, an object with a "templates" array, or a single template object.'
  );
}

export type ImportRunSummary = {
  createResults: CreateResult[];
  localizationResults: LocalizationOpResult[];
  submissionResults: SubmitOpResult[];
};

const SEP = '='.repeat(40);

function getDisplayName(template: TemplateInput): string {
  if (typeof template.name === 'string' && template.name) return template.name;
  if (
    isRecord(template.provider_template) &&
    typeof template.provider_template.name === 'string'
  ) {
    return template.provider_template.name;
  }
  return 'unknown';
}

function countLocalizations(template: TemplateInput): number {
  if (!isRecord(template.provider_template)) return 0;
  const locs = template.provider_template.localizations;
  return Array.isArray(locs) ? locs.length : 0;
}

/**
 * Pre-compute progress totals so the UI can render full-width bars from step 0.
 * For phases that operate per template, we count one step per template even if
 * we'll only emit a "skipped" event (e.g. create failed → still advance the bar).
 */
export function computePhaseTotals(
  templates: TemplateInput[],
  submitMode: SubmitMode
): Record<ImportPhase, number> {
  let locSteps = 0;
  let submitSteps = 0;
  for (const tpl of templates) {
    const n = countLocalizations(tpl);
    // At least 1 "skipped" event per template even if it has no localizations.
    locSteps += Math.max(n, 1);
    submitSteps += Math.max(n, 1);
  }
  return {
    create: templates.length,
    localization: locSteps,
    submit: submitMode === 'draft' ? 0 : submitSteps,
  };
}

export async function runTemplatesImport(
  config: TemplatesImportConfig,
  templates: TemplateInput[],
  log: (line: string) => void,
  signal?: AbortSignal,
  onProgress?: (p: ImportProgress) => void
): Promise<ImportRunSummary> {
  const base = `https://${config.projectId.trim()}.texterchat.com/server/api/v2`;
  const key = config.apiKey.trim();
  const accountId = config.accountId.trim();
  const proxyUrl = config.proxyUrl.trim();
  const submitMode: SubmitMode = config.submitMode ?? 'submit';
  const callDelay = Math.max(0, Math.floor(config.delayMsBetweenCalls) || 0);

  if (!proxyUrl) {
    throw new Error(
      'Template import proxy URL is not configured for this deployment. Set TEMPLATE_IMPORT_PROXY_URL at build time.'
    );
  }
  if (!config.projectId.trim()) {
    throw new Error('Project ID is required.');
  }
  if (!key) {
    throw new Error('API key is required.');
  }
  if (!accountId) {
    throw new Error('Account ID is required.');
  }
  if (templates.length === 0) {
    throw new Error('No templates to import.');
  }

  const totals = computePhaseTotals(templates, submitMode);

  // Counters tracked per phase. `step` is total events emitted (calls + skips).
  let createOk = 0,
    createFailed = 0,
    createStep = 0;
  let locOk = 0,
    locFailed = 0,
    locSkipped = 0,
    locStep = 0;
  let submitOk = 0,
    submitFailed = 0,
    submitSkipped = 0,
    submitStep = 0;

  // Seed bars at 0/total so the UI can show empty bars at the correct width.
  onProgress?.({phase: 'create', step: 0, totalSteps: totals.create, ok: 0, failed: 0, skipped: 0});
  onProgress?.({phase: 'localization', step: 0, totalSteps: totals.localization, ok: 0, failed: 0, skipped: 0});
  if (submitMode !== 'draft') {
    onProgress?.({phase: 'submit', step: 0, totalSteps: totals.submit, ok: 0, failed: 0, skipped: 0});
  }

  const emitCreate = () => onProgress?.({
    phase: 'create',
    step: createStep,
    totalSteps: totals.create,
    ok: createOk,
    failed: createFailed,
    skipped: 0,
  });
  const emitLoc = () => onProgress?.({
    phase: 'localization',
    step: locStep,
    totalSteps: totals.localization,
    ok: locOk,
    failed: locFailed,
    skipped: locSkipped,
  });
  const emitSubmit = () => onProgress?.({
    phase: 'submit',
    step: submitStep,
    totalSteps: totals.submit,
    ok: submitOk,
    failed: submitFailed,
    skipped: submitSkipped,
  });

  /**
   * Sleep `callDelay` after a real network call. Skipped templates don't sleep —
   * no API call was made, no rate-limit pressure to relieve.
   */
  let lastWasCall = false;
  async function maybeDelay() {
    if (callDelay > 0 && lastWasCall) {
      await sleep(callDelay, signal);
    }
    lastWasCall = false;
  }

  // ───── Phase 1: Create ─────
  const createResults: CreateResult[] = [];

  for (let idx = 0; idx < templates.length; idx++) {
    const template = templates[idx]!;
    const displayName = getDisplayName(template);

    log('');
    log(SEP);
    log(`Processing template ${idx + 1}/${templates.length}`);
    log(SEP);

    await maybeDelay();

    try {
      const payload = buildCreatePayload(template, config);
      if (typeof payload.name === 'string') {
        log(`Creating template: ${payload.name}`);
      } else {
        log('Creating template: (name omitted — API will auto-assign)');
      }
      log(`  title: ${String(payload.title)}`);
      log(`  category: ${String(payload.category)}`);
      log(`  usage: ${String(payload.usage)}`);
      log(`  chatStatus: ${String(payload.chatStatus)}`);

      const url = `${base}/whatsapp/templates/${encodeURIComponent(accountId)}`;
      const response = await postJson(proxyUrl, url, key, payload, signal);
      lastWasCall = true;
      log('Template created successfully.');
      createResults.push({status: 'success', name: displayName, response});
      createOk++;
    } catch (e) {
      log('Error:');
      logIndentedMessage(log, e);
      const msg = e instanceof Error ? e.message : String(e);
      createResults.push({status: 'failed', name: displayName, error: msg});
      createFailed++;
      // A request was attempted and produced a response (even if 4xx/5xx) — keep
      // the inter-call delay so we don't hammer the API. If the error was thrown
      // before any network call (e.g. validation), it won't have set lastWasCall.
      if (e instanceof Error && /HTTP \d{3}/.test(e.message)) {
        lastWasCall = true;
      }
    }

    createStep++;
    emitCreate();
  }

  // ───── Phase 2: Localizations ─────
  const localizationResults: LocalizationOpResult[] = [];

  for (let idx = 0; idx < createResults.length; idx++) {
    const resultItem = createResults[idx]!;
    const original = templates[idx]!;
    const tplLocs = countLocalizations(original);
    // Number of progress steps this template will consume (matches computePhaseTotals).
    const stepsForThisTemplate = Math.max(tplLocs, 1);

    log('');
    log(SEP);
    log(`Localization ${idx + 1}/${createResults.length}`);
    log(SEP);

    if (resultItem.status !== 'success') {
      log('Skipped (template creation failed).');
      localizationResults.push({
        name: resultItem.name,
        status: 'skipped',
        message: 'Template creation failed',
      });
      locSkipped++;
      locStep += stepsForThisTemplate;
      emitLoc();
      continue;
    }

    const apiName = getTemplateNameFromCreateResponse(resultItem.response);
    if (!apiName) {
      log('Skipped: could not read template name from create response.');
      localizationResults.push({
        name: resultItem.name,
        status: 'skipped',
        message: 'Missing name in API response',
      });
      locSkipped++;
      locStep += stepsForThisTemplate;
      emitLoc();
      continue;
    }

    const provider = getProvider(original);
    const localizations = provider.localizations;
    if (!Array.isArray(localizations) || localizations.length === 0) {
      log(`No localizations for ${apiName} — skipped.`);
      localizationResults.push({
        name: apiName,
        status: 'skipped',
        message: 'No localization data',
      });
      locSkipped++;
      locStep += 1; // matches Math.max(0, 1) reserved for this template
      emitLoc();
      continue;
    }

    for (const loc of localizations) {
      if (!isRecord(loc)) {
        // Still consume a step so totals stay aligned with computePhaseTotals.
        locSkipped++;
        locStep++;
        emitLoc();
        continue;
      }
      const language = loc.language;
      const components = loc.components;
      await maybeDelay();
      try {
        log(`Adding localization ${apiName} (${String(language)})`);
        const url = `${base}/whatsapp/templates/${encodeURIComponent(accountId)}/${encodeURIComponent(apiName)}/localizations`;
        const res = await postJson(proxyUrl, url, key, {language, components}, signal);
        lastWasCall = true;
        log('Localization added.');
        localizationResults.push({name: apiName, status: 'success', response: res});
        locOk++;
      } catch (e) {
        log('Localization failed:');
        logIndentedMessage(log, e);
        const msg = e instanceof Error ? e.message : String(e);
        localizationResults.push({name: apiName, status: 'failed', error: msg});
        locFailed++;
        if (e instanceof Error && /HTTP \d{3}/.test(e.message)) {
          lastWasCall = true;
        }
      }
      locStep++;
      emitLoc();
    }
  }

  // ───── Phase 3: Submit (skipped entirely in draft mode) ─────
  const submissionResults: SubmitOpResult[] = [];

  if (submitMode === 'draft') {
    log('');
    log(SEP);
    log('Submit phase skipped — draft mode');
    log(SEP);
  } else {
    for (let idx = 0; idx < createResults.length; idx++) {
      const resultItem = createResults[idx]!;
      const original = templates[idx]!;
      const tplLocs = countLocalizations(original);
      const stepsForThisTemplate = Math.max(tplLocs, 1);

      log('');
      log(SEP);
      log(`Submit localization ${idx + 1}/${createResults.length}`);
      log(SEP);

      if (resultItem.status !== 'success') {
        log('Skipped (template creation failed).');
        submissionResults.push({
          name: resultItem.name,
          language: 'N/A',
          status: 'skipped',
          message: 'Template creation failed',
        });
        submitSkipped++;
        submitStep += stepsForThisTemplate;
        emitSubmit();
        continue;
      }

      const apiName = getTemplateNameFromCreateResponse(resultItem.response);
      if (!apiName) {
        submissionResults.push({
          name: resultItem.name,
          language: 'N/A',
          status: 'skipped',
          message: 'Missing name in API response',
        });
        submitSkipped++;
        submitStep += stepsForThisTemplate;
        emitSubmit();
        continue;
      }

      const provider = getProvider(original);
      const localizations = provider.localizations;
      if (!Array.isArray(localizations) || localizations.length === 0) {
        submissionResults.push({
          name: apiName,
          status: 'skipped',
          message: 'No localization data',
        });
        log(`No localizations to submit for ${apiName}.`);
        submitSkipped++;
        submitStep += 1;
        emitSubmit();
        continue;
      }

      for (const loc of localizations) {
        if (!isRecord(loc)) {
          submitSkipped++;
          submitStep++;
          emitSubmit();
          continue;
        }
        const language = loc.language;
        if (typeof language !== 'string' || !language) {
          submissionResults.push({
            name: apiName,
            language: 'N/A',
            status: 'skipped',
            message: 'Language missing in localization',
          });
          submitSkipped++;
          submitStep++;
          emitSubmit();
          continue;
        }
        await maybeDelay();
        try {
          log(`Submitting ${apiName} / ${language}`);
          const url = `${base}/whatsapp/templates/${encodeURIComponent(accountId)}/${encodeURIComponent(apiName)}/localizations/${encodeURIComponent(language)}/submit`;
          const res = await postJson(proxyUrl, url, key, undefined, signal);
          lastWasCall = true;
          log('Submitted.');
          submissionResults.push({
            name: apiName,
            language,
            status: 'success',
            response: res,
          });
          submitOk++;
        } catch (e) {
          log('Submit failed:');
          logIndentedMessage(log, e);
          const msg = e instanceof Error ? e.message : String(e);
          submissionResults.push({
            name: apiName,
            language,
            status: 'failed',
            error: msg,
          });
          submitFailed++;
          if (e instanceof Error && /HTTP \d{3}/.test(e.message)) {
            lastWasCall = true;
          }
        }
        submitStep++;
        emitSubmit();
      }
    }
  }

  appendErrorSummary(log, templates, createResults, localizationResults, submissionResults);

  return {createResults, localizationResults, submissionResults};
}

/**
 * Surface failed items at the end of the log so users don't have to scroll
 * through verbose per-call output to find what broke.
 */
function appendErrorSummary(
  log: (line: string) => void,
  templates: TemplateInput[],
  creates: CreateResult[],
  locs: LocalizationOpResult[],
  submits: SubmitOpResult[]
): void {
  const createFails: Array<{idx: number; name: string; error: string}> = [];
  for (let i = 0; i < creates.length; i++) {
    const r = creates[i]!;
    if (r.status === 'failed') {
      createFails.push({idx: i + 1, name: r.name, error: r.error});
    }
  }

  const locFails = locs.filter((r): r is Extract<LocalizationOpResult, {status: 'failed'}> => r.status === 'failed');
  const submitFails = submits.filter((r): r is Extract<SubmitOpResult, {status: 'failed'}> => r.status === 'failed');

  if (createFails.length === 0 && locFails.length === 0 && submitFails.length === 0) {
    return;
  }

  log('');
  log('');
  log(SEP);
  log('ERRORS');
  log(SEP);

  if (createFails.length > 0) {
    log(`Create errors (${createFails.length}):`);
    for (const f of createFails) {
      const firstLine = (f.error.split('\n')[0] ?? '').trim() || f.error;
      log(`  • template ${f.idx}/${templates.length} (${f.name}): ${firstLine}`);
    }
  }

  if (locFails.length > 0) {
    log('');
    log(`Localization errors (${locFails.length}):`);
    for (const f of locFails) {
      const firstLine = (f.error.split('\n')[0] ?? '').trim() || f.error;
      log(`  • ${f.name}: ${firstLine}`);
    }
  }

  if (submitFails.length > 0) {
    log('');
    log(`Submit errors (${submitFails.length}):`);
    for (const f of submitFails) {
      const firstLine = (f.error.split('\n')[0] ?? '').trim() || f.error;
      log(`  • ${f.name} / ${f.language}: ${firstLine}`);
    }
  }
}

function getTemplateNameFromCreateResponse(response: unknown): string | undefined {
  if (!isRecord(response)) {
    return undefined;
  }
  const n = response.name;
  return typeof n === 'string' ? n : undefined;
}

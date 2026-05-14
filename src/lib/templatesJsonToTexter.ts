/**
 * Client-side WhatsApp template import against Texter HTTP API v2.
 * Mirrors the flow from templates_json_to_texter.ipynb (create → localizations → submit).
 */

export type TemplatesImportConfig = {
  projectId: string;
  apiKey: string;
  accountId: string;
  keepNames: boolean;
  nameSuffix: string;
  /** Delay after each successful template create (ms). */
  delayMsBetweenCreates: number;
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

async function postJson(
  url: string,
  apiKey: string,
  body: unknown | undefined,
  signal: AbortSignal | undefined
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    const detail =
      typeof parsed === 'string'
        ? parsed
        : JSON.stringify(parsed).slice(0, 500);
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }
  return parsed;
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

export async function runTemplatesImport(
  config: TemplatesImportConfig,
  templates: TemplateInput[],
  log: (line: string) => void,
  signal?: AbortSignal
): Promise<ImportRunSummary> {
  const base = `https://${config.projectId.trim()}.texterchat.com/server/api/v2`;
  const key = config.apiKey.trim();
  const accountId = config.accountId.trim();

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

  const createResults: CreateResult[] = [];

  for (let idx = 0; idx < templates.length; idx++) {
    const template = templates[idx]!;
    const displayName =
      (typeof template.name === 'string' && template.name) ||
      (isRecord(template.provider_template) &&
      typeof template.provider_template.name === 'string'
        ? template.provider_template.name
        : 'unknown');

    log('');
    log(`${'='.repeat(60)}`);
    log(`Processing template ${idx + 1}/${templates.length}`);
    log(`${'='.repeat(60)}`);

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
      const response = await postJson(url, key, payload, signal);
      log('Template created successfully.');
      createResults.push({
        status: 'success',
        name: displayName,
        response,
      });
      if (idx < templates.length - 1 && config.delayMsBetweenCreates > 0) {
        await sleep(config.delayMsBetweenCreates, signal);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Error: ${msg}`);
      createResults.push({status: 'failed', name: displayName, error: msg});
    }
  }

  const localizationResults: LocalizationOpResult[] = [];

  for (let idx = 0; idx < createResults.length; idx++) {
    const resultItem = createResults[idx]!;
    const original = templates[idx]!;

    log('');
    log(`${'='.repeat(60)}`);
    log(`Localization ${idx + 1}/${createResults.length}`);
    log(`${'='.repeat(60)}`);

    if (resultItem.status !== 'success') {
      log('Skipped (template creation failed).');
      localizationResults.push({
        name: resultItem.name,
        status: 'skipped',
        message: 'Template creation failed',
      });
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
      continue;
    }

    for (const loc of localizations) {
      if (!isRecord(loc)) {
        continue;
      }
      const language = loc.language;
      const components = loc.components;
      try {
        log(`Adding localization ${apiName} (${String(language)})`);
        const url = `${base}/whatsapp/templates/${encodeURIComponent(accountId)}/${encodeURIComponent(apiName)}/localizations`;
        const res = await postJson(
          url,
          key,
          {language, components},
          signal
        );
        log('Localization added.');
        localizationResults.push({
          name: apiName,
          status: 'success',
          response: res,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`Localization failed: ${msg}`);
        localizationResults.push({
          name: apiName,
          status: 'failed',
          error: msg,
        });
      }
    }
  }

  const submissionResults: SubmitOpResult[] = [];

  for (let idx = 0; idx < createResults.length; idx++) {
    const resultItem = createResults[idx]!;
    const original = templates[idx]!;

    log('');
    log(`${'='.repeat(60)}`);
    log(`Submit localization ${idx + 1}/${createResults.length}`);
    log(`${'='.repeat(60)}`);

    if (resultItem.status !== 'success') {
      log('Skipped (template creation failed).');
      submissionResults.push({
        name: resultItem.name,
        language: 'N/A',
        status: 'skipped',
        message: 'Template creation failed',
      });
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
      continue;
    }

    for (const loc of localizations) {
      if (!isRecord(loc)) {
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
        continue;
      }
      try {
        log(`Submitting ${apiName} / ${language}`);
        const url = `${base}/whatsapp/templates/${encodeURIComponent(accountId)}/${encodeURIComponent(apiName)}/localizations/${encodeURIComponent(language)}/submit`;
        const res = await postJson(url, key, undefined, signal);
        log('Submitted.');
        submissionResults.push({
          name: apiName,
          language,
          status: 'success',
          response: res,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`Submit failed: ${msg}`);
        submissionResults.push({
          name: apiName,
          language,
          status: 'failed',
          error: msg,
        });
      }
    }
  }

  return {createResults, localizationResults, submissionResults};
}

function getTemplateNameFromCreateResponse(response: unknown): string | undefined {
  if (!isRecord(response)) {
    return undefined;
  }
  const n = response.name;
  return typeof n === 'string' ? n : undefined;
}

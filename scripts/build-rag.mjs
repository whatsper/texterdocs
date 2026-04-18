#!/usr/bin/env node
/**
 * Incremental RAG sync for the Texter docs.
 *
 * Walk docs/ + src/data/scenarios.ts → chunk → embed new/changed → upsert
 * into Supabase (doc_chunks) → delete removed. See supabase/migrations/0001
 * for the table + match_doc_chunks RPC, and _context/RAG-AI-CHAT-IMPLEMENTATION.md
 * for the high-level plan.
 *
 * Skips cleanly when any of OPENAI_API_KEY / SUPABASE_URL /
 * SUPABASE_SECRET_KEY is missing so local `npm run build` works
 * without secrets (identical behaviour to the old push-to-orama script).
 *
 * Incrementality:
 *  - chunk id = sha256(relPath + heading-slug + part)       (stable across edits)
 *  - content_hash = sha256(content + CHUNKER_VERSION + MODEL)
 *  - .rag-cache.json stores {id → content_hash} for fast skip
 *  - on cold cache, seeds from Supabase so we don't re-embed everything
 *
 * Bump CHUNKER_VERSION when chunking rules change, or EMBEDDING_MODEL when
 * the model changes — both invalidate all hashes and force a re-embed.
 */
import {createHash} from 'node:crypto';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {join, relative, sep, posix} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {config as loadEnv} from 'dotenv';
import {createJiti} from 'jiti';
import matter from 'gray-matter';
import {MarkdownTextSplitter} from '@langchain/textsplitters';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const dotEnvPath = join(ROOT, '.env');
const dotEnvLocalPath = join(ROOT, '.env.local');
if (existsSync(dotEnvPath)) loadEnv({path: dotEnvPath});
if (existsSync(dotEnvLocalPath)) loadEnv({path: dotEnvLocalPath, override: true});

const DOCS_DIR = join(ROOT, 'docs');
const CACHE_PATH = join(ROOT, '.rag-cache.json');
const SITE_URL = 'https://whatsper.github.io/texterdocs';

const CHUNKER_VERSION = 4;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_CHUNK_CHARS = 1800;
const CHUNK_OVERLAP_CHARS = 200;
const EMBED_BATCH = 96;
const UPSERT_BATCH = 100;

// MarkdownTextSplitter keeps fenced code blocks together and falls back to
// recursive character splitting with overlap inside oversize sections.
const splitter = new MarkdownTextSplitter({
  chunkSize: MAX_CHUNK_CHARS,
  chunkOverlap: CHUNK_OVERLAP_CHARS,
});

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const EMBED_WEBHOOK_URL = process.env.EMBED_WEBHOOK_URL?.replace(/\/$/, '');
const EMBED_WEBHOOK_SECRET = process.env.EMBED_WEBHOOK_SECRET;

const HAS_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);
const HAS_DIRECT_OPENAI = !!OPENAI_KEY;
const HAS_EMBED_PROXY = !!(EMBED_WEBHOOK_URL && EMBED_WEBHOOK_SECRET);

if (!HAS_SUPABASE || (!HAS_DIRECT_OPENAI && !HAS_EMBED_PROXY)) {
  console.log(
    '[rag] Skipping sync — need SUPABASE_URL + SUPABASE_SECRET_KEY, plus either OPENAI_API_KEY or EMBED_WEBHOOK_URL + EMBED_WEBHOOK_SECRET.',
  );
  process.exit(0);
}

function toPosix(p) {
  return p.split(sep).join(posix.sep);
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48);
}

/** Docusaurus-compatible heading anchor (github-slugger style). */
function headingAnchor(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function shortHash(s) {
  return createHash('sha256').update(s).digest('hex').slice(0, 28);
}

/** Stable chunk id. Same (path, heading, part) → same id across builds. */
function stableDocId(relPosix, heading, part) {
  return `doc-${shortHash(`${relPosix}\n${slugify(heading)}\n${part}`)}`;
}

/** content_hash — invalidated by text edits OR bumping CHUNKER_VERSION/MODEL. */
function contentHash(text) {
  return shortHash(`v${CHUNKER_VERSION}|${EMBEDDING_MODEL}|${text}`);
}

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.mdx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Docusaurus slug: strip ext, drop "index", collapse category-index dupes. */
function docUrl(absFile, rootDir, routeBase) {
  const rel = toPosix(relative(rootDir, absFile)).replace(/\.mdx?$/, '');
  const parts = rel.split('/').filter((p) => p && p !== 'index');
  // Docusaurus treats Foo/Foo.md as a category index → URL is /Foo, not /Foo/Foo
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }
  return `${SITE_URL}${routeBase}/${parts.join('/')}`;
}

/**
 * Split first on `##`/`###` so each chunk carries a stable section identity,
 * then hand each section to MarkdownTextSplitter for overlap + code-block-safe
 * sub-splitting. Each returned chunk's `text` is prefixed with its document
 * title and section heading so the embedding captures the hierarchy that the
 * retrieved chunk will be consumed under.
 */
async function chunkBody(body, title) {
  const clean = body
    .replace(/^import\s.+from\s.+$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  if (!clean) return [];

  const sections = clean.split(/\n(?=##+\s)/);
  const out = [];
  for (const section of sections) {
    const hMatch = section.match(/^(##+)\s+(.+?)\n/);
    const heading = hMatch ? hMatch[2].trim() : '';
    const bodyText = section.replace(/^##+\s+.+?\n/, '').trim();
    if (!bodyText) continue;

    const pieces = await splitter.splitText(bodyText);
    const prefix = heading
      ? `# ${title}\n## ${heading}\n\n`
      : `# ${title}\n\n`;
    for (const piece of pieces) {
      out.push({heading, text: prefix + piece});
    }
  }
  return out;
}

async function loadDocs() {
  const out = [];
  for (const file of await walk(DOCS_DIR)) {
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    const relPosix = toPosix(relative(DOCS_DIR, file));
    const url = docUrl(file, DOCS_DIR, '/docs');
    const title =
      parsed.data.title ||
      (parsed.content.match(/^#\s+(.+)$/m)?.[1] ?? '').trim() ||
      relPosix.replace(/\.mdx?$/, '');

    // Group by heading to number parts within the same heading deterministically.
    const chunks = await chunkBody(parsed.content, title);
    const partCounter = new Map();
    for (const {heading, text} of chunks) {
      const n = (partCounter.get(heading) ?? 0) + 1;
      partCounter.set(heading, n);
      out.push({
        id: stableDocId(relPosix, heading, n),
        content: text,
        content_hash: contentHash(text),
        metadata: {
          source: 'docs',
          title,
          section: heading,
          url: heading ? `${url}#${headingAnchor(heading)}` : url,
        },
      });
    }
  }
  return out;
}

async function loadScenarios() {
  const jiti = createJiti(import.meta.url);
  const mod = await jiti.import('../src/data/scenarios.ts');
  const scenarios = mod.SCENARIOS ?? [];
  const triggerDisplay = mod.TRIGGER_DISPLAY ?? {};
  const out = [];
  for (const s of scenarios) {
    const triggers = (s.triggerEvents ?? [])
      .map((t) => triggerDisplay[t] || t)
      .join(', ');
    const tags = (s.tags ?? []).join(', ');
    const configSummary = (s.configuration ?? [])
      .map((c) => `${c.field} (${c.location}): ${c.description}`)
      .join('\n');
    const jsonStr = JSON.stringify(s.json, null, 2);
    const content = [
      `# Scenario: ${s.name}`,
      s.description,
      triggers ? `Triggers: ${triggers}` : '',
      tags ? `Tags: ${tags}` : '',
      configSummary ? `Configuration:\n${configSummary}` : '',
      `Full JSON example:\n${jsonStr}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    out.push({
      id: `scenario-${s.id}`,
      content,
      content_hash: contentHash(content),
      metadata: {
        source: 'scenarios',
        title: s.name,
        section: '',
        url: `${SITE_URL}/scenarios#${s.id}`,
      },
    });
  }
  return out;
}

async function readCache() {
  try {
    const raw = await readFile(CACHE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(cache) {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function supabaseFetch(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status} on ${path}: ${body.slice(0, 400)}`);
  }
  return res;
}

/** Seed cache from DB so a missing cache file doesn't force a full re-embed. */
async function seedCacheFromDb() {
  const seed = {};
  const pageSize = 1000;
  let from = 0;
  // Paginate via Range header (PostgREST).
  while (true) {
    const res = await supabaseFetch(`/rest/v1/doc_chunks?select=id,content_hash`, {
      headers: {Range: `${from}-${from + pageSize - 1}`, Prefer: 'count=exact'},
    });
    const rows = await res.json();
    for (const r of rows) seed[r.id] = r.content_hash;
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return seed;
}

async function embedBatch(texts) {
  // Direct OpenAI when a key is available; otherwise route through the n8n
  // "Embeddings Proxy" workflow which calls OpenAI with its own stored
  // credential. Both paths return OpenAI's verbatim JSON shape.
  const {url, headers, body} = HAS_DIRECT_OPENAI
    ? {
        url: 'https://api.openai.com/v1/embeddings',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({model: EMBEDDING_MODEL, input: texts}),
      }
    : {
        url: EMBED_WEBHOOK_URL,
        headers: {
          'x-embed-secret': EMBED_WEBHOOK_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({input: texts}),
      };

  const res = await fetch(url, {method: 'POST', headers, body});
  if (!res.ok) {
    const label = HAS_DIRECT_OPENAI ? 'OpenAI embeddings' : 'embed proxy';
    throw new Error(`${label} ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  // Sorted by `index` to match the request order.
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function upsertRows(rows) {
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    await supabaseFetch(`/rest/v1/doc_chunks?on_conflict=id`, {
      method: 'POST',
      headers: {Prefer: 'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify(batch),
    });
  }
}

async function deleteRows(ids) {
  // PostgREST in() filter — URL-encode the comma-separated list.
  const chunkSize = 200;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const batch = ids.slice(i, i + chunkSize);
    const list = batch.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(',');
    await supabaseFetch(
      `/rest/v1/doc_chunks?id=in.(${encodeURIComponent(list)})`,
      {method: 'DELETE', headers: {Prefer: 'return=minimal'}},
    );
  }
}

async function main() {
  const docs = await loadDocs();
  const scenarios = await loadScenarios();
  const chunks = [...docs, ...scenarios];

  if (chunks.length === 0) {
    console.log('[rag] No chunks found — aborting.');
    return;
  }

  const currentIds = new Set(chunks.map((c) => c.id));

  let cache = await readCache();
  if (!cache) {
    console.log('[rag] No local cache — seeding from Supabase…');
    cache = await seedCacheFromDb();
  }

  const toEmbed = [];
  for (const c of chunks) {
    if (cache[c.id] !== c.content_hash) toEmbed.push(c);
  }

  const removed = Object.keys(cache).filter((id) => !currentIds.has(id));

  console.log(
    `[rag] chunks=${chunks.length} embed=${toEmbed.length} removed=${removed.length} skip=${chunks.length - toEmbed.length}`,
  );

  if (toEmbed.length > 0) {
    const upsertRowsBuf = [];
    for (let i = 0; i < toEmbed.length; i += EMBED_BATCH) {
      const batch = toEmbed.slice(i, i + EMBED_BATCH);
      const vectors = await embedBatch(batch.map((c) => c.content));
      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        upsertRowsBuf.push({
          id: c.id,
          content: c.content,
          embedding: vectors[j],
          metadata: c.metadata,
          content_hash: c.content_hash,
        });
        cache[c.id] = c.content_hash;
      }
      console.log(`[rag] embedded ${Math.min(i + EMBED_BATCH, toEmbed.length)}/${toEmbed.length}`);
    }
    await upsertRows(upsertRowsBuf);
    console.log(`[rag] upserted ${upsertRowsBuf.length} rows`);
  }

  if (removed.length > 0) {
    await deleteRows(removed);
    for (const id of removed) delete cache[id];
    console.log(`[rag] deleted ${removed.length} stale rows`);
  }

  await writeCache(cache);
  console.log('[rag] done.');
}

main().catch((err) => {
  console.error('[rag] sync failed:', err);
  process.exit(1);
});

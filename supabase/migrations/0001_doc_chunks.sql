-- Texter docs RAG schema.
-- Run once on the Supabase project (SQL editor, or `supabase db push`).
-- Model: OpenAI text-embedding-3-small → 1536 dimensions.

create extension if not exists vector;

create table if not exists public.doc_chunks (
  id            text primary key,
  content       text not null,
  embedding     vector(1536) not null,
  metadata      jsonb not null default '{}'::jsonb,
  content_hash  text not null,
  updated_at    timestamptz not null default now()
);

-- Cosine similarity index. HNSW handles incremental updates well (no rebuild
-- after bulk load, unlike ivfflat) and gives better recall for small-to-medium
-- corpora. m=16/ef_construction=64 are pgvector defaults — fine for ~1k rows.
create index if not exists doc_chunks_embedding_idx
  on public.doc_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Retrieval RPC. n8n calls this with the embedded user query.
-- Returns the top `match_count` rows whose cosine similarity >= `min_similarity`.
--
-- SECURITY DEFINER so the function runs as its owner (postgres), bypassing RLS
-- for its single, scoped SELECT. This lets n8n call it with the *anon* key —
-- n8n can't SELECT from doc_chunks directly, only invoke this one function.
-- CI sync keeps using the service role for upsert/delete.
create or replace function public.match_doc_chunks(
  query_embedding vector(1536),
  match_count     int default 5,
  min_similarity  float default 0.0
)
returns table (
  id         text,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.doc_chunks d
  where 1 - (d.embedding <=> query_embedding) >= min_similarity
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Revoke broad defaults, grant exactly what each caller needs.
revoke all on function public.match_doc_chunks(vector, int, float) from public;
grant execute on function public.match_doc_chunks(vector, int, float) to anon;

-- RLS: lock the table down. CI sync uses the service role (bypasses RLS) for
-- upsert/delete. Anon / n8n never touches the table directly — they go through
-- the SECURITY DEFINER RPC above.
alter table public.doc_chunks enable row level security;

-- No policies = deny all for anon/authenticated roles. Service role bypasses RLS.

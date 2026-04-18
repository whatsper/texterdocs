-- Hybrid retrieval: pgvector cosine similarity + tsvector full-text search,
-- fused with Reciprocal Rank Fusion (k=60). Pure SQL, no external reranker.
--
-- Why: dense embeddings blur exact tokens (YAML keys, adapter names, func ids).
-- BM25-style keyword search catches those; RRF combines the two rankings.
--
-- Run once on the Supabase project (SQL editor, or `supabase db push`).

-- 1) Generated tsvector column for full-text search over chunk content.
--    'simple' config = no stemming, no stop words — right for technical content
--    and mixed English/Hebrew. Stored (not on-the-fly) so the GIN index works.
alter table public.doc_chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('simple', coalesce(content, ''))) stored;

create index if not exists doc_chunks_content_tsv_idx
  on public.doc_chunks using gin (content_tsv);

-- 2) Hybrid retrieval RPC.
--    - Takes both the embedded query AND the raw query text.
--    - Pulls top (match_count * 2) from each ranking, then fuses.
--    - RRF score: sum over present rankings of 1/(k + rank). k=60 is the
--      standard constant from Cormack et al. 2009.
create or replace function public.match_doc_chunks_hybrid(
  query_embedding vector(1536),
  query_text      text,
  match_count     int default 20,
  rrf_k           int default 60
)
returns table (
  id         text,
  content    text,
  metadata   jsonb,
  similarity float,
  rrf_score  float
)
language sql
stable
security definer
set search_path = public
as $$
  with
  semantic as (
    select
      d.id,
      1 - (d.embedding <=> query_embedding) as similarity,
      row_number() over (order by d.embedding <=> query_embedding) as rnk
    from public.doc_chunks d
    order by d.embedding <=> query_embedding
    limit match_count * 2
  ),
  keyword as (
    select
      d.id,
      row_number() over (order by ts_rank_cd(d.content_tsv, q.tsq) desc) as rnk
    from public.doc_chunks d,
         (select websearch_to_tsquery('simple', query_text) as tsq) q
    where d.content_tsv @@ q.tsq
    order by ts_rank_cd(d.content_tsv, q.tsq) desc
    limit match_count * 2
  ),
  fused as (
    select
      coalesce(s.id, k.id)                                             as id,
      s.similarity,
      coalesce(1.0 / (rrf_k + s.rnk), 0) + coalesce(1.0 / (rrf_k + k.rnk), 0) as rrf_score
    from semantic s
    full outer join keyword k on s.id = k.id
  )
  select
    d.id,
    d.content,
    d.metadata,
    coalesce(f.similarity, 0) as similarity,
    f.rrf_score
  from fused f
  join public.doc_chunks d on d.id = f.id
  order by f.rrf_score desc
  limit match_count;
$$;

-- Same permission posture as match_doc_chunks: locked to anon via SECURITY DEFINER.
revoke all on function public.match_doc_chunks_hybrid(vector, text, int, int) from public;
grant execute on function public.match_doc_chunks_hybrid(vector, text, int, int) to anon;

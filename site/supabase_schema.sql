-- Cussator support-bot knowledge base — run once in the Supabase SQL Editor.
-- Uses OpenAI text-embedding-3-small (1536 dimensions).

create extension if not exists vector;

create table if not exists knowledge_chunks (
  id bigserial primary key,
  content text not null,
  embedding vector(1536) not null,
  source text,
  chunk_index int,
  created_at timestamptz default now()
);

-- No ANN index (ivfflat/hnsw) on purpose: ivfflat with `lists` set higher than
-- the row count leaves most clusters empty, and its default probes=1 then
-- searches an empty cluster and silently returns nothing — that was the bug
-- that made every query come back with 0 matches. At hundreds-to-low-thousands
-- of knowledge-base chunks, an exact sequential scan is plenty fast and never
-- has this failure mode. Add an ivfflat/hnsw index back once the table is
-- large enough that `lists` can be tuned sensibly (rule of thumb: lists ≈
-- rows / 1000, and don't create it before the table is populated).
drop index if exists knowledge_chunks_embedding_idx;

-- Drop the earlier 3-arg version (the in-SQL threshold filter was returning
-- zero rows even at threshold -1 — moved the "is this relevant enough"
-- decision to the server instead of debugging the predicate further).
drop function if exists match_knowledge_chunks(vector, int, float);

-- Similarity search RPC — called from the server with the question's embedding.
-- Returns the top match_count chunks by cosine similarity; the caller decides
-- what similarity counts as "relevant enough".
create or replace function match_knowledge_chunks (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.source,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- The new sb_secret_* key doesn't get blanket table privileges the way the
-- legacy service_role JWT did — grant them explicitly.
grant select, insert, update, delete on table knowledge_chunks to service_role;
grant usage, select on sequence knowledge_chunks_id_seq to service_role;
grant execute on function match_knowledge_chunks(vector, int) to service_role;

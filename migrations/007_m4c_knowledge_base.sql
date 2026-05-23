create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  kind text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  ordinal integer not null,
  heading text,
  content text not null,
  search_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, ordinal)
);

create index if not exists knowledge_documents_profile_updated_idx
  on knowledge_documents (profile_id, updated_at desc);

create index if not exists knowledge_chunks_profile_document_idx
  on knowledge_chunks (profile_id, document_id, ordinal asc);

create index if not exists knowledge_chunks_search_idx
  on knowledge_chunks (profile_id);

drop trigger if exists knowledge_documents_set_updated_at on knowledge_documents;
create trigger knowledge_documents_set_updated_at before update on knowledge_documents
for each row execute function set_updated_at();

drop trigger if exists knowledge_chunks_set_updated_at on knowledge_chunks;
create trigger knowledge_chunks_set_updated_at before update on knowledge_chunks
for each row execute function set_updated_at();

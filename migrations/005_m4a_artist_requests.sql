do $$
begin
  if not exists (select 1 from pg_type where typname = 'request_type') then
    create type request_type as enum (
      'opportunity_research',
      'funding_research',
      'tech_rider',
      'procedure',
      'presentation',
      'website_update'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum (
      'draft',
      'ready_for_processing',
      'processing',
      'needs_review',
      'completed',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'request_confidence') then
    create type request_confidence as enum (
      'unverified',
      'partially_verified',
      'verified'
    );
  end if;
end $$;

create table if not exists artist_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type request_type not null,
  status request_status not null default 'draft',
  priority text not null default 'normal',
  title text not null,
  structured_input jsonb not null default '{}'::jsonb,
  generated_output jsonb not null default '{}'::jsonb,
  human_notes text,
  confidence_level request_confidence not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  base_url text not null,
  reliability text not null default 'unknown',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists opportunity_sources_name_base_url_idx
  on opportunity_sources (name, base_url);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references opportunity_sources(id) on delete set null,
  title text not null,
  organizer text,
  description text,
  url text not null,
  deadline timestamptz,
  geography text,
  discipline text[] not null default '{}',
  funding_amount text,
  eligibility text,
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url)
);

create table if not exists artist_request_sources (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references artist_requests(id) on delete cascade,
  source_kind text not null,
  source_id text,
  title text,
  url text,
  excerpt text,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists artist_requests_profile_updated_idx
  on artist_requests (profile_id, updated_at desc, id desc);
create index if not exists artist_requests_status_idx
  on artist_requests (status);
create index if not exists opportunities_deadline_idx
  on opportunities (deadline asc nulls last);
create index if not exists opportunities_discipline_idx
  on opportunities using gin (discipline);
create index if not exists artist_request_sources_request_idx
  on artist_request_sources (request_id, created_at asc);

drop trigger if exists artist_requests_set_updated_at on artist_requests;
create trigger artist_requests_set_updated_at before update on artist_requests
for each row execute function set_updated_at();

drop trigger if exists opportunity_sources_set_updated_at on opportunity_sources;
create trigger opportunity_sources_set_updated_at before update on opportunity_sources
for each row execute function set_updated_at();

drop trigger if exists opportunities_set_updated_at on opportunities;
create trigger opportunities_set_updated_at before update on opportunities
for each row execute function set_updated_at();

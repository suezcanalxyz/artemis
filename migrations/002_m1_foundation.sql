create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  host text not null unique,
  is_verified boolean not null default false,
  verification_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists audit_log_set_updated_at on audit_log;
create trigger audit_log_set_updated_at before update on audit_log
for each row execute function set_updated_at();

drop trigger if exists domains_set_updated_at on domains;
create trigger domains_set_updated_at before update on domains
for each row execute function set_updated_at();

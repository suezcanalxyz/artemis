create table if not exists domain_health_checks (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  checked_at timestamptz not null default now(),
  dns_ok boolean not null default false,
  ssl_ok boolean not null default false,
  http_status integer,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table domains
  add column if not exists verification_method text not null default 'txt',
  add column if not exists verification_target text,
  add column if not exists status text not null default 'pending',
  add column if not exists verified_at timestamptz,
  add column if not exists ssl_provisioned_at timestamptz,
  add column if not exists last_health_check_at timestamptz,
  add column if not exists is_primary boolean not null default false,
  add column if not exists is_artemis_subdomain boolean not null default false,
  add column if not exists kind text not null default 'custom',
  add column if not exists verification_attempts integer not null default 0,
  add column if not exists last_error text;

create index if not exists domains_host_verified_idx on domains (host, is_verified);
create index if not exists domain_health_checks_domain_checked_idx on domain_health_checks (domain_id, checked_at desc);

drop trigger if exists domain_health_checks_set_updated_at on domain_health_checks;
create trigger domain_health_checks_set_updated_at before update on domain_health_checks
for each row execute function set_updated_at();

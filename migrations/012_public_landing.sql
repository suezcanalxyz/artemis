create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists whitelist_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  note text,
  used_at timestamptz,
  used_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists collaborator_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  background text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

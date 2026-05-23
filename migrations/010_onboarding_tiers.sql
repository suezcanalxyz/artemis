-- Migration 010: Onboarding flow, roles, and tiered plans

-- Role enum
do $$
begin
  create type profile_role as enum (
    'artist',
    'gallery',
    'collector',
    'institution'
  );
exception
  when duplicate_object then null;
end $$;

-- Plan enum (role-scoped naming convention: role_planname)
do $$
begin
  create type profile_plan as enum (
    -- Artist plans
    'artist_free',
    'artist_pro',
    'artist_studio',
    -- Gallery plans
    'gallery_essential',
    'gallery_professional',
    'gallery_institution',
    -- Collector plans
    'collector_curator',
    'collector_patron',
    -- Institution plans
    'institution_archive',
    'institution_enterprise'
  );
exception
  when duplicate_object then null;
end $$;

-- Extend profiles
alter table profiles
  add column if not exists role profile_role not null default 'artist',
  add column if not exists plan profile_plan not null default 'artist_free',
  add column if not exists onboarding_completed bool not null default false,
  add column if not exists bio text,
  add column if not exists website text,
  add column if not exists location text,
  add column if not exists plan_expires_at timestamptz;

-- Migrate existing 'kind' values into role column
update profiles set role = kind::profile_role where kind in ('artist','gallery','collector','institution');

-- Subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan profile_plan not null,
  status text not null default 'active' check (status in ('active','cancelled','past_due','trialing')),
  provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_profile_id_idx on subscriptions(profile_id);

drop trigger if exists subscriptions_set_updated_at on subscriptions;
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

-- Plan limits table (source of truth for enforcement)
create table if not exists plan_limits (
  plan profile_plan primary key,
  max_artworks integer,           -- null = unlimited
  max_domains integer,
  max_ai_requests_monthly integer,
  max_managed_artists integer,    -- galleries only
  can_custom_domain bool not null default false,
  can_public_portfolio bool not null default false,
  can_analytics bool not null default false,
  can_api_access bool not null default false,
  can_white_label bool not null default false
);

insert into plan_limits values
  -- Artist
  ('artist_free',        10, 1, 0,   null, false, false, false, false, false),
  ('artist_pro',         null, 3, 10, null, true,  true,  false, false, false),
  ('artist_studio',      null, 10, 50, null, true,  true,  true,  false, false),
  -- Gallery
  ('gallery_essential',  null, 2, 20,  5,   true,  true,  false, false, false),
  ('gallery_professional',null,10, 100, 20,  true,  true,  true,  false, true),
  ('gallery_institution',null, null,null,null,true,  true,  true,  true,  true),
  -- Collector
  ('collector_curator',  null, 1, 5,  null, false, false, false, false, false),
  ('collector_patron',   null, 3, 20, null, true,  true,  true,  false, false),
  -- Institution
  ('institution_archive',null, 5, 50, null, true,  true,  true,  false, false),
  ('institution_enterprise',null,null,null,null,true,true, true,  true,  true)
on conflict (plan) do update set
  max_artworks = excluded.max_artworks,
  max_domains = excluded.max_domains,
  max_ai_requests_monthly = excluded.max_ai_requests_monthly,
  max_managed_artists = excluded.max_managed_artists,
  can_custom_domain = excluded.can_custom_domain,
  can_public_portfolio = excluded.can_public_portfolio,
  can_analytics = excluded.can_analytics,
  can_api_access = excluded.can_api_access,
  can_white_label = excluded.can_white_label;

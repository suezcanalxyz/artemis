do $$
begin
  if not exists (select 1 from pg_type where typname = 'visibility_level') then
    create type visibility_level as enum (
      'private',
      'shared_with_relationships',
      'project_only',
      'public'
    );
  end if;
end $$;

alter table artworks
  add column if not exists visibility visibility_level not null default 'private',
  add column if not exists description text;

alter table media_assets
  add column if not exists thumbnail_small_key text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_primary boolean not null default false;

create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  related_profile_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, related_profile_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists artwork_projects (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artwork_id, project_id)
);

create index if not exists artworks_profile_created_idx on artworks (profile_id, created_at desc, id desc);
create index if not exists artworks_visibility_idx on artworks (visibility);
create index if not exists media_assets_artwork_sort_idx on media_assets (artwork_id, sort_order asc, created_at asc);

drop trigger if exists relationships_set_updated_at on relationships;
create trigger relationships_set_updated_at before update on relationships
for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at before update on projects
for each row execute function set_updated_at();

drop trigger if exists project_collaborators_set_updated_at on project_collaborators;
create trigger project_collaborators_set_updated_at before update on project_collaborators
for each row execute function set_updated_at();

drop trigger if exists artwork_projects_set_updated_at on artwork_projects;
create trigger artwork_projects_set_updated_at before update on artwork_projects
for each row execute function set_updated_at();

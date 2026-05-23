alter table profiles
  add column if not exists professional_focus text,
  add column if not exists practice_areas text[] not null default '{}'::text[],
  add column if not exists working_languages text[] not null default '{}'::text[],
  add column if not exists strategic_goals text[] not null default '{}'::text[],
  add column if not exists collaboration_interests text[] not null default '{}'::text[],
  add column if not exists privacy_mode text not null default 'private';

alter table profiles
  drop constraint if exists profiles_privacy_mode_check;

alter table profiles
  add constraint profiles_privacy_mode_check
  check (privacy_mode in ('private', 'contacts', 'public'));

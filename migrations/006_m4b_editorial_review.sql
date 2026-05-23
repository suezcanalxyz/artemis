do $$
begin
  if not exists (select 1 from pg_type where typname = 'opportunity_review_status') then
    create type opportunity_review_status as enum (
      'pending_review',
      'verified',
      'rejected',
      'archived'
    );
  end if;
end $$;

alter table opportunity_sources
  add column if not exists description text,
  add column if not exists last_refreshed_at timestamptz;

alter table opportunities
  add column if not exists review_status opportunity_review_status not null default 'pending_review',
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid references users(id) on delete set null;

alter table artist_request_sources
  add column if not exists is_selected boolean not null default true,
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

create index if not exists opportunities_review_status_idx
  on opportunities (review_status, updated_at desc);

create index if not exists artist_request_sources_selected_idx
  on artist_request_sources (request_id, is_selected);

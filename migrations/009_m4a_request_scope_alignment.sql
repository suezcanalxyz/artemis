alter table opportunity_sources
  drop constraint if exists opportunity_sources_kind_check;

alter table opportunity_sources
  add constraint opportunity_sources_kind_check
  check (kind in ('api', 'scrape', 'manual'));

alter table artist_request_sources
  drop constraint if exists artist_request_sources_source_kind_check;

alter table artist_request_sources
  add constraint artist_request_sources_source_kind_check
  check (source_kind in ('user_input', 'opportunity', 'url', 'uploaded_file', 'manual_note'));

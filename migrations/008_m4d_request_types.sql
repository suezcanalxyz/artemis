do $$
begin
  alter type request_type add value if not exists 'portfolio_review';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type request_type add value if not exists 'studio_review';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type request_type add value if not exists 'technical_assessment';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type request_type add value if not exists 'networking_brief';
exception
  when duplicate_object then null;
end $$;

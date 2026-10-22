-- RLS does not protect against table-level TRUNCATE and must be paired with least-privilege grants.
revoke all privileges on table public.creator_profiles from anon, authenticated;
grant select on table public.creator_profiles to anon, authenticated;
grant insert, update on table public.creator_profiles to authenticated;

revoke all privileges on table public.creator_stream_settings from anon, authenticated;
grant select, insert, update on table public.creator_stream_settings to authenticated;

revoke all privileges on table public.alert_events from anon, authenticated;
grant select, insert on table public.alert_events to authenticated;

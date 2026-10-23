-- Permit trusted server-side feature event producers to write feature events.
-- Client-side RLS remains restricted to isolated test events; do not grant browser roles
-- any additional insert path. Payment success still uses the isolated sandbox test event
-- until a real provider and verified webhook are implemented.
alter table public.alert_events
  drop constraint if exists alert_events_source_check;

alter table public.alert_events
  add constraint alert_events_source_check
  check (source in ('test', 'feature'));

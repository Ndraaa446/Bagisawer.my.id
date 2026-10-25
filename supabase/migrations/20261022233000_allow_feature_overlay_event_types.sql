-- Feature overlays enqueue feature-specific event types, while sandbox payments
-- intentionally continue to use the isolated 'test' event type.
alter table public.alert_events
  drop constraint if exists alert_events_event_type_check;

alter table public.alert_events
  add constraint alert_events_event_type_check
  check (event_type in (
    'test',
    'donation', 'sandbox_donation', 'anonim', 'donation_anonymous',
    'pesan', 'donation_message', 'target', 'goal', 'milestone',
    'mediashare', 'voicenote', 'lagu', 'song_request', 'qris',
    'leaderboard', 'subathon', 'running-text', 'soundboard', 'polling',
    'vip-queue', 'bagpao', 'gachaton', 'bidcoin'
  ));

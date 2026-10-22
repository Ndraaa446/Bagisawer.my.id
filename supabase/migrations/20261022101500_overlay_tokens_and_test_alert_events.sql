create table if not exists public.overlay_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

alter table public.overlay_tokens enable row level security;
revoke all on public.overlay_tokens from anon, authenticated;
grant all on public.overlay_tokens to service_role;

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null default 'test' check (event_type = 'test'),
  source text not null default 'test' check (source = 'test'),
  donor_name text not null default 'Tes Bagisawer' check (char_length(donor_name) between 1 and 80),
  message text not null default 'Ini alert uji coba' check (char_length(message) between 1 and 240),
  amount integer not null default 25000 check (amount between 0 and 100000000),
  status text not null default 'pending' check (status in ('pending', 'displayed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  displayed_at timestamptz
);

create index if not exists alert_events_owner_pending_idx
  on public.alert_events (user_id, status, created_at);

alter table public.alert_events enable row level security;
drop policy if exists "Creators can view their own test alerts" on public.alert_events;
create policy "Creators can view their own test alerts"
  on public.alert_events for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Creators can insert isolated test alerts" on public.alert_events;
create policy "Creators can insert isolated test alerts"
  on public.alert_events for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and event_type = 'test'
    and source = 'test'
    and status = 'pending'
    and amount between 0 and 100000000
  );

grant select, insert on public.alert_events to authenticated;
revoke update, delete on public.alert_events from anon, authenticated;
grant all on public.alert_events to service_role;

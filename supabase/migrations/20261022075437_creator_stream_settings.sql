create table if not exists public.creator_stream_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alert_enabled boolean not null default true,
  minimum_amount integer not null default 1000 check (minimum_amount >= 0 and minimum_amount <= 100000000),
  duration_seconds integer not null default 6 check (duration_seconds between 3 and 15),
  theme text not null default 'violet' check (theme in ('violet', 'minimal', 'neon')),
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_stream_settings enable row level security;

drop policy if exists "Creators can view their own stream settings" on public.creator_stream_settings;
create policy "Creators can view their own stream settings"
  on public.creator_stream_settings for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Creators can insert their own stream settings" on public.creator_stream_settings;
create policy "Creators can insert their own stream settings"
  on public.creator_stream_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Creators can update their own stream settings" on public.creator_stream_settings;
create policy "Creators can update their own stream settings"
  on public.creator_stream_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.creator_stream_settings to authenticated;
revoke all on public.creator_stream_settings from anon;

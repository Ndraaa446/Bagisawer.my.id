-- Persist creator feature activation so public support pages can reflect dashboard choices.
create table if not exists public.creator_feature_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null check (feature_key in (
    'saweran','anonim','pesan','target','mediashare','voicenote','lagu','qris',
    'leaderboard','subathon','running-text','soundboard','polling','vip-queue',
    'bagpao','gachaton','bidcoin'
  )),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature_key)
);
alter table public.creator_feature_settings enable row level security;
revoke all on table public.creator_feature_settings from public, anon, authenticated;
grant all on table public.creator_feature_settings to service_role;

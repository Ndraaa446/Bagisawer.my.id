-- Each creator can issue a distinct revocable secret for each overlay feature.
-- Access is server-only: browser roles receive no table grants.
create table if not exists public.creator_feature_overlay_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null check (feature_key in (
    'saweran','anonim','pesan','target','mediashare','voicenote','lagu','qris',
    'leaderboard','subathon','running-text','soundboard','polling','vip-queue',
    'bagpao','gachaton','bidcoin'
  )),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  unique (user_id, feature_key)
);

create index if not exists creator_feature_overlay_tokens_user_active_idx
  on public.creator_feature_overlay_tokens (user_id, feature_key)
  where revoked_at is null;

alter table public.creator_feature_overlay_tokens enable row level security;
revoke all on table public.creator_feature_overlay_tokens from public, anon, authenticated;
grant all on table public.creator_feature_overlay_tokens to service_role;

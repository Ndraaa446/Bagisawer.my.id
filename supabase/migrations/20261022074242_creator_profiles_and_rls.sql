create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint creator_profiles_display_name_length check (char_length(display_name) between 1 and 60),
  constraint creator_profiles_bio_length check (char_length(bio) <= 280)
);

create unique index if not exists creator_profiles_username_lower_unique
  on public.creator_profiles (lower(username));

alter table public.creator_profiles enable row level security;

grant select on public.creator_profiles to anon, authenticated;
grant insert, update on public.creator_profiles to authenticated;

drop policy if exists "Public profiles are viewable and private profiles are owner-only" on public.creator_profiles;
create policy "Public profiles are viewable and private profiles are owner-only"
  on public.creator_profiles for select
  to anon, authenticated
  using (is_public = true or (select auth.uid()) = user_id);

drop policy if exists "Users can create their own creator profile" on public.creator_profiles;
create policy "Users can create their own creator profile"
  on public.creator_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own creator profile" on public.creator_profiles;
create policy "Users can update their own creator profile"
  on public.creator_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists creator_profiles_set_updated_at on public.creator_profiles;
create trigger creator_profiles_set_updated_at
before update on public.creator_profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
  insert into public.creator_profiles (user_id, username, display_name)
  values (
    new.id,
    'creator_' || substr(replace(new.id::text, '-', ''), 1, 10),
    left(coalesce(requested_name, nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Creator'), 60)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_bagisawer on auth.users;
create trigger on_auth_user_created_bagisawer
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.creator_profiles (user_id, username, display_name)
select
  u.id,
  'creator_' || substr(replace(u.id::text, '-', ''), 1, 10),
  left(coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Creator'
  ), 60)
from auth.users u
on conflict (user_id) do nothing;

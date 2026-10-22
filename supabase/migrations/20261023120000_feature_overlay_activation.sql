alter table public.creator_feature_settings
  add column if not exists overlay_enabled boolean not null default false;

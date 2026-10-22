alter table public.creator_feature_settings
  add column if not exists configuration jsonb not null default '{}'::jsonb;

comment on column public.creator_feature_settings.configuration is
  'Per-creator feature module configuration, validated by application routes.';

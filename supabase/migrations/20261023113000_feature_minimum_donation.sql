alter table public.creator_feature_settings
  add column if not exists minimum_amount integer not null default 1000
  check (minimum_amount >= 1000 and minimum_amount <= 100000000 and minimum_amount % 1000 = 0);

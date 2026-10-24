alter table public.creator_feature_settings
  drop constraint if exists creator_feature_settings_feature_key_check;

alter table public.creator_feature_settings
  add constraint creator_feature_settings_feature_key_check
  check (feature_key in (
    'saweran','anonim','pesan','target','mediashare','voicenote','lagu','qris',
    'leaderboard','subathon','running-text','soundboard','polling','vip-queue',
    'bagpao','gachaton','bidcoin','store','notifikasi','kompetisi'
  ));

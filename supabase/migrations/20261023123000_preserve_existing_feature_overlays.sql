update public.creator_feature_settings s
set overlay_enabled = true, updated_at = now()
where exists (
  select 1
  from public.creator_feature_overlay_tokens t
  where t.user_id = s.user_id
    and t.feature_key = s.feature_key
    and t.revoked_at is null
);

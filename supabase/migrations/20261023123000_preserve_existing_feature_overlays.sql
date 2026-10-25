insert into public.creator_feature_settings (user_id, feature_key, enabled, minimum_amount, overlay_enabled, updated_at)
select t.user_id, t.feature_key, false, 1000, true, now()
from public.creator_feature_overlay_tokens t
where t.revoked_at is null
on conflict (user_id, feature_key)
do update set overlay_enabled = true, updated_at = now();

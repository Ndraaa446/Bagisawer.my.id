-- Enqueue a test event only for the creator's specific active feature overlay.
-- The function is server-only and serializes cooldown checks per creator + feature.
create or replace function public.enqueue_feature_test_alert(p_user_id uuid, p_feature_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event_type text;
  v_alert_enabled boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_user');
  end if;

  if p_feature_key not in (
    'saweran','anonim','pesan','target','mediashare','voicenote','lagu','qris',
    'leaderboard','subathon','running-text','soundboard','polling','vip-queue',
    'bagpao','gachaton','bidcoin'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_feature');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_feature_key, 0));

  if not exists (
    select 1
    from public.creator_feature_overlay_tokens
    where user_id = p_user_id
      and feature_key = p_feature_key
      and revoked_at is null
  ) then
    return jsonb_build_object('ok', false, 'reason', 'token_inactive');
  end if;

  select alert_enabled into v_alert_enabled
  from public.creator_stream_settings
  where user_id = p_user_id;

  if v_alert_enabled is false then
    return jsonb_build_object('ok', false, 'reason', 'alerts_disabled');
  end if;

  v_event_type := case when p_feature_key = 'saweran' then 'test' else p_feature_key end;

  if exists (
    select 1 from public.alert_events
    where user_id = p_user_id
      and event_type = v_event_type
      and created_at >= now() - interval '3 seconds'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  insert into public.alert_events (
    user_id, event_type, source, donor_name, message, amount, status, expires_at
  ) values (
    p_user_id,
    v_event_type,
    'test',
    'Tes Bagisawer',
    'Ini hanya alert uji coba — bukan donasi.',
    25000,
    'pending',
    now() + interval '5 minutes'
  );

  return jsonb_build_object('ok', true, 'feature_key', p_feature_key);
end;
$$;

revoke all on function public.enqueue_feature_test_alert(uuid, text) from public, anon, authenticated;
grant execute on function public.enqueue_feature_test_alert(uuid, text) to service_role;

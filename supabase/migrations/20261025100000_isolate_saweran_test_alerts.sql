-- Re-check the feature and module gates inside the transaction-serialized test-alert
-- RPC. The API preflight is helpful UX, but the database remains authoritative on races.
create or replace function public.enqueue_feature_test_alert(
  p_user_id uuid,
  p_feature_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_event_type text;
  v_alert_enabled boolean;
  v_feature_enabled boolean;
  v_overlay_enabled boolean;
  v_configuration jsonb;
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

  select enabled, overlay_enabled, configuration
    into v_feature_enabled, v_overlay_enabled, v_configuration
    from public.creator_feature_settings
   where user_id = p_user_id
     and feature_key = p_feature_key;

  if not found or v_feature_enabled is distinct from true or v_overlay_enabled is distinct from true then
    return jsonb_build_object('ok', false, 'reason', 'feature_or_overlay_disabled');
  end if;

  if p_feature_key in ('anonim', 'mediashare', 'voicenote')
     and coalesce(v_configuration ->> 'enabled', 'true') = 'false' then
    return jsonb_build_object('ok', false, 'reason', 'feature_or_overlay_disabled');
  end if;

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

  v_event_type := case when p_feature_key = 'saweran' then 'donation' else p_feature_key end;

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
    case when p_feature_key = 'anonim' then 'Anonim' else 'Tes Bagisawer' end,
    'Ini hanya alert uji coba — bukan donasi.',
    25000,
    'pending',
    now() + interval '5 minutes'
  );

  return jsonb_build_object('ok', true, 'feature_key', p_feature_key);
end;
$function$;

revoke all on function public.enqueue_feature_test_alert(uuid, text) from public;
revoke all on function public.enqueue_feature_test_alert(uuid, text) from anon, authenticated;
grant execute on function public.enqueue_feature_test_alert(uuid, text) to service_role;

comment on function public.enqueue_feature_test_alert(uuid, text)
  is 'Service-role-only test alert enqueue. Rechecks feature, overlay, module, token and alert settings inside a serialized transaction; never creates a donation or ledger entry.';

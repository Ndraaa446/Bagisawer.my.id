-- Serialize test-alert enqueue operations per creator so concurrent requests
-- cannot bypass the application-level cooldown.
create or replace function public.enqueue_test_alert(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_alert_enabled boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_user');
  end if;

  -- A transaction-scoped lock makes the cooldown check + insert atomic per user.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (
    select 1
    from public.overlay_tokens
    where user_id = p_user_id
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

  if exists (
    select 1
    from public.alert_events
    where user_id = p_user_id
      and created_at >= now() - interval '3 seconds'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  insert into public.alert_events (
    user_id, event_type, source, donor_name, message, amount, status, expires_at
  ) values (
    p_user_id,
    'test',
    'test',
    'Tes Bagisawer',
    'Ini hanya alert uji coba — bukan donasi.',
    25000,
    'pending',
    now() + interval '5 minutes'
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.enqueue_test_alert(uuid) from public, anon, authenticated;
grant execute on function public.enqueue_test_alert(uuid) to service_role;

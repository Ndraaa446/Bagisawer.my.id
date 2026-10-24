-- Keep verified feature-event processing consistent with the overlay resolver,
-- feature-settings API, and feature-specific test-alert endpoint.
-- This follow-up migration intentionally does not rewrite an already-applied migration.

create or replace function public.enqueue_verified_feature_event(
  p_user_id uuid,
  p_feature_key text,
  p_source_event_id text,
  p_donor_name text,
  p_message text,
  p_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_type text;
  v_minimum_amount integer;
  v_configuration jsonb;
  v_event_id uuid;
  v_donor_name text;
  v_message text;
begin
  if p_user_id is null
    or p_feature_key not in (
      'saweran', 'anonim', 'pesan', 'target', 'mediashare', 'voicenote', 'lagu', 'qris',
      'leaderboard', 'subathon', 'running-text', 'soundboard', 'polling', 'vip-queue',
      'bagpao', 'gachaton', 'bidcoin'
    )
    or p_source_event_id is null
    or char_length(btrim(p_source_event_id)) < 1
    or char_length(p_source_event_id) > 200
    or p_amount is null
    or p_amount < 1000
    or p_amount > 100000000
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_payload');
  end if;

  v_event_type := case p_feature_key
    when 'saweran' then 'donation'
    when 'anonim' then 'donation_anonymous'
    when 'pesan' then 'donation_message'
    when 'target' then 'target'
    when 'mediashare' then 'mediashare'
    when 'voicenote' then 'voicenote'
    when 'lagu' then 'song_request'
    when 'qris' then 'qris'
    when 'leaderboard' then 'leaderboard'
    when 'subathon' then 'subathon'
    when 'running-text' then 'running-text'
    when 'soundboard' then 'soundboard'
    when 'polling' then 'polling'
    when 'vip-queue' then 'vip-queue'
    when 'bagpao' then 'bagpao'
    when 'gachaton' then 'gachaton'
    when 'bidcoin' then 'bidcoin'
    else null
  end;

  select minimum_amount, configuration
    into v_minimum_amount, v_configuration
    from public.creator_feature_settings
   where user_id = p_user_id
     and feature_key = p_feature_key
     and enabled = true
     and overlay_enabled = true;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'feature_or_overlay_disabled');
  end if;

  -- Anonymous support, media share and voice notes each have a module-level
  -- enabled switch in addition to the shared feature/overlay switches.
  if p_feature_key in ('anonim', 'mediashare', 'voicenote')
     and coalesce(v_configuration ->> 'enabled', 'true') = 'false' then
    return jsonb_build_object('ok', false, 'reason', 'feature_or_overlay_disabled');
  end if;

  if p_amount < coalesce(v_minimum_amount, 1000) then
    return jsonb_build_object('ok', false, 'reason', 'below_minimum');
  end if;

  if not exists (
    select 1
      from public.creator_feature_overlay_tokens t
     where t.user_id = p_user_id
       and t.feature_key = p_feature_key
       and t.revoked_at is null
  ) then
    return jsonb_build_object('ok', false, 'reason', 'overlay_token_inactive');
  end if;

  v_donor_name := case when p_feature_key = 'anonim' then 'Anonim'
    else left(coalesce(nullif(btrim(p_donor_name), ''), 'Pendukung'), 80) end;
  v_message := left(coalesce(nullif(btrim(p_message), ''), 'Terima kasih atas dukungannya!'), 240);

  insert into public.alert_events (
    user_id, event_type, source, source_event_id, donor_name, message, amount, status, expires_at
  ) values (
    p_user_id, v_event_type, 'feature', btrim(p_source_event_id),
    v_donor_name, v_message, p_amount, 'pending', now() + interval '5 minutes'
  )
  on conflict (user_id, source_event_id, event_type) where source_event_id is not null
  do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  return jsonb_build_object('ok', true, 'duplicate', false, 'eventId', v_event_id);
end;
$$;

comment on function public.enqueue_verified_feature_event(uuid, text, text, text, text, integer)
  is 'Service-role-only enqueue for a payment already verified by a trusted server-side provider webhook. Enforces module switches and idempotency; never call from browser input or a return URL.';

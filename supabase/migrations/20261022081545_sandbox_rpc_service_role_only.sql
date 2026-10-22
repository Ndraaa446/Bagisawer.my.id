create or replace function public.process_sandbox_payment_event(
  p_reference text, p_provider_event_id text, p_event_type text,
  p_amount_idr integer, p_currency text, p_payload_hash text
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_donation public.sandbox_donations%rowtype;
  v_existing public.sandbox_payment_events%rowtype;
  v_event_id uuid;
begin
  if p_event_type not in ('payment.succeeded','payment.failed','payment.refunded') then raise exception 'Unsupported sandbox event type'; end if;
  if p_currency <> 'IDR' or p_amount_idr < 1000 or p_amount_idr > 100000000 then raise exception 'Invalid sandbox amount or currency'; end if;
  if length(p_provider_event_id) < 8 or length(p_provider_event_id) > 160 then raise exception 'Invalid provider event ID'; end if;
  if p_payload_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid payload hash'; end if;
  select * into v_donation from public.sandbox_donations where reference = p_reference for update;
  if not found then raise exception 'Sandbox donation not found'; end if;
  if v_donation.environment <> 'sandbox' then raise exception 'Wrong payment environment'; end if;
  if v_donation.amount_idr <> p_amount_idr or v_donation.currency <> p_currency then raise exception 'Amount or currency mismatch'; end if;
  select * into v_existing from public.sandbox_payment_events where provider_event_id = p_provider_event_id;
  if found then
    if v_existing.donation_id <> v_donation.id or v_existing.event_type <> p_event_type or v_existing.amount_idr <> p_amount_idr or v_existing.currency <> p_currency or v_existing.payload_hash <> p_payload_hash then
      raise exception 'Idempotency key reused with a different payload';
    end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'donation_status', v_donation.status);
  end if;
  if p_event_type = 'payment.succeeded' and v_donation.status = 'pending' then
    update public.sandbox_donations set status = 'succeeded', paid_at = now() where id = v_donation.id;
    insert into public.sandbox_ledger_entries(donation_id, provider_event_id, account_code, amount_idr)
    values (v_donation.id, p_provider_event_id, 'creator_receivable', p_amount_idr), (v_donation.id, p_provider_event_id, 'platform_clearing', -p_amount_idr);
    insert into public.alert_events(user_id, event_type, source, donor_name, message, amount, status, expires_at)
    values (v_donation.creator_user_id, 'test', 'test', v_donation.donor_name, left('SANDBOX · BUKAN DONASI NYATA — ' || v_donation.message, 240), v_donation.amount_idr, 'pending', now() + interval '5 minutes');
  elsif p_event_type = 'payment.failed' and v_donation.status = 'pending' then
    update public.sandbox_donations set status = 'failed' where id = v_donation.id;
  elsif p_event_type = 'payment.refunded' and v_donation.status = 'succeeded' then
    update public.sandbox_donations set status = 'refunded' where id = v_donation.id;
    insert into public.sandbox_ledger_entries(donation_id, provider_event_id, account_code, amount_idr)
    values (v_donation.id, p_provider_event_id, 'creator_receivable', -p_amount_idr), (v_donation.id, p_provider_event_id, 'platform_clearing', p_amount_idr);
  else raise exception 'Event is not valid for current donation status';
  end if;
  insert into public.sandbox_payment_events(provider_event_id, donation_id, event_type, amount_idr, currency, payload_hash, result)
  values (p_provider_event_id, v_donation.id, p_event_type, p_amount_idr, p_currency, p_payload_hash, 'processed') returning id into v_event_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'event_id', v_event_id);
end;
$$;
revoke all on function public.process_sandbox_payment_event(text,text,text,integer,text,text) from public, anon, authenticated;
grant execute on function public.process_sandbox_payment_event(text,text,text,integer,text,text) to service_role;

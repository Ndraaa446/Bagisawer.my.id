create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.sandbox_donations (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete restrict,
  reference text not null unique,
  donor_name text not null check (char_length(donor_name) between 1 and 80),
  message text not null default '' check (char_length(message) <= 240),
  amount_idr integer not null check (amount_idr between 1000 and 100000000),
  currency text not null default 'IDR' check (currency = 'IDR'),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','expired','refunded')),
  environment text not null default 'sandbox' check (environment = 'sandbox'),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists sandbox_donations_creator_created_idx on public.sandbox_donations (creator_user_id, created_at desc);

create table if not exists public.sandbox_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'bagisawer_sandbox' check (provider = 'bagisawer_sandbox'),
  provider_event_id text not null unique,
  donation_id uuid not null references public.sandbox_donations(id) on delete restrict,
  event_type text not null check (event_type in ('payment.succeeded','payment.failed','payment.refunded')),
  amount_idr integer not null check (amount_idr between 1000 and 100000000),
  currency text not null default 'IDR' check (currency = 'IDR'),
  payload_hash text not null,
  processed_at timestamptz not null default now(),
  result text not null check (result in ('processed','duplicate','rejected'))
);

create table if not exists public.sandbox_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.sandbox_donations(id) on delete restrict,
  provider_event_id text not null,
  account_code text not null check (account_code in ('creator_receivable','platform_clearing')),
  amount_idr bigint not null check (amount_idr <> 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  unique (provider_event_id, account_code)
);
alter table public.sandbox_donations enable row level security;
alter table public.sandbox_payment_events enable row level security;
alter table public.sandbox_ledger_entries enable row level security;
revoke all on public.sandbox_donations from anon, authenticated;
revoke all on public.sandbox_payment_events from anon, authenticated;
revoke all on public.sandbox_ledger_entries from anon, authenticated;
grant all on public.sandbox_donations to service_role;
grant all on public.sandbox_payment_events to service_role;
grant all on public.sandbox_ledger_entries to service_role;

create or replace function private.process_sandbox_payment_event(
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
revoke all on function private.process_sandbox_payment_event(text,text,text,integer,text,text) from public, anon, authenticated;
grant execute on function private.process_sandbox_payment_event(text,text,text,integer,text,text) to service_role;

create or replace function private.reject_sandbox_ledger_mutations()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin raise exception 'Sandbox ledger is append-only'; end;
$$;
drop trigger if exists sandbox_ledger_no_update on public.sandbox_ledger_entries;
create trigger sandbox_ledger_no_update before update or delete on public.sandbox_ledger_entries for each row execute function private.reject_sandbox_ledger_mutations();
drop trigger if exists sandbox_ledger_no_truncate on public.sandbox_ledger_entries;
create trigger sandbox_ledger_no_truncate before truncate on public.sandbox_ledger_entries for each statement execute function private.reject_sandbox_ledger_mutations();

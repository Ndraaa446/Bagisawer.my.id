create index if not exists sandbox_payment_events_donation_idx on public.sandbox_payment_events (donation_id);
create index if not exists sandbox_ledger_entries_donation_idx on public.sandbox_ledger_entries (donation_id);

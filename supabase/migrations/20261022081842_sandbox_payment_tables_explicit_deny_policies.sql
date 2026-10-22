drop policy if exists "Deny direct client access to sandbox donations" on public.sandbox_donations;
create policy "Deny direct client access to sandbox donations" on public.sandbox_donations for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access to sandbox payment events" on public.sandbox_payment_events;
create policy "Deny direct client access to sandbox payment events" on public.sandbox_payment_events for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access to sandbox ledger" on public.sandbox_ledger_entries;
create policy "Deny direct client access to sandbox ledger" on public.sandbox_ledger_entries for all to anon, authenticated using (false) with check (false);

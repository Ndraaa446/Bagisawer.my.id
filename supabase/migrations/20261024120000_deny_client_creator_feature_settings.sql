-- Defense in depth: creator feature settings are managed by authenticated server routes
-- using the service role. Browser roles must never read or mutate this table directly.
drop policy if exists "Deny browser access to creator feature settings"
  on public.creator_feature_settings;

create policy "Deny browser access to creator feature settings"
  on public.creator_feature_settings
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "No direct client access to overlay tokens" on public.overlay_tokens;
create policy "No direct client access to overlay tokens"
  on public.overlay_tokens for all to anon, authenticated
  using (false)
  with check (false);

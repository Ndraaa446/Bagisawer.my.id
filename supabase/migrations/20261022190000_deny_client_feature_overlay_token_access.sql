-- Defense in depth: browser roles are denied even if table grants change later.
drop policy if exists "deny direct client access" on public.creator_feature_overlay_tokens;
create policy "deny direct client access"
on public.creator_feature_overlay_tokens
for all
to anon, authenticated
using (false)
with check (false);

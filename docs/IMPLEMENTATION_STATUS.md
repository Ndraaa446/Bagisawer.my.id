# Implementation Status

Updated: 2026-10-22

## Repository and connected services
- GitHub repository: https://github.com/Ndraaa446/Bagisawer.my.id
- Default branch: `main`; current preview preparation is isolated on `chore/netlify-preview-readiness`.
- Supabase project: `gzfeyyflrnrqrnbvgsow`; project reports ACTIVE_HEALTHY.
- Netlify is the intended preview/testing host. The connected Netlify team is visible, but the available project listing currently returns no sites, so a site ID, preview URL, access protection and actual deploy status cannot yet be verified through the current connection.
- Do not merge this branch to `main` or publish a public production release without explicit approval. Vercel is intentionally out of scope for now; do not trigger deployments there.
- The latest known Vercel production deployment is READY at commit `0e46e200646efd0b8103b6b9255c731765d028d2`, behind GitHub `main`; this is historical context only and is not the current delivery target.

## Implemented in repository
- Product feature matrix, product specification, architecture, payment flow and security docs.
- Next.js App Router scaffold, strict TypeScript configuration and ESLint flat-config compatibility.
- Responsive Indonesian landing page and public features, FAQ, docs, support, terms draft and privacy draft routes.
- Supabase browser/server client helpers with explicit missing-environment errors.
- Supabase Auth pages and session-refresh middleware. End-to-end registration, login, email verification and password recovery checks are explicitly deferred for a later phase.
- Creator profile database migration: username, display name, bio, publication toggle, timestamps, unique case-insensitive username index, signup trigger and backfill for existing users.
- Creator dashboard wired to profile database with validation, save feedback and responsive profile preview.
- Creator livestream settings page backed by `public.creator_stream_settings`, with owner-scoped RLS, alert enable/threshold/duration/theme/sound preferences and a local preview.
- Private OBS overlay token lifecycle and isolated test-alert pipeline: high-entropy token generated server-side, only SHA-256 hash stored, rotate/revoke controls, token-authenticated minimal overlay API, expiring test events, and OBS Browser Source page.
- Provider-neutral sandbox payment flow with server-generated references, pending/succeeded states, a service-role-only idempotent event processor, balanced append-only sandbox ledger entries, and clearly labeled test alerts.
- Public creator profile route at `/<username>`; unpublished profiles are not returned by the public page.
- Basic security response headers and environment/security/payment/deployment docs.
- Netlify Next.js preview configuration in `netlify.toml`, with lint, TypeScript and build checks chained before preview output.
- GitHub Actions quality workflow for pull requests, pushes to `main`, and manual dispatch. The workflow has not yet been run against this branch.

## Verification evidence
- Supabase project is healthy and has the creator, streaming, overlay and sandbox migrations applied, including `20261022142009_restrict_creator_table_privileges`.
- Least-privilege grants were corrected for `public.creator_profiles`, `public.creator_stream_settings` and `public.alert_events`. Browser roles no longer have table-level `TRUNCATE`, `DELETE` or other unnecessary privileges on these tables; expected select/insert/update grants remain, scoped by RLS policies.
- `public.overlay_tokens` has RLS enabled, an explicit deny-all policy for browser roles, and no client grants; server-only service access is required.
- Sandbox tables have RLS enabled and explicit deny policies for browser roles. `public.process_sandbox_payment_event` has no EXECUTE grant for `PUBLIC`, `anon` or `authenticated`; it is granted only to `service_role`.
- Read-only database inspection found one succeeded sandbox donation, one processed payment event and two ledger entries. The ledger sums to zero; no unbalanced sandbox donations were found. This verifies the stored database state, not a complete browser-to-production end-to-end test or duplicate-event replay.
- Supabase Security Advisor reports one remaining warning: leaked-password protection is disabled. Auth configuration/testing remains deferred for now.
- No complete end-to-end OBS browser test, token-revocation test, sandbox duplicate replay test, or current lint/typecheck/build result has been verified in this session.
- No Netlify site or deployment could be verified through the available Netlify project listing; do not claim a preview URL or successful build until one is returned.

## Not yet implemented / launch blockers
- No external payment provider is configured. The sandbox does not contact a bank/e-wallet, prove an actual payment, or change production balances.
- Real donation-triggered alert delivery, realtime queue recovery, sound playback, store delivery, and complete admin/moderation dashboard are not active.
- The sandbox and overlay APIs require a valid server-only Supabase service/secret key at runtime. Never expose it through a `NEXT_PUBLIC_` variable.
- Profile avatar upload is not enabled yet.
- Privacy and terms are drafts, not final legal policies.
- Payment and payout operations must remain disabled until a provider is selected and provider sandbox, signed webhook, signature/replay, reconciliation and security tests pass.
- Registration, email confirmation, login/logout and password recovery end-to-end checks are intentionally deferred and should not be treated as completed.
- Netlify environment variables and preview visitor access cannot be verified until the actual site is visible to the connected Netlify integration.

## Next steps
1. Verify/create the intended Netlify site and confirm its production branch and visitor-access policy before triggering a preview.
2. Add the public Supabase URL/anon key and a server-only Supabase service/secret key in Netlify site environment settings; do not store secrets in the repository.
3. Open a pull request from the preview branch only after confirming the Netlify site is configured for previews. Do not merge it to `main` or publish production.
4. Run lint, typecheck and production build checks; record the actual output.
5. Test the sandbox flow end to end: create pending transaction, simulate success, replay the same event, and verify no extra ledger entries or alerts are created.
6. Test overlay token create/rotate/revoke, test-alert delivery in OBS, and rejection of revoked tokens.
7. Revisit Auth configuration and leaked-password protection when the deferred identity-verification phase resumes.
8. Select a payment provider only after requirements and fees are reviewed; implement signed webhooks and provider sandbox tests before any real transactions.

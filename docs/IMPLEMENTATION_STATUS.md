# Implementation Status

Updated: 2026-10-22

## Repository and connected services
- GitHub repository: https://github.com/Ndraaa446/Bagisawer.my.id
- Default branch: main.
- Supabase project: `gzfeyyflrnrqrnbvgsow`; project reports ACTIVE_HEALTHY.
- Vercel project: `bagisawer`, linked to GitHub.
- The latest known production deployment is READY at commit `0e46e200646efd0b8103b6b9255c731765d028d2`; GitHub main has newer code. Vercel has returned a build/deployment rate-limit failure, so do not force another deployment until the quota recovers.
- Vercel has server-side environment variable entries for `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY` across the expected environments. Secret values are not read or exposed during this inspection, so their validity at runtime still needs an end-to-end check.

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

## Verification evidence
- Supabase project is healthy and has the creator, streaming, overlay and sandbox migrations applied, including `20261022142009_restrict_creator_table_privileges`.
- Least-privilege grants were corrected for `public.creator_profiles`, `public.creator_stream_settings` and `public.alert_events`. Browser roles no longer have table-level `TRUNCATE`, `DELETE` or other unnecessary privileges on these tables; expected select/insert/update grants remain, scoped by RLS policies.
- `public.overlay_tokens` has RLS enabled, an explicit deny-all policy for browser roles, and no client grants; server-only service access is required.
- Sandbox tables have RLS enabled and explicit deny policies for browser roles. `public.process_sandbox_payment_event` has no EXECUTE grant for `PUBLIC`, `anon` or `authenticated`; it is granted only to `service_role`.
- Read-only database inspection found one succeeded sandbox donation, one processed payment event and two ledger entries. The ledger sums to zero; no unbalanced sandbox donations were found. This verifies the stored database state, not a complete browser-to-production end-to-end test or duplicate-event replay.
- Supabase Security Advisor reports one remaining warning: leaked-password protection is disabled. Auth configuration/testing remains deferred for now.
- The latest GitHub combined status reports a Vercel failure linked to the build-rate-limit page. Production is therefore not yet verified against the latest `main` commit.
- No complete end-to-end OBS browser test, token-revocation test, sandbox duplicate replay test, or current lint/typecheck/build result has been verified in this session.

## Not yet implemented / launch blockers
- No external payment provider is configured. The sandbox does not contact a bank/e-wallet, prove an actual payment, or change production balances.
- Real donation-triggered alert delivery, realtime queue recovery, sound playback, store delivery, and complete admin/moderation dashboard are not active.
- The sandbox and overlay APIs require a valid server-only Supabase service/secret key at runtime. Never expose it through a `NEXT_PUBLIC_` variable.
- Profile avatar upload is not enabled yet.
- Privacy and terms are drafts, not final legal policies.
- Payment and payout operations must remain disabled until a provider is selected and provider sandbox, signed webhook, signature/replay, reconciliation and security tests pass.
- Registration, email confirmation, login/logout and password recovery end-to-end checks are intentionally deferred and should not be treated as completed.

## Next steps
1. Keep changes together and do not force deployments while the Vercel build quota is blocked.
2. Run lint, typecheck and production build checks when a build runner is available.
3. After Vercel quota recovers, deploy the latest reviewed `main` commit and verify the deployment SHA before browser testing.
4. Test the sandbox flow end to end: create pending transaction, simulate success, replay the same event, and verify no extra ledger entries or alerts are created.
5. Test overlay token create/rotate/revoke, test-alert delivery in OBS, and rejection of revoked tokens.
6. Revisit Auth configuration and leaked-password protection when the deferred identity-verification phase resumes.
7. Select a payment provider only after requirements and fees are reviewed; implement signed webhooks and provider sandbox tests before any real transactions.

# Implementation Status — 2026-10-24

## Current roadmap position

**Poin 4 dari 10: fitur inti OBS, alertbox, dan notifikasi.** Persiapan teknis selesai; verifikasi UI/OBS end-to-end masih terbuka. Ini bukan klaim bahwa 40% seluruh kode sudah selesai.

## Implemented in this batch

- Netlify build preflight validates required public Supabase variables before lint, typecheck, and production build.
- Overlay token rotation/revocation endpoints are present. Token resolution rejects revoked tokens, and the UI asks for confirmation before rotating or revoking.
- Test-alert cooldown runs inside a database function with a per-creator transaction advisory lock. It checks for an active overlay token and alert settings before enqueueing.
- Sandbox payment processing uses a unique provider-event ID and payload comparison for idempotency. The database function creates balanced ledger entries and queues one clearly labeled sandbox alert on first success.
- Overlay URLs are generated from the incoming request origin, so preview links stay on the preview host instead of using the configured primary app URL. The token-creation endpoint now follows the same rule.
- Overlay API responses are non-cacheable; database read errors now fail closed rather than silently falling back to enabled alerts.
- Creator overlay manager now has a manual status refresh control, in addition to automatic status loading and per-feature create/rotate/revoke/test actions.

## Verification evidence

- GitHub Actions Quality checks run #46 (`39806791737`) passed lint, typecheck, and production build for commit `6e66654ab6ebfca5ec94b76be8b7d3b569960bc3`, including the overlay URL and account-flow hardening.
- For the current development batch, GitHub Actions Quality checks run #382 (`39972990531`) passed unit/contract tests, lint, typecheck, and production build for commit `9f914537e81e503e23634445a9d2dc6ff6aef8cc`. This confirms repository CI only; it does not confirm the protected Netlify preview, real payment-provider behavior, or OBS Browser Source behavior.
- Netlify Deploy Preview status for commit `149a88df6f0c30ce8c8cde63927adeea2e1fb505` was **ready**. Netlify bot posted https://deploy-preview-1--bagisawe.netlify.app and deploy log https://app.netlify.com/projects/bagisawe/deploys/6ada2d8fb4c03c63cc488cd8. Commits after `149a88d` contain further auth-flow fixes and still need a preview build before end-to-end testing.
- The preview has SSO team-login protection. Direct browser inspection from the available checker was blocked, so interactive UI and OBS behavior are **not yet verified**.
- Supabase migration `atomic_test_alert_rate_limit` was applied to project `gzfeyyflrnrqrnbvgsow`.
- Read-only invariant query: 1 sandbox donation, 1 payment event, 2 ledger entries, 0 unbalanced donations, and 0 duplicate provider-event IDs.
- Permission check: `enqueue_test_alert(uuid)` is executable by `service_role`, not by `anon` or `authenticated`.
- Guard test for a user without an active overlay token returned `{ ok: false, reason: "token_inactive" }`; no alert was inserted.
- Duplicate replay returned `duplicate: true`; ledger entry count stayed at 2 and sandbox alert count stayed at 1.
- Supabase Security Advisor still warns that leaked-password protection is disabled. Performance Advisor reports two sandbox indexes as unused so far; do not drop them based on this small test dataset.

## Point 5 — account and access work started

- Reviewed session checks on dashboard routes, server-side Supabase client cookie handling, and RLS ownership policies for creator profiles and stream settings.
- Confirmed that overlay token rows and sandbox payment/ledger tables are not directly accessible to browser roles; service-role RPCs remain server-only.
- Removed a duplicate password-recovery link from the login form.
- Password-reset submission verifies an active Supabase user session before changing the password and signs out after a successful reset.
- Login and registration normalize email input before calling Supabase Auth; expired/invalid auth callback links now show a useful message on the login page.
- Login, registration, and password-recovery flows still require end-to-end verification with a dedicated test account; no such test has been run in this batch. The password-reset guard is a code-level hardening, not proof of a successful email recovery flow.

## Next work in point 4

1. Confirm fresh CI and Netlify preview build results for the overlay API hardening.
2. Verify dashboard and settings navigation, responsive UI, and error states.
3. Test overlay token creation, rotation, and revocation; confirm revoked tokens are rejected.
4. Verify test-alert enqueueing and display in the OBS Browser Source, including cooldown and disabled-alert cases.

The preview's SSO restriction currently prevents the available external browser checker from completing steps 2–4. Do not weaken access protection just to bypass this limitation.

## Deferred / not verified

- Registration, login, email verification, and password recovery end-to-end checks remain deferred.
- Real payment providers, actual money movement, and payouts are out of scope; sandbox checks are not proof of real-money processing.
- Leaked-password protection remains a security follow-up; it has not been enabled in this batch.
- Do not merge this branch to `main` or publish production without explicit approval.

## Product UI batch — creator workspace, donation form, payment catalogue

- Added an authenticated feature-center route at `/dashboard/fitur` with category views for donations, payment methods, per-feature overlays, livestream interactions, and ecosystem modules.
- The creator dashboard now links to the feature center.
- Added a public creator support-page UI at `/[username]/dukung`, linked from the public creator profile. It supports amount selection, custom amount, optional name/message, anonymity toggle, and selecting a payment method in the UI.
- Added public creator discovery at `/explore`, and public `/contact`, `/refund`, `/fees`, and `/status` screens. The contact form is display-only, refund/fees are explicitly drafts, and status is a manual development summary rather than live uptime monitoring.
- Expanded `/features` to catalogue donation, OBS/overlay, interaction, dashboard/security modules and all currently mapped payment methods; the home footer now links to the public pages.
- Listed QRIS, virtual account, bank transfer, GoPay, DANA, OVO, ShopeePay, LinkAja, debit/credit card, and retail payment methods. Every method is explicitly labelled unavailable because no external provider is configured.
- Added a server-only `creator_feature_overlay_tokens` table with one revocable token per creator + feature. Browser roles have no table access; the API issues, rotates, lists, and revokes each feature token separately.
- Added `/api/streaming/overlay-links` for per-feature token management and `/api/streaming/overlay-links/test` for a feature-specific test alert. The overlay resolver now checks feature tokens and filters pending events by feature type while preserving existing general OBS tokens.
- The OBS overlay client now renders distinct layouts for running text, mediashare, voice note, song requests, leaderboard, subathon, polling, soundboard, and general donation-style alerts. Media/audio playback remains intentionally guarded until safe event payloads and moderation are implemented.
- Added `enqueue_feature_test_alert` as a server-only RPC with a per-creator/per-feature advisory lock, active-token check, alert-enabled check, and 3-second cooldown. SQL privilege check confirms `service_role` can execute it and `anon`/`authenticated` cannot.
- Added an explicit deny-all RLS policy for `anon` and `authenticated` on the feature-token table. The latest Supabase Security Advisor no longer reports an RLS-enabled-without-policy finding for this table; the leaked-password-protection warning remains.
- The feature center now has dedicated display sections for finance/payouts, analytics/reports, notifications, moderation/admin, and account settings. These screens use empty states rather than fabricated transaction or balance figures.
- Added module-detail routes at `/dashboard/fitur/modul/{slug}` for each listed donation/interaction/ecosystem feature, with interactive settings forms and its own overlay manager where applicable. Form submissions are local preview only; settings persistence and module event producers remain follow-up work.
- The support-page submit action only displays a disabled-checkout notice; it does not create a transaction or accept money.
- Vercel deployment remains intentionally avoided because the account previously hit its deployment-rate limit. No deployment was run as part of this batch. The latest known GitHub Actions batch passes; the protected Netlify preview and interactive OBS flow still require verification. No merge to `main` or production release is authorized.

## Next implementation batch

1. Add module-specific event producers/configuration for goals, mediashare, voice notes, song requests, leaderboard, subathon, running text, soundboard, polling, VIP queue, Bagpao, Gachaton, Bidcoin, store/vouchers, and competitions/clips; the per-feature token/queue foundation now exists.
2. Add support-page server validation and a provider-adapter boundary, keeping every live checkout disabled until a provider is selected and verified.
3. Finish persistent settings and CRUD flows behind the finance, analytics, notification, moderation, and admin screens.
4. Test token creation/rotation/revocation, event isolation, feature test alerts, and OBS Browser Source when preview access allows it.
5. Only then run consolidated UI/flow testing; keep login/recovery verification deferred as previously requested unless separately authorized.

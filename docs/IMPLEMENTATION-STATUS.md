# Implementation Status — 2026-10-22

## Current roadmap position

**Poin 4 dari 10: fitur inti OBS, alertbox, dan notifikasi.** Persiapan teknis selesai; verifikasi UI/OBS end-to-end masih terbuka. Ini bukan klaim bahwa 40% seluruh kode sudah selesai.

## Implemented in this batch

- Netlify build preflight validates required public Supabase variables before lint, typecheck, and production build.
- Overlay token rotation/revocation endpoints are present. Token resolution rejects revoked tokens, and the UI asks for confirmation before rotating or revoking.
- Test-alert cooldown runs inside a database function with a per-creator transaction advisory lock. It checks for an active overlay token and alert settings before enqueueing.
- Sandbox payment processing uses a unique provider-event ID and payload comparison for idempotency. The database function creates balanced ledger entries and queues one clearly labeled sandbox alert on first success.
- Overlay URLs are generated from the incoming request origin, so preview links stay on the preview host instead of using the configured primary app URL.
- Overlay API responses are non-cacheable; database read errors now fail closed rather than silently falling back to enabled alerts.

## Verification evidence

- GitHub Actions Quality checks run #19 (`39803342414`) passed lint, typecheck, and production build for the code/migration batch before the latest overlay API hardening; a fresh CI run is required for these newest changes.
- Netlify Deploy Preview status for commit `3cb4670db4cda0a9ef431a503d087bbb61d54e0b` was **success**. Netlify bot posted the preview URL: https://deploy-preview-1--bagisawe.netlify.app and deploy log: https://app.netlify.com/projects/bagisawe/deploys/6ada29805023955eac473189. This is the previous commit; the latest code changes need their own preview build.
- The preview has SSO team-login protection. Direct browser inspection from the available checker was blocked, so interactive UI and OBS behavior are **not yet verified**.
- Supabase migration `atomic_test_alert_rate_limit` was applied to project `gzfeyyflrnrqrnbvgsow`.
- Read-only invariant query: 1 sandbox donation, 1 payment event, 2 ledger entries, 0 unbalanced donations, and 0 duplicate provider-event IDs.
- Permission check: `enqueue_test_alert(uuid)` is executable by `service_role`, not by `anon` or `authenticated`.
- Guard test for a user without an active overlay token returned `{ ok: false, reason: "token_inactive" }`; no alert was inserted.
- Duplicate replay returned `duplicate: true`; ledger entry count stayed at 2 and sandbox alert count stayed at 1.
- Supabase Security Advisor still warns that leaked-password protection is disabled. Performance Advisor reports two sandbox indexes as unused so far; do not drop them based on this small test dataset.

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

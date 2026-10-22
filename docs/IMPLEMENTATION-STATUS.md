# Implementation Status — 2026-10-22

## Current roadmap position

**Poin 4 dari 10: fitur inti OBS, alertbox, dan notifikasi.** Persiapan teknis selesai; verifikasi UI/OBS end-to-end masih terbuka. Ini bukan klaim bahwa 40% seluruh kode sudah selesai.

## Implemented in this batch

- Netlify build preflight validates required public Supabase variables before lint, typecheck, and production build.
- Overlay token rotation/revocation endpoints are present. Token resolution rejects revoked tokens, and the UI asks for confirmation before rotating or revoking.
- Test-alert cooldown runs inside a database function with a per-creator transaction advisory lock. It checks for an active overlay token and alert settings before enqueueing.
- Sandbox payment processing uses a unique provider-event ID and payload comparison for idempotency. The database function creates balanced ledger entries and queues one clearly labeled sandbox alert on first success.

## Verification evidence

- GitHub Actions Quality checks run #19 (`39803342414`) passed lint, typecheck, and production build for the code/migration batch; the later status-only commit did not change application code.
- Netlify Deploy Preview status for commit `3cb4670db4cda0a9ef431a503d087bbb61d54e0b` is **success**. Netlify bot posted the preview URL: https://deploy-preview-1--bagisawe.netlify.app and deploy log: https://app.netlify.com/projects/bagisawe/deploys/6ada29805023955eac473189
- The preview has SSO team-login protection. Direct browser inspection from the available checker was blocked, so interactive UI and OBS behavior are **not yet verified**.
- Supabase migration `atomic_test_alert_rate_limit` was applied to project `gzfeyyflrnrqrnbvgsow`.
- Read-only invariant query: 1 sandbox donation, 1 payment event, 2 ledger entries, 0 unbalanced donations, and 0 duplicate provider-event IDs.
- Permission check: `enqueue_test_alert(uuid)` is executable by `service_role`, not by `anon` or `authenticated`.
- Guard test for a user without an active overlay token returned `{ ok: false, reason: "token_inactive" }`; no alert was inserted.
- Duplicate replay returned `duplicate: true`; ledger entry count stayed at 2 and sandbox alert count stayed at 1.
- Supabase Security Advisor still warns that leaked-password protection is disabled. Performance Advisor reports two sandbox indexes as unused so far; do not drop them based on this small test dataset.

## Next work in point 4

1. Verify dashboard and settings navigation, responsive UI, and error states.
2. Test overlay token creation, rotation, and revocation; confirm revoked tokens are rejected.
3. Verify test-alert enqueueing and display in the OBS Browser Source, including cooldown and disabled-alert cases.
4. Re-run lint, typecheck, build, and relevant database invariant checks after any code changes.

The preview's SSO restriction currently prevents the available external browser checker from completing steps 1–3. Do not weaken access protection just to bypass this limitation.

## Deferred / not verified

- Registration, login, email verification, and password recovery end-to-end checks remain deferred.
- Real payment providers, actual money movement, and payouts are out of scope; sandbox checks are not proof of real-money processing.
- Leaked-password protection remains a security follow-up; it has not been enabled in this batch.
- Do not merge this branch to `main` or publish production without explicit approval.

# Implementation Status — 2026-10-22

## Scope completed in this batch

- Netlify build preflight validates the required public Supabase variables before lint, typecheck, and production build.
- Overlay token rotation and revocation endpoints are present. Token resolution rejects revoked tokens; the overlay API returns 404 for a revoked or unknown token. The UI asks for confirmation before revocation/rotation.
- Test-alert cooldown now runs inside a database function using a per-creator transaction advisory lock. The function checks for an active overlay token and disabled alerts before enqueueing; the API maps rate-limit rejection to HTTP 429.
- Sandbox payment processing uses a unique provider-event ID and payload comparison for idempotency. The SQL function creates balanced ledger entries and queues one explicitly labeled sandbox alert on first success.

## Verification results

- GitHub Actions Quality checks run #19 (`39803342414`) passed: lint, typecheck, and production build all succeeded for the code/migration batch. The later commit only updates this status document.
- Supabase migration `atomic_test_alert_rate_limit` applied successfully on project `gzfeyyflrnrqrnbvgsow`.
- Read-only invariant query: 1 sandbox donation, 1 payment event, 2 ledger entries, 0 unbalanced donations, and 0 duplicate provider-event IDs.
- Permission check: `enqueue_test_alert(uuid)` is executable by `service_role`, and not executable by `anon` or `authenticated`.
- Guard test with a UUID that has no active overlay token returned `{ ok: false, reason: "token_inactive" }`; no alert was inserted.
- Duplicate replay test returned `duplicate: true`; ledger entry count remained 2 and sandbox alert count remained 1.
- Supabase security advisor currently reports leaked-password protection disabled (warning). Performance advisor reports two sandbox indexes as unused so far (informational); do not drop them based on this small test dataset.

## Still not verified

- No successful Netlify Deploy Preview has been confirmed for the latest code. The site has SSO team-login protection for all deploys, and available tooling has not provided a reliable latest deploy log.
- Do not merge this branch to `main` or publish production without explicit approval.
- Do not claim login, registration, email verification, password recovery, browser-level OBS behavior, or real payment/payout flows have passed end-to-end tests.
- Payment provider selection and real-money processing remain out of scope.

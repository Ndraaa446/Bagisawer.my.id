# Bagisawer QA execution matrix

Last reviewed: 2026-10-25. This is a checklist, not a claim that every row has passed.

## Feature-by-feature flow

For every feature, test in an authenticated QA creator account:

1. Set feature enabled/disabled, overlay enabled/disabled, minimum amount and configuration.
2. Reload dashboard and confirm settings persist from the server.
3. Call public support-options endpoint and confirm disabled features are omitted.
4. Submit valid and invalid amounts (below minimum, minimum, step mismatch, upper bound, non-number).
5. Create the feature overlay token; verify URL differs from every other feature token.
6. Send the feature-specific test alert; verify the event is labelled as test and only appears on the matching overlay.
7. Rotate and revoke token; verify old token returns 404 and unrelated feature tokens still work.
8. Disable the feature or overlay; verify the overlay endpoint fails closed and no new event is displayed.
9. Try unauthenticated and cross-user API access; verify 401/403 or a safe not-found response.

| Feature key | Module-specific behavior to test | Current evidence |
|---|---|---|
| saweran | Minimum amount, name/message, test alert and general donation layout | Test event exists in QA; no production event producer evidenced; E2E not verified |
| anonim | Name is never exposed in public event/overlay | API redaction regression test passes in CI; QA has a test event; E2E privacy test pending |
| pesan | Length and moderation/filter rules | Not verified |
| target | Target CRUD, progress, milestone event | Not verified |
| mediashare | URL allowlist, SSRF prevention, moderation, duration, playback | Not verified; do not accept public URLs for playback yet |
| voicenote | File MIME/signature, size/duration, storage authorization, moderation | Not verified; upload/playback not production-ready |
| lagu | Provider authorization, queue policy and removal | Not verified; external integration not configured |
| qris | Only show a genuine provider-generated QR/official support URL | Not verified; no payment QR provider configured |
| leaderboard | Correct period aggregation and anonymity | Not verified |
| subathon | Server-authoritative timer, extension caps, audit history | Not verified |
| running-text | Length, sanitization, display duration and rate limit | Not verified |
| soundboard | Approved assets, trigger cooldown and volume limits | Not verified |
| polling | Poll ownership, vote dedupe, deadlines and result aggregation | Not verified |
| vip-queue | Ordering, eligibility, cancellation and audit history | Not verified |
| bagpao | Product behavior/specification must be confirmed before functional acceptance | Blocked on specification |
| gachaton | Deterministic/test-safe outcomes, auditability and legal/security review for prizes | Blocked on specification/review |
| bidcoin | Internal-only balance/points, replay prevention and transaction history | Not verified; never represent as cash |

## Latest QA audit (2026-10-23)

- Latest verified code CI run [39909085510](https://github.com/Ndraaa446/Bagisawer.my.id/actions/runs/39909085510) passed unit/contract tests, ESLint, TypeScript typecheck and production build for commit `ceca675a08cb12c1b17947389dabc699e6da9cab`. This run validates the current application and test sources; subsequent documentation-only updates should still receive CI confirmation.

- GitHub Actions run [39891600518](https://github.com/Ndraaa446/Bagisawer.my.id/actions/runs/39891600518) completed successfully for unit/contract tests, ESLint, TypeScript typecheck and production build on commit `aae9da1a05a5a8765c8b7efda35507a5f4c18a02`.
- Read-only QA database inspection confirms 17 feature overlay-token rows and test-labelled `alert_events` for all 17 feature keys. These rows prove test-alert routing data exists, not that each feature's production behavior works end-to-end.
- QA `alert_events` currently contains only `source='test'` rows, including 17 feature test event types and the general test event. No production donation/feature event producer was evidenced by this audit. A new migration `20261023100000_allow_server_feature_alert_sources.sql` has been applied to QA to permit `source='feature'` for trusted server-side producers; the existing authenticated-client RLS policy still only allows `event_type='test'` and `source='test'`. This is schema groundwork, not a production event producer.
- A service-role-only SQL function `enqueue_verified_feature_event` and server-only TypeScript helper now form the verified-event producer foundation. QA schema inspection confirms the function cannot be executed by `anon` or `authenticated`, but can by `service_role`. It checks feature/overlay enablement, active feature token, minimum amount, anonymous-name redaction, expiry and idempotency. It is not connected to any provider webhook yet, so no live/verified payment event is currently produced.
- The database RPCs `enqueue_feature_test_alert` and `enqueue_test_alert` use transaction-scoped advisory locks and cooldown checks. Direct EXECUTE is denied to `anon` and `authenticated`; application routes call them server-side after authentication.
- RLS inspection confirms direct client access is denied on feature overlay tokens and sandbox donations/payment events/ledger. `alert_events` insert policy only permits a creator's own pending `test` source event.
- `process_sandbox_payment_event` validates sandbox environment, IDR amount/currency, event ID and payload hash; it locks the donation row, rejects amount/currency mismatch and reused idempotency keys with changed payload, and creates balanced test ledger entries for success/refund. This was a function-definition audit only; no new transaction was executed in this read-only pass.
- Finding: the sandbox `simulate_success` path creates a test alert, not a feature-specific production donation event. Live payment/checkout/payout remain disabled. No provider webhook or real-money path was exercised.

## Overlay token and event-isolation tests

- [ ] All 17 tokens can be created only by an authenticated creator.
- [ ] Tokens are unique per creator + feature and only their SHA-256 hashes are stored server-side.
- [ ] The browser can only view the raw token at creation time; local storage is treated as a secret-bearing convenience, not a secure vault.
- [ ] Invalid, malformed, revoked and feature-disabled tokens fail closed.
- [ ] Disabling a feature or its overlay revokes its existing feature token; re-enabling requires a newly generated URL. The settings API now performs this revocation and the overlay-link status API reports effective availability; regression test added, CI pending.
- [ ] Overlay feature A never returns or acknowledges feature B events.\n- [x] Anonymous feature overlay API redacts donor names defensively, even if an upstream event stored a real name (regression test added; previously passed CI on an earlier commit; re-run pending for latest changes).
- [x] Acknowledgement query is constrained to owner, pending status, unexpired event, and the resolved feature event types (regression test added; previously passed CI on an earlier commit; re-run pending for latest changes).
- [ ] The general overlay excludes only events assigned to enabled feature overlays.
- [ ] Test-alert endpoint checks feature overlay state, active token, global alert state and cooldown.
- [ ] Duplicate acknowledgements cannot mark an unrelated event displayed.
- [ ] Test events are clearly marked as test and cannot create live ledger entries or balances.

## Payment / finance release gate

Live payment integration remains intentionally disabled. No provider has been selected/configured, and no real-money tests are authorized in this batch.

Before enabling any provider, test in provider sandbox:
- checkout/invoice creation per supported method;
- webhook signature verification using the raw body and provider's current scheme;
- success, failure, expiry, cancellation, duplicate delivery and out-of-order events;
- amount/currency/reference mismatch and replay attempts;
- idempotent payment state transitions and balanced append-only ledger entries;
- refund/dispute compensation and reconciliation;
- payout authorization, eligibility, fees, limits, approvals and provider reconciliation.

A browser redirect or client-submitted "success" is never proof of payment. Do not enable live checkout or payout endpoints until all gates pass and the provider account/credentials are configured securely.

## Security / browser / OBS

- [ ] No session: all creator settings, token-management and test-alert endpoints reject access.
- [ ] Creator A cannot read or modify creator B's settings, token or events.
- [ ] Oversized/invalid JSON and unknown feature keys are rejected.
- [ ] Request bursts hit server-side cooldown/rate limits.
- [ ] Media URL and upload protections prevent SSRF, unsafe MIME, oversized payloads and unmoderated playback.
- [ ] Responsive layouts and keyboard/accessibility behavior verified on desktop and mobile.
- [ ] Netlify Deploy Preview and OBS Browser Source tested end-to-end without weakening SSO or deploying to production.


## QA follow-up (2026-10-25)

- CI passed for commit `256d37c4a9d7b590923b4d22249df8f574c323a2`: unit/contract tests, ESLint, TypeScript typecheck, and production build.
- Dashboard/feature-center audit fixed a stale-state bug when navigating between feature modules and aligned the feature center with the new ivory/ink/lime design. A regression test now covers module-state reset. The Saweran card is labelled "Belum diuji E2E" rather than implying readiness.
- Donation amount regression coverage now includes Rp1,000 minimum, Rp100,000,000 maximum, below-minimum, above-maximum, step mismatch, fractional values, unsafe integers, and invalid configured minimums.
- Read-only QA database checks confirmed 17 feature token rows with 17 unique hashes and a unique constraint on creator + feature. RLS is enabled on overlay tokens, feature settings, and alert events. Only the `service_role` can execute the server-side enqueue RPCs.
- QA RPC probes (QA project only) verified: amount below a configured Rp5,000 minimum returns `below_minimum`; Rp25,000 Saweran produces a `donation` event; Rp5,000 Pesan produces a separate `donation_message` event; anonymous support stores `Anonim` instead of the submitted name; and the feature test-alert RPC enqueues a test-labelled event. Probe events were deleted after verification and no live-payment or ledger operation was invoked.
- After cleanup, all feature settings remain disabled and no probe event remains. Five QA overlay tokens are revoked (including the previously revoked Polling token); 12 token rows remain unrevoked. Because settings are disabled, the overlay resolver/RPC gate rejects event creation. Some QA rows retain `overlay_enabled=true` while `enabled=false`; the server checks both flags and fails closed, but this fixture inconsistency should be normalized before a full browser E2E run.
- Follow-up isolation finding (2026-10-25): Saweran test alerts used the shared `event_type='test'`, which could let a general test event be observed/acknowledged by the Saweran overlay. Fixed in code by mapping Saweran test alerts to `event_type='donation'` with `source='test'`, removing shared `test` from the Saweran overlay event allowlist, and adding a regression test. Migration `20261025100000_isolate_saweran_test_alerts.sql` was applied to the isolated QA Supabase project only; production was not changed. CI for the fix is pending at time of this note.
- Live browser/OBS verification is still blocked on a reachable preview matching the latest branch SHA. The existing published Netlify site does not establish that the latest branch changes are running, and the preview URL could not be opened by the available browser fetch path in this session. Do not mark the visual or E2E checklist as passed until the latest commit is reachable and tested.
- Still pending: authenticated HTTP tests for every token URL, explicit invalid/revoked token HTTP status checks against a reachable preview, browser acknowledgement/isolation checks for all 17 overlays, and OBS Browser Source visual/audio verification. CI passing does not count as those runtime tests. Payment provider, checkout, webhook, and payout remain disabled.

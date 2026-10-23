# Bagisawer QA execution matrix

Last reviewed: 2026-10-23. This is a checklist, not a claim that every row has passed.

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
| saweran | Minimum amount, name/message, test alert and general donation layout | Validation unit tests exist; E2E not verified |
| anonim | Name is never exposed in public event/overlay | API now redacts `donor_name` to `Anonim`; regression test added, CI/E2E pending |
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

## Overlay token and event-isolation tests

- [ ] All 17 tokens can be created only by an authenticated creator.
- [ ] Tokens are unique per creator + feature and only their SHA-256 hashes are stored server-side.
- [ ] The browser can only view the raw token at creation time; local storage is treated as a secret-bearing convenience, not a secure vault.
- [ ] Invalid, malformed, revoked and feature-disabled tokens fail closed.
- [ ] Overlay feature A never returns or acknowledges feature B events.\n- [x] Anonymous feature overlay API redacts donor names defensively, even if an upstream event stored a real name (unit/contract test added; CI result pending).\n- [x] Acknowledgement query is constrained to owner, pending status, unexpired event, and the resolved feature event types (unit/contract test added; CI result pending).
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

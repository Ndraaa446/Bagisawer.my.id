# Security Plan

- RLS is required for every table exposed via Supabase Data API; default deny and ownership/role policies are explicit.
- Never authorize from user-editable metadata. Validate admin/staff roles on the server.
- Keep service-role and payment secrets server-only; never use NEXT_PUBLIC_ for secrets.
- Validate request schemas, payload sizes, upload MIME/type, and rate limits.
- Verify payment webhook signatures using the raw body; compare provider reference, amount and currency; deduplicate event IDs.
- Financial ledger entries are append-only. Client requests cannot mutate balances.
- Prevent SSRF in media URL handling; block private/internal address ranges and unsafe schemes.
- Use private storage for voice/media, signed short-lived URLs, moderation and retention limits.
- Overlay tokens must be high entropy, revocable and excluded from logs; return minimal public fields.
- Set security headers, safe rendering, and audit sensitive admin, payout, refund and role changes.
- Do not log passwords, access tokens, payment secrets or unnecessary personal/financial details.
- Before launch: role-separated RLS tests, dependency audit, webhook replay tests, abuse/rate-limit tests and incident-response procedure.
- Production payment/payout operations remain disabled until provider approval and end-to-end security tests pass.

## Authentication redirect configuration
- Configure Supabase Auth Site URL to the canonical production origin (for example, https://bagisawer.vercel.app after confirming that domain is assigned to the project).
- Add the production origin and `https://bagisawer.vercel.app/auth/callback` to the Auth redirect URL allowlist. Add localhost callback only for local development.
- Email confirmation and password recovery depend on Supabase email delivery/template settings and the redirect allowlist; repository code alone cannot guarantee delivery.
- Test with a dedicated test account. Do not disable email confirmation just to make registration appear to work.


## OBS overlay tokens and test events
- Overlay tokens are generated with high entropy; only a SHA-256 hash is stored. Creating a new token replaces the previous token, and revocation invalidates the current URL.
- The overlay token table has RLS enabled and no browser-role grants/policies. Only server-side code with a Supabase service/secret key may resolve token hashes.
- Set `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` in Vercel Production/Preview as a secret environment variable. The app origin override, if used, is `NEXT_PUBLIC_APP_URL`. Never prefix it with `NEXT_PUBLIC_`, never commit it, and never expose its value in logs or client responses.
- Test events are constrained to `source='test'` and `event_type='test'`; they do not create donations or ledger entries. Browser clients cannot update/delete event status.
- The OBS URL is a bearer secret. Share only with the streaming software; rotate it if exposed. Token routes return no-store responses and the overlay page opts out of indexing.
- Until the server-only secret is configured, token/overlay endpoints deliberately return a configuration error rather than weakening database access policies.

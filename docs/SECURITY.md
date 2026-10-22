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

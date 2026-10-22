# Testing Strategy

## Required checks
- ESLint and TypeScript strict typecheck.
- Production Next.js build.
- Unit tests for validation, amount bounds, status transitions and idempotency.
- Integration tests for Supabase policies and server-side authorization.
- End-to-end tests for registration, login, creator profile, support form and error states.
- RLS tests with separate supporter, creator, moderator and admin identities.
- Payment sandbox tests for valid/invalid signatures, duplicate webhooks, amount mismatch, retries, refund and reconciliation.
- Overlay tests for token revocation, unauthorized reads, reconnect and separation of test events.
- Upload/URL abuse tests for size/type limits, unsafe schemes and SSRF.
- Accessibility and mobile viewport checks.

## Reporting
Record commands and actual results in IMPLEMENTATION_STATUS.md. Never claim a check passed unless it was executed successfully in the target revision.
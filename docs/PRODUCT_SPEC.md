# Bagisawer Product Specification

## Vision
Bagisawer is an original Indonesian creator-support and livestream-interaction platform with tipping pages, creator/admin tools and OBS-compatible browser overlays. Use original branding, design and code; do not copy proprietary assets or implementations.

## Roles
Visitor; registered supporter; creator; moderator; staff; administrator. Roles and privileged operations must be validated server-side, never trusted from browser-supplied profile fields.

## Core journeys
1. Visitor discovers a creator, chooses an amount, optionally supplies name/message or anonymity, then checks out using a configured provider.
2. Server creates a pending transaction. Only a verified provider webhook confirms payment. Processing is idempotent and creates ledger entries plus eligible alert events.
3. Creator configures profile, theme, goals and alerts; reviews transactions and requests payout subject to policy.
4. Creator configures a private, revocable overlay token and installs an OBS browser source. Test events are distinct from production payment events.
5. Moderators/admins review reports and operations with explicit permissions and audit trails.

## Functional scope
The complete inventory is in FEATURE_MATRIX.md: public pages; authentication/RBAC; creator pages; payments/ledger/payouts; dashboards/admin; alertbox/overlays; mediashare, voicenote, subathon, leaderboard, milestones, running text, QR, soundboard, polling, Bagpao, Gachaton, Bidcoin, song request, VIP queue, competitions/clips, store, notifications, integrations and support.

## Product principles
- Indonesian-first UX and IDR formatting where appropriate.
- Charcoal/violet design, light/dark preferences, responsive layouts and accessible focus/contrast.
- Explicit loading, empty, success and error states; no decorative nonfunctional controls.
- Demo/sandbox data clearly labelled and isolated from production.
- Honor anonymity and minimize personal/financial data.
- Document every feature's status and external blockers.

## Financial invariants
- Browser success redirects are not proof of payment.
- Match provider reference, amount and currency against server records.
- Verify webhook signatures and deduplicate event IDs.
- Balances derive from a consistent, auditable ledger; clients cannot write balances.
- Available and held funds are distinct.
- Refunds/reversals use compensating ledger entries.
- Sandbox is not real payment. Production collection and payouts remain disabled until provider approval, credentials and end-to-end tests are complete.

## Privacy and moderation
Anonymous support must not reveal identity in feeds, overlays, rankings or exports. Creators cannot access each other's private data. Messages/media require limits, rate limiting, moderation and safe rendering. Protect URL fetches against SSRF and unsafe schemes. Define retention/deletion rules before launch.

## Non-functional requirements
Next.js App Router, React, strict TypeScript, PostgreSQL constraints/indexes, migrations in Git, RLS on exposed tables, server-side validation, safe headers and no secrets in client bundles. Tests cover access boundaries, payment idempotency and core flows. Deploy via GitHub/Vercel with secrets configured outside Git.

## Acceptance
A feature is complete only when UI, backend, schema/migration, authorization, error handling, tests and docs exist. External integrations stay blocked until credentials, approvals and end-to-end verification are recorded.
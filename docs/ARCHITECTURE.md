# Bagisawer Architecture

## Runtime topology
- Next.js App Router + React + strict TypeScript: public pages, creator dashboard, admin, route handlers and browser overlays.
- Vercel: hosting, preview and production deployments from GitHub.
- Supabase Auth: identity and sessions.
- Supabase PostgreSQL: normalized data, constraints, indexes, RLS and migrations.
- Supabase Storage: creator assets and moderated uploads; private buckets and short-lived signed URLs.
- Supabase Realtime: authorized low-latency alert/poll/queue updates; server/database remains authoritative.
- External adapters: payment, email, licensed media/song APIs and voucher suppliers. Disabled until credentials, permissions and tests exist.

## Route boundaries
Public: /, /explore, /features, /docs, /faq, /contact, /support, /terms, /privacy.
Creator page: /[username].
Auth: /login, /register, /forgot-password, /auth/callback.
Creator: /dashboard, /dashboard/transactions, /dashboard/payouts, /dashboard/profile, /dashboard/streaming, /dashboard/settings.
Admin: /admin/*; re-authorize every sensitive action on the server.
Overlay: /overlay/*; use opaque revocable tokens, minimal returned data and no payment secrets in URLs.

## Layering
1. UI: accessible presentation only; no trusted financial logic.
2. Feature modules: typed schemas and domain operations.
3. Server services: authentication, authorization, rate limits and business logic.
4. Adapters: Supabase, payment provider, email and external APIs.
5. PostgreSQL: constraints, RLS and durable records.
Keep provider-specific implementations behind interfaces. Never expose service-role keys or provider secrets to clients.

## Payment flow
1. Validate request on server and create pending donation/payment with unique reference.
2. Create checkout through configured provider adapter.
3. Verify webhook signature against raw body; validate reference, amount and currency; deduplicate event ID.
4. Confirm payment once, append ledger entries and enqueue eligible alert events.
5. Refund/dispute/payout actions require authorized server workflows and compensating ledger entries.
6. Client reads server-confirmed status only.

## Data design
Use UUID primary keys, foreign keys, explicit status constraints, timestamps, indexes for owner/lookups and unique provider references/webhook IDs. Ledger is append-only. Store currency and integer minor units (IDR whole rupiah may use integer rupiah); timestamps are UTC.

Table families introduced by reviewed migrations as features land:
- Identity: profiles, user_roles, creator_settings, creator_themes.
- Finance: donations, payment_transactions, payment_webhook_events, financial_ledger, creator_balances, withdrawal_requests, refund_records.
- Goals/alerts: donation_goals, donation_milestones, alert_configurations, alert_events, overlay_tokens.
- Interaction: media_submissions, media_moderation, voicenotes, leaderboard_snapshots, subathon_sessions, polling_sessions, polling_votes, soundboard_items, song_requests, vip_queue_items, interactive_game_sessions.
- Ecosystem: store_products, store_orders, store_deliveries, notifications, support_tickets, moderation_reports, audit_logs, platform_settings, integration_settings.

## Security
Default-deny RLS for all exposed tables. Scope policies to auth.uid() and protected role membership. Admin/staff roles are server-validated and cannot be granted through editable profile metadata. Use server-only service role only when necessary. Validate inputs, limit request and upload size, sanitize output, allowlist URLs, use private storage, set CSP/frame/content-type/referrer headers, rotate overlay tokens, and audit role/refund/payout/admin changes. Never log secrets or unnecessary payment/personal data.

## Deployment and open decisions
Commit .env.example with variable names only. Store secrets in Vercel/Supabase settings, never Git. Run lint, typecheck, tests and production build before release. Apply schema changes through committed migrations; avoid destructive production changes without explicit approval. Payment provider, email provider, licensed song/media provider, voucher supplier and Bagpao behavior require research, credentials and acceptance tests. Until then adapters remain disabled or explicitly simulated.
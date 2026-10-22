# Bagisawer Feature Matrix

Statuses: Direncanakan, Sedang dikerjakan, Diimplementasikan, Sudah diuji, Siap produksi, Terblokir integrasi eksternal. A page existing is not proof of production readiness.

| Area | Scope | Initial status / gate |
|---|---|---|
| Public site | Home, explore, features, creator profile, docs, FAQ, contact, support, terms, privacy, refund, fees, status | Sedang dikerjakan; landing and public creator profile route implemented, broader pages and accessibility testing remain |
| Identity & roles | Registration, login/logout, email verification, reset, sessions, unique username, onboarding, RBAC, moderator, optional MFA | Sedang dikerjakan; Supabase Auth forms and session-gated dashboard exist; email flow, reset and role tests remain |
| Creator tipping | Creator page, themes, suggested/custom amount, anonymous support, message, optional media/voice, goals, QR/share, privacy controls | Direncanakan; validation, spam controls, moderation |
| Payments & finance | Checkout, statuses, provider adapter, signed webhook, idempotency, ledger, balances/holds, fees, withdrawals, refunds, disputes, reconciliation | Sandbox-only test panel, server-generated references, idempotent simulated event processor, balanced append-only test ledger, and test alert queue implemented; external provider and signed webhook remain blocked pending provider selection and credentials |
| Creator dashboard | Overview, charts, transaction history/filter/search, balances, payouts, profile/theme, goals and stream settings | Sedang dikerjakan; profile editor and stream preferences are backed by Supabase; finance modules remain |
| Admin & moderation | Users, creators, roles, transactions, payouts, refunds, reports, media moderation, fees, products, support, audit, platform settings | Direncanakan; privileged server authorization |
| Alertbox & overlay | Alerts, sounds, animations, thresholds, queue, preview/test, OBS browser source, real-time, token rotate/revoke | Sedang dikerjakan; private token lifecycle, OBS page, and test queue implemented in code; end-to-end tests require a server-only Supabase secret in Vercel; live donation events, realtime recovery and sound remain |
| Mediashare / voicenote | Submission queue, URL/file validation, duration/size limits, moderation, play/skip | Direncanakan; SSRF and upload protections |
| Subathon | Timer, extension rules/cap, start/stop, event history | Direncanakan; server-authoritative clock |
| Leaderboard / goals / milestones | Daily/weekly/monthly/all-time ranking, targets, progress and milestones | Direncanakan; honor anonymity |
| Running text / QR / soundboard | Text style/speed/duration, profile QR, sounds/trigger/volume/limits | Direncanakan; no invented payment QR |
| Polling | Polls, options, deadlines, validated votes, real-time results, moderation | Direncanakan; server-side limits |
| Bagpao | Configurable module | Terblokir spesifikasi; research public behavior first |
| Gachaton | Random interaction, animation, outcome and history | Terblokir review; legal/security review if money/prizes involved |
| Bidcoin | Internal points, usage rules, history, limits | Direncanakan; not represented as real money/assets |
| BagiLagu/song request | Queue, moderation, creator settings, lawful playback | Terblokir integrasi eksternal; licensed/official API |
| VIP queue / competitions | Queue and policy priority; streamer competitions and clip submissions/results | Direncanakan; transparent moderation/scoring |
| Store / vouchers | Catalog, pricing, orders, inventory, delivery, refunds, reports | Terblokir integrasi eksternal; supplier API required |
| Integrations & notifications | YouTube/streaming events, email, in-app notifications, widget API | Terblokir integrasi eksternal pending credentials/scopes |
| Security | RLS, rate limiting, headers, validation, audit, secret rotation, incident response | Sedang dikerjakan; profile RLS and headers added; owner/anonymous/cross-user access tests and other controls remain |
| Delivery & docs | CI, lint, typecheck, tests, build, staging, product/schema/payment/security/deployment docs | Direncanakan; report actual results only |

## Delivery gates
1. Foundation: repository baseline, docs, Next.js scaffold, environment validation, Supabase boundaries.
2. Identity/profile: Auth, creator onboarding, profile routes, RLS and access tests.
3. Money: sandbox adapter, verified webhook, immutable ledger and reconciliation.
4. Streaming: overlay token lifecycle, authorized events and queue recovery.
5. Interactive modules: each module requires UI, server logic, schema, access rules, tests and docs.
6. Ecosystem: suppliers, notifications, moderation and analytics.
7. Launch: lint, typecheck, build, RLS/payment/security/load/e2e tests and staging sign-off.

Status upgrades require verified code and successful test output. A visual-only page is not a complete feature.
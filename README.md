# Bagisawer

Platform dukungan kreator dan interaksi livestream yang sedang dibangun secara bertahap.

## Stack
- Next.js App Router + React + TypeScript strict mode
- Supabase Auth and PostgreSQL
- Netlify is the intended preview/testing host; public production release is intentionally deferred.

## Repository
- GitHub: https://github.com/Ndraaa446/Bagisawer.my.id
- Feature inventory: [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md)
- Product specification: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Security plan: [docs/SECURITY.md](docs/SECURITY.md)
- Payment flow: [docs/PAYMENT_FLOW.md](docs/PAYMENT_FLOW.md)
- Implementation status: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)

## Local development
1. Install Node.js 22 LTS and npm.
2. Copy `.env.example` to `.env.local`.
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the Supabase project's public client settings.
4. Install dependencies with `npm install`.
5. Run `npm run dev` and open http://localhost:3000.

## Checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`

GitHub Actions and Netlify preview builds are configured to run these checks. Report actual output rather than assuming they passed.

## Preview and release safety
- Work on a feature/preview branch first; do not merge to `main` or publish a production release without explicit release approval.
- Netlify's intended role is preview/testing only until a substantial batch of changes is ready for review.
- Do not configure public production publishing as part of ordinary feature work. Verify the Netlify project's production branch and visitor access settings before enabling preview builds.
- Never commit `.env.local` or any secret.
- Never expose Supabase service-role or payment secrets to browser code or `NEXT_PUBLIC_*` variables.
- The landing page contains illustrative preview values, not real transactions.
- Payment, payouts, production overlays, store fulfillment and third-party integrations are not active until implemented, configured and tested.
- Privacy and terms pages are drafts and require legal review before launch.
- Database migrations and RLS policies must be reviewed and tested before production data is stored.

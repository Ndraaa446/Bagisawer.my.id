# Bagisawer

Platform dukungan kreator dan interaksi livestream yang sedang dibangun secara bertahap.

## Stack
- Next.js App Router + React + TypeScript strict mode
- Supabase Auth and PostgreSQL
- Vercel deployment connected to GitHub

## Repository
- GitHub: https://github.com/Ndraaa446/Bagisawer.my.id
- Feature inventory: [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md)
- Product specification: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Security plan: [docs/SECURITY.md](docs/SECURITY.md)
- Payment flow: [docs/PAYMENT_FLOW.md](docs/PAYMENT_FLOW.md)
- Implementation status: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)

## Local development
1. Install a supported Node.js LTS release and npm.
2. Copy `.env.example` to `.env.local`.
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using your Supabase project's public client settings.
4. Install dependencies with `npm install`.
5. Run `npm run dev` and open http://localhost:3000.

## Checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Run checks in a local or CI environment and report their actual output. No build result is implied by this README.

## Security and release notes
- Do not commit `.env.local` or any secret.
- Never expose Supabase service-role or payment secrets to browser code.
- The landing page contains illustrative preview values, not real transactions.
- Authentication pages require a configured Supabase project and Auth settings.
- Payment, payouts, production overlays, store fulfillment and third-party integrations are not active until implemented, configured and tested.
- Privacy and terms pages are drafts and require legal review before launch.
- Database migrations and RLS policies must be reviewed and tested before production data is stored.
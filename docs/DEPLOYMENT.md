# Deployment Runbook — Preview First

## Current release policy
- Netlify is the intended preview/testing host.
- Do not publish a public production release during normal development.
- Keep work on a feature/preview branch and collect substantial related changes before requesting release review.
- Do not merge to `main`, change the production branch, or publish production without explicit approval.
- Vercel is out of scope for current work; do not trigger Vercel deployments.

## Netlify preview setup
1. Connect GitHub repository `Ndraaa446/Bagisawer.my.id` to the intended Netlify site.
2. Confirm the production branch remains `main`; feature branches and pull requests should be used for preview builds.
3. Before any preview is shared, verify the site's visitor-access settings and protect previews if the URL must not be publicly viewable.
4. Set the required environment variables in Netlify site settings, not in Git:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` for preview/branch contexts
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` as a server-only secret, scoped to preview contexts only unless production use is explicitly approved.
5. Confirm the public Supabase variables are available in the **build** scope for Deploy Preview and branch deploy contexts. The app's Supabase client throws when the URL or publishable key is missing.
6. Never expose service-role/secret keys through `NEXT_PUBLIC_*` variables, logs, screenshots, or repository files.
7. Run install, lint, typecheck and production build checks. Netlify's configured build command runs lint, typecheck and build in sequence.
8. Inspect the Netlify build log after each failed preview; verify the exact commit SHA and preview URL before browser testing.

## Test gates before release
1. Apply reviewed database migrations to a non-production environment first where possible; verify RLS and a forward-fix plan.
2. Test public pages, responsive UI, dashboard access and error states.
3. Test OBS token create/rotate/revoke and confirm revoked tokens are rejected.
4. Test sandbox payment create, simulated success, duplicate-event replay, ledger balance and test-alert delivery. These are simulations only.
5. Keep payment/payout features disabled until a provider is selected and signed webhook, replay protection, reconciliation and security tests pass.
6. Do not treat registration, login, email verification or password recovery as verified; those end-to-end checks are deferred.
7. Record test output, commit SHA and preview URL in the implementation status document.
8. Only after a substantial batch passes review should a public release be proposed. Require explicit approval before publishing.

A connected GitHub repository or a successful preview build does not by itself prove production readiness.

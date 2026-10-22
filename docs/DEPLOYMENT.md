# Deployment Runbook

1. Connect GitHub repository `Ndraaa446/Bagisawer.my.id` to the Vercel project.
2. Confirm the framework is Next.js and the production branch is intentional.
3. Add environment variables in Vercel Project Settings for Preview and Production separately.
4. Never add service-role or payment secrets to Git or browser-visible environment variables.
5. Run install, lint, typecheck and production build before promoting.
6. Apply reviewed database migrations in staging first; verify RLS and rollback/forward-fix plan.
7. Inspect Vercel build logs, runtime logs and health after deployment.
8. Keep payment/payout features disabled until provider approvals, webhook verification and reconciliation tests pass.
9. Verify public pages, responsive UI, auth/session behavior and error states.
10. Promote to production only after sign-off; document deployment URL, commit SHA and test output.

A connected Vercel project does not by itself prove that a deployment succeeded.
# Environment Variables

See root .env.example for the variable-name template. Do not commit real credentials.

| Variable | Scope | Purpose | Required now |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Browser/server | Supabase project URL | Only when enabling Supabase-backed routes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Browser/server | Publishable/legacy anon key | Only when enabling Supabase-backed routes |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Privileged server tasks where justified | No; keep unset until necessary |
| PAYMENT_PROVIDER | Server only | Selected provider adapter name | No; payments disabled |
| PAYMENT_API_KEY | Server only | Provider API credential | No; payments disabled |
| PAYMENT_WEBHOOK_SECRET | Server only | Webhook signature verification | No; payments disabled |
| NEXT_PUBLIC_APP_URL | Public | Canonical application origin | Set per environment |

Do not expose secrets via NEXT_PUBLIC_. Configure production values in Vercel/Supabase settings, rotate any accidentally exposed credential, and use separate sandbox and production credentials.
# Payment Flow

## Current status
No external payment provider is configured. An isolated Bagisawer sandbox foundation exists for simulated donations, idempotent test events, balanced append-only test ledger entries, and test-labeled OBS alerts. It does not contact a bank/e-wallet, prove an actual payment, or change production balances. Payment acceptance and payouts must remain disabled until a provider is selected, credentials and approvals are present, and provider sandbox tests pass.

## Required flow
1. Validate creator, amount, currency, limits and request rate on the server.
2. Create a pending donation and payment transaction with a unique internal reference.
3. Request checkout from a provider adapter; store the provider reference and expected amount/currency.
4. On webhook, verify signature over the raw body, timestamp/replay policy, provider event ID, reference, amount and currency.
5. Process event idempotently in a database transaction. Duplicate delivery must not duplicate ledger entries or alerts.
6. Confirm status from server-side provider evidence, append balanced ledger entries, and enqueue an eligible alert event.
7. Refunds/disputes append compensating entries and retain audit history.
8. Payouts require authenticated creator ownership, eligibility checks, limits, approval policy and reconciliation.

Never treat a browser return URL as proof of payment. Do not store card credentials or provider secrets in the browser. Simulated events must be labelled as test and must not alter production balances.
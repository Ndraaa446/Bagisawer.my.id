# Netlify public preview test checklist

This document is for validating the BAGISAWER deploy preview only. Do not use production credentials or real payment data.

## Preview URL
- https://deploy-preview-1--bagisawe.netlify.app

## Overlay smoke test
1. Sign in using a QA account on the preview site.
2. Open the creator streaming/overlay settings page.
3. Create an overlay URL for one feature (start with `saweran`).
4. Open the generated URL in a separate browser tab. The URL contains a secret token; do not post it publicly or commit it.
5. Use the feature's test-alert action.
6. Confirm the alert appears on the matching overlay, then disappears/gets acknowledged.
7. Repeat with one other feature (for example `polling`) and confirm it does not consume the `saweran` event.
8. Revoke the token and confirm the old URL returns HTTP 404.
9. Check the browser Network panel for GET/POST responses and note any 4xx/5xx errors.

## Sandbox payment smoke test
1. Use the payment sandbox page only.
2. Create a small sandbox transaction and use its simulate-success action.
3. Confirm the UI clearly labels the result as a simulation and no real payment method is used.
4. Do not use a real provider webhook or production payment credentials.

## Safety boundary
- The preview is for QA only.
- Do not connect production database credentials or run production migrations.
- Overlay URLs are bearer secrets: keep them private and revoke them after testing.
- A successful deploy is not by itself proof that browser, OBS, or payment flows work end-to-end.

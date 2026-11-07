# Backend security and booking reliability: first implementation

This branch is intended for coordinated review with the frontend booking-receipt change. It has not been deployed to production.

## Changes

- Customer single-booking reads include the authenticated owner's email in the database query. Flight ticket/provider details require either a verified owner session or a signed, booking-specific receipt token. Public Firm/API-key headers do not grant ticket access.
- New guest flight reservations return `booking_access_token`, signed for audience `borderless-booking-receipt` and valid for one day. The companion frontend stores it in session storage and attaches it as an Authorization bearer token on ticket-detail requests. It is not placed in URLs. Storage-disabled guests must sign in as the booking owner to retrieve details.
- Browser payment amount/time are not financial authority. Paystack verification must confirm success, exact reference, stored amount (minor units), currency, booking-reference metadata and customer email before local recording. Existing bookings without currency use NGN, matching the current frontend checkout. Other currencies require explicit stored currency and matching checkout configuration.
- Receipt claims use MongoDB's unique `_id` index. Payment, booking, sale, host earning and host balance changes use a single transaction. Repeating the same successful payment is idempotent; a reference cannot pay a different booking. Legacy partial financial records are rejected for reconciliation rather than silently repaired.
- `POST /api/v1/website/paystack-webhook` verifies raw-body signatures and uses the same verified recording service. It can record a successful charge when the browser callback is lost. Configure this URL in the existing Paystack account only after validation. Unknown unrelated charge events are acknowledged without changing records. Email delivery from webhook-only completion is not implemented; a transactional notification outbox remains follow-up work.
- Dedicated Paystack signing secrets use `PAYSTACK_WEBHOOK_SECRET` (and optional `PAYSTACK_WEBHOOK_PREVIOUS_SECRET` for rotation), the `Paystack-Signature` header, HMAC-SHA512 and a five-minute timestamp window. When no dedicated secret is configured, existing accounts use `PAYSTACK_SECRET` and legacy `x-paystack-signature`. Once a dedicated signing secret is configured, legacy signatures cannot downgrade verification.
- Tiqwa callbacks are treated as untrusted hints. Status is fetched server-side from Tiqwa and its booking reference is matched before applying an allowed update. Late notifications cannot downgrade issued/cancelled tickets. This verifies the authoritative data; it does not claim cryptographic authentication of the incoming callback. Obtain Tiqwa's supported signing/shared-secret contract before adding incoming authentication or IP restrictions.
- Website flight creation persists a deterministic attempt before the provider POST. Uncertain attempts are not automatically retried. A confirmed provider reference/result is saved before local booking/sale writes; those local records and attempt completion commit atomically. A local write failure can resume without creating another provider reservation. Airport-catalogue retrieval is no longer required to save a provider booking; city labels initially use airport codes.
- The client-controlled `admin` query parameter cannot mark a reservation paid.
- Public customer/host/waitlist directory routes require admin authentication. Profile updates allow only contact fields; notification preferences cannot overwrite account security fields; review updates require ownership. Authentication logs no longer print tokens/session records/OTPs in the changed paths. API responses default to private, no-store. Async Express 4 handler errors reach the global error middleware, and session issuance fails when persistence fails.

## Deployment prerequisites

1. MongoDB must support transactions (replica set or supported sharded deployment). Standalone MongoDB is unsupported; financial writes fail closed. Confirm the production topology and database permissions before rollout.
2. Use the existing `PAYSTACK_SECRET`, `JWT_USER_SECRET_KEY`, `TIQWA_FLIGHT_API`, and `TIQWA_BEARER_TOKEN` from the production secret store. No bulk secret download is required. Never embed these in the browser.
3. Install the frontend receipt compatibility change first. The old backend simply omits the receipt field; the new backend denies reference-only ticket access. Guest confirmation tabs created before rollout may need owner login. Do not deploy the backend change alone.
   The `/flight/flight-ticket-details/:booking_reference` alias is explicitly labelled Manilla in the production router. Keep this branch out of production until the partner's ticket-access contract has been verified and migrated to a scoped service credential or signed receipt. The current public Firm/API-key contract is insufficient for passenger/ticket access; do not solve compatibility by making customer details public again.
4. Test in provider sandbox/staging: guest reservation/confirmation, signed-in owner retrieval, payment success/failure/retry, webhook delivery, and browser interruption. Production providers were mocked in local tests; these are not live payment or ticketing validations.
5. Monitor 4xx/5xx payment responses and `BookingAttempt` records with state `provider_pending` or `provider_confirmed`. A pending/uncertain attempt needs support-led provider reconciliation; never delete it merely to retry the POST. An operator recovery tool and scheduled reconciliation remain to be built.
6. Existing legacy payment/booking inconsistencies and duplicate provider references need a separately reviewed read-only audit/migration. This branch does not modify historical production data or build a unique index over it.

## Validation

`npm test` runs security regressions with controlled dependencies. `npm run test:integration` starts an isolated loopback MongoDB replica set, verifies real transaction rollback/concurrency/recovery, and exercises authenticated HTTP ownership/profile restrictions. It never uses production `DB_URI` and providers are mocked. The first run downloads an official MongoDB binary. `npm run build` checks the Next.js production build.

## Remaining scope

This is a first security tranche, not a platform-wide security certification. Follow-up includes the legacy third-party booking path, host/admin endpoint audit, distributed request throttling, payment initiation and reconciliation tooling, cancellation/refund lifecycle, session/credential rotation, and a durable notification outbox. Do not auto-retry provider booking POSTs.

Provider references: https://paystack.com/docs/api/transaction/ and https://paystack.com/docs/payments/webhooks/.

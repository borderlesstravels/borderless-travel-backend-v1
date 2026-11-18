# Travel on Credit — current local integration

Updated 13 November 2026. Nothing pushed, deployed or registered with GoTrip. Real applications, bank transactions and ticket purchases were not exercised.

## Confirmed partner contract

- Use the supplied `loan.approved` payload; do not wait for a new payload shape or require narration.
- The supplied top-level `reference` is retained as `providerTransactionReference` for correlation. In the sample it is the same value as `data.loan.reference`. It is an opaque provider identifier, not independently verified bank evidence.
- Amounts are naira with optional kobo decimals: `10000.50` means NGN 10,000.50. Exact internal minor units are stored as decimal strings (`1000050`), without floating-point amount comparisons.
- GoTrip collects the borrower's 30%, combines it with the lender's 70%, and sends the full amount to Borderless. Borderless does not collect a second contribution or make the lending decision.
- Customers enter their requested amount. No merchant booking reference or amount is passed to GoTrip in this pilot.
- No narration or additional settlement event is required. The supplied approval's reported `amount_disbursed` does not independently prove money arrived in Borderless's bank account.
- There is no lender sandbox. Any eventual low-value real test must be coordinated with the partner and separately authorized.

This supersedes earlier notes asking for a different disbursement payload, narration, amount units or clarification of who collects the contribution. Those questions are resolved.

## Available local implementation

Authenticated customers save unreserved flight contexts. The GoTrip modal uses `https://l.lsq.li/rNJ`, with no identity/amount/reference appended. It opens only after acknowledgment and successful context save. Closing or browser messages cannot set funding or ticket status. Customer history and resume reads are owner scoped. No passenger documents are stored in credit contexts.

Webhook verification uses exact raw bytes, HMAC-SHA256, a five-minute signed timestamp tolerance and constant-time comparison. Requests are limited to 256KB uncompressed JSON. Durable unique provider idempotency keys deduplicate deliveries; conflicting payloads are not silently overwritten. Slow writes return a retryable status and may finish later; retry still produces one receipt. Next.js credit-webhook connection deadline is four seconds; receipt write deadline is 2.5 seconds; duplicate lookup deadline is 750ms. Deployed network/cold-start response timing against the provider's eight-second limit remains unverified.

Both old flat and supplied nested loan/customer structures are accepted. Contradictory references/statuses/currencies or invalid money values require review. Currency, provider status and reported amounts are retained minimally; private form_data, identity documents, interest schedules and raw request bodies are not stored.

The single existing admin role can review receipts/contexts, match a loan to a customer selection, and record a bank review. Matching and bank review are separate immutable audit records. No email-only automatic customer match is used. Customer responses exclude staff reasons, bank references and provider contact details.

## Routes

All routes are disabled unless `GOTRIP_ENABLED=true`. Customer access uses `u-x-key`; staff access uses the existing admin session `a-x-key`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/credit/webhook` | Signature + provider `x-idempotency-key`; durable event receipt |
| POST | `/api/v1/credit/intents` | Customer + request idempotency key; save `flightId` and route context |
| GET | `/api/v1/credit/intents` | Owned selections, history, funding/fare review state; optional exact `flightId` filter |
| GET | `/api/v1/credit/review` | Staff review, owner contacts, funding/fare audit records; optional exact `loanReference` filter |
| POST | `/api/v1/credit/review/link` | `intentId`, `loanReference`, review reason; staff identity/time recorded |
| POST | `/api/v1/credit/review/funding` | Audited bank review after matched, consistent approved application |
| POST | `/api/v1/credit/review/recheck-fare` | Staff-only, read-only Tiqwa price confirmation after bank review |
| POST | `/api/v1/credit/intents/:id/book` | Owning customer + firm API key + validated travellers; recoverable reservation then credit allocation |
| POST | `/api/v1/credit/intents/:id/allocate` | Owning customer; retry allocation to an existing matching reservation |

The webhook path is implemented locally, not a registered live endpoint. No vendor message was sent.

### Bank review

`POST /review/funding` takes `intentId`, `bankReference`, `amountNaira`, `currency: "NGN"`, `receivedAt`, `bankReceiptChecked: true` and a review `reason` of 10–500 characters.

The bank reference is evidence from the staff member's bank check, not a new required GoTrip field. No narration is accepted or required. It may be the same identifier shown by the provider if that is how it appears on the bank credit. The received amount must match the entire approved amount, not only 70%; conflicting reported amounts, shortages or excesses require investigation. Staff must check the actual bank credit before recording this acknowledgment. There is no bank API verification in this phase.

Intent, provider reference and bank reference are independently unique. Exact retries return the same record. Different evidence cannot overwrite an existing review or allocate the same bank transaction to another selection. The response/customer status is `bank_review_recorded`, not a fabricated Paystack receipt.

### Tiqwa preflight

`POST /review/recheck-fare` takes `intentId`. It requires matched approval, staff bank review and an available customer account. It only calls the existing Tiqwa `GET /flight/confirm_price/:flightId` endpoint. No provider booking/pay/issue endpoint is invoked.

The quote must match the selection ID and NGN currency. Exact comparison returns `matched`, `shortfall` or `surplus`. The audit check is considered stale after five minutes; this is an internal freshness limit, not a Tiqwa fare hold. Failed/unavailable/mismatched quotes append an unsuccessful audit result so older successful checks do not remain the latest state. No refund or extra payment is automatically created.

## Funding-to-booking accounting bridge

Implemented locally after the partner-contract update. `GOTRIP_ACCOUNTING_ENABLED=true` is separately required for reservation/allocation; default is off. No environment files were changed.

The authenticated customer submits the existing traveller/contact structure through `/intents/:id/book`. The route verifies the firm key and uses the existing flight-booking validator. The selection must belong to the signed-in customer; the contact email must match that account. Reviewed bank funds and the latest fresh matched NGN fare are required before the provider reservation. The offer is loaded from the saved intent, never supplied by the caller.

`CreditReservation` uses the intent's unique built-in ID and a canonical firm/offer/traveller hash. Different details cannot start another reservation for the same intent. The existing durable BookingAttempt handles provider timeouts and local-write recovery. The successful booking reference is retained before accounting. A retry returns/reconciles that reservation; it does not automatically repeat uncertain provider POSTs. Existing allocated bookings are resumed without creating another reservation.

New bookings retain `source_offer_id` so the bridge can prove the reservation came from the selected offer. Legacy bookings without that provenance cannot be allocated automatically. Allocations require an active future booking, the same owner/contact/firm/offer, exact NGN price, consistent signed approval and bank-review amount, and a balanced pending sale. Shortfall, surplus, failed/stale fare checks and inconsistent records remain blocked; no automatic top-up, refund, cancellation or loan adjustment is performed.

One MongoDB transaction commits CreditAllocation, a namespaced PaymentReceipt, a `funding_source: gotrip` Payment, booking `payment_status: paid` and sale completion. Source receipt/amount fields come from reviewed server records, not the request. Profit and provider cost must balance the total exactly in minor units. A partial failure rolls the whole accounting transaction back. Intent, funding and booking allocation uniqueness plus the deterministic funding-based allocation ID prevent double spending. Credit receipts use the `gotrip` namespace and never pretend to be Paystack charges.

`/intents/:id/allocate` retries only the existing reservation allocation. It requires the owning customer; it cannot create another provider booking or payment source. My Trips exposes the linked booking and a recovery action without exposing bank evidence. Staff review includes allocation/reservation audit records.

## Ticketing source verification

Real credit ticketing additionally requires `GOTRIP_TICKETING_ENABLED=true`; default remains off. An accounting commit never calls provider pay or issue. The existing staff ticketing endpoint is still an explicit separate action.

Paystack-funded bookings retain server-side Paystack verification. GoTrip-funded bookings instead revalidate the immutable allocation, receipt, bank-review and approval chain, account ownership, amount/currency, contact and source offer. Missing/tampered/ambiguous payment records cannot reach provider payment. Provider reservation amount/currency must still match the paid booking. The existing TicketIssueAttempt recovery guard prevents a second provider pay POST; only a provider-confirmed issued status changes the local ticket state. Tests exercise this branch with fake providers; no actual ticket was purchased.

Customer state now separates bank review, credit allocated/ticket pending, provider-confirmed issued and cancelled. A cancellation does not imply a refund. Customer credit checkout uses the reviewed-credit route and does not open Paystack again. Funded/allocated selections link to resume or view their booking instead of restarting GoTrip.

## Remaining operational work

1. Authorized deployment, Mongo replica-set/transaction and index provisioning (seven credit models), GoTrip endpoint registration/signing secret and coordinated low-value live verification. No different payload or narration is awaited.
2. Live Tiqwa reservation/price/status behavior, lender iframe/liveness and end-to-end banking evidence verification remain unverified. Current bank review is an explicit staff check, not a bank API integration.
3. Fare differences, unavailable flights and surplus funds require agreed staff/customer resolution; they are intentionally prevented from automatic allocation or ticketing.
4. Staff operational UI remains paused under the earlier instruction. Staff can use the protected review APIs; no admin frontend changes were made.

## Configuration and privacy

Backend flags/secret: `GOTRIP_ENABLED`, server-only `GOTRIP_WEBHOOK_SECRET`, `GOTRIP_ACCOUNTING_ENABLED` and `GOTRIP_TICKETING_ENABLED`. Real frontend application controls: `NEXT_PUBLIC_GOTRIP_ENABLED=true` at build time. All default off. Accounting and ticketing are separate operational gates, not automatic consequences of enabling application intake. Never expose the signing secret to the browser. No environment files were changed.

The existing local simulation uses `NEXT_PUBLIC_CREDIT_DEMO=true`, development mode and `E2E_TEST_MODE=true`. It is separate from real funding records and cannot operate in production. It now proceeds from the supplied approval update directly to simulated bank review, without requiring a separate disbursement webhook. Its ticket issuance is illustrative only.

Define retention, receipt-conflict investigation and audited correction processes before enabling production. Link/funding history cannot be silently edited through these APIs.

## Verification

109 backend tests passed: 40 existing security tests, 45 transaction/HTTP regressions, eight GoTrip unit tests, fourteen GoTrip HTTP integration tests and two deadline tests. All databases were ephemeral and all Tiqwa responses in credit tests were stubbed. Tests cover decimal-kobo amounts, no narration, ownership/role isolation, duplicate allocation, timeouts/retries, customer privacy, quote mismatch/expiry/availability and zero booking/payment creation. Thirteen focused frontend tests and source TypeScript checks also passed. Build and browser results for this continuation are recorded after completion.

Both final Next.js production builds passed after this contract update (backend: four static pages; frontend: 54), including lint/type validation. Customer production build used disabled real/review controls and an unreachable local API base. No deployment occurred.

## Accounting bridge verification

The existing 109 backend checks and 20 dedicated credit-accounting replica-set/HTTP checks passed (129 unique backend tests across the runs). Dedicated checks cover concurrent allocation, cross-booking reuse, ownership/contact/offer/amount/currency validation, departed/cancelled bookings, stale quotes, unbalanced or completed sales, transactional rollback, reservation recovery, receipt tampering, enabled-source ticketing with fake providers, disabled ticket gates and the actual customer booking HTTP endpoint with firm/session/traveller validation. The source-issued path performed at most one fake provider pay request; no real provider, Paystack charge or production database was used.

Both final builds passed with lint/type checks (customer: 54 static pages; backend: four). The earlier full regression run passed 126 tests; the subsequently extended accounting suite passed all 20 focused tests. Thirteen focused frontend tests passed. New accounting/ticketing flags remain unset in environment files and real GoTrip launch stays disabled in the local preview. Browser review of the updated simulation is recorded separately in the customer UI notes.


## Staff review and release preparation

The admin workspace now includes Travel on Credit customer matching, confirmed bank review, read-only fare recheck, linked-booking navigation and append-only staff notes. `POST /api/v1/credit/review/notes` requires an admin session, intent ID, approved note category and 10-500 character reason. It does not alter funding, booking or ticket state. `GET /api/v1/credit/review` supports cursor pagination and exact loanReference lookup, includes the linked application history and reports the current financial feature gates. See [the local release runbook](release/TRAVEL_ON_CREDIT_RELEASE.md) for index review, secure configuration, phased activation, operating procedure and rollback. No deployment or live provider test has been performed.

## Temporary raw webhook capture

Raw webhook bodies are not normally retained. For a one-off payload comparison, set `GOTRIP_RAW_CAPTURE_REFERENCE` to `*`, `GOTRIP_RAW_CAPTURE_UNTIL` to an ISO timestamp 24 hours ahead, and `GOTRIP_RAW_CAPTURE_KEY` to a randomly generated 32-byte key encoded as base64. During that window, the receiver encrypts every signature-verified GoTrip event with AES-256-GCM and stores it in `creditpayloadarchives` with a 24-hour TTL. Never enable capture without the key and end time. Capture stops automatically at the configured end time. Apply the TTL index from the credit index manifest first.

Retrieve an unexpired capture locally with `npm.cmd run inspect:credit-payload -- <loan-reference> [event]`. The tool asks for the MongoDB URI and capture key with masked terminal input, then requires an explicit `SHOW` confirmation before printing personal data. Do not copy payloads into logs or ordinary chat. Remove both Vercel environment variables and redeploy once the payload has been retrieved. MongoDB TTL cleanup is asynchronous.

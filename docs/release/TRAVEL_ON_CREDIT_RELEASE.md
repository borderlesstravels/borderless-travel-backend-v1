# Travel on Credit release runbook

Status: local release preparation only. No deployment, provider registration, production database/index changes or real financial test has been performed by these steps.

## Release controls

Backend flags must be explicit. Start with GOTRIP_ENABLED=false, GOTRIP_ACCOUNTING_ENABLED=false and GOTRIP_TICKETING_ENABLED=false. The reference template is backend.env.example. The offline checker does not read .env files, print secret values, contact services or verify production connectivity:

    node scripts/check-credit-release.js --phase=disabled

Run it with the intended environment injected securely by the release operator. It deliberately fails on missing/ambiguous flags. Later phases are intake, accounting and ticketing; each requires its preceding gates. A passing result is configuration evidence only.

Customer build: NEXT_PUBLIC_GOTRIP_ENABLED=false; NEXT_PUBLIC_CREDIT_DEMO=false; E2E_TEST_MODE=false. Enable the SDK only for the coordinated pilot. SDK product URL is https://l.lsq.li/rNJ. Admin build: VITE_API_BASE_URL points to the authorized Borderless API; preserve its existing firm/API configuration. Never use the local test API for a release.

## Before any authorized release

1. Review the local changes across backend, customer app and admin app together; preserve existing security fixes. Run the tests and builds below.
2. Take and independently verify a recoverable database backup through the database operator. Confirm MongoDB transaction support (replica set), access permissions and capacity. These are external gates, not proved by local ephemeral MongoDB tests.
3. Review CREDIT_INDEX_MANIFEST.json, produced offline by node scripts/credit-index-manifest.js. Inspect existing indexes and duplicates on the target database before creating any index through the approved migration process. Do not use syncIndexes, drop collections, delete duplicates automatically or import the app bootstrap to migrate data. Verify unique intent, event key, loan link, bank/provider reference, allocation, reservation and receipt constraints. CreditReviewNote adds an intent lookup index. No live indexes have been applied here.
4. Supply the GoTrip webhook secret through secure configuration, never a committed file. Intended endpoint: POST https://api.borderless.travel/api/v1/credit/webhook. Verify the deployed path before sharing it with GoTrip for registration. Do not represent this URL as registered or tested yet.
5. Coordinate the low-value test with GoTrip using the team's own details. No separate sandbox exists. Confirm the intended bank account and operating staff. The run must demonstrate valid signature acceptance, replay protection, application matching, the actual full bank receipt, fare recheck, one reservation, balanced allocation and one ticket. Local stubs do not prove those live steps.
6. Agree how the team handles fare increases, surplus funds, unavailable flights and unmatched customers. Default behavior is a hold with a staff note/contact; there is no automated top-up, refund or loan cancellation. Confirm monitoring, support ownership and escalation before enabling financial gates.

## Staged activation after separate authorization

Deploy disabled first. Verify existing sign-in, flight and Paystack paths, staff authentication and disabled credit routes. Then permit intake only (GOTRIP_ENABLED=true, accounting/ticketing false), verify signed webhook deliveries and the staff queue. Enable the customer SDK only for the coordinated test. After actual bank reconciliation succeeds, separately authorize accounting and then ticketing. Run the offline checker for the corresponding phase before each change. Do not toggle a stage simply because the local checks pass.

## Staff procedure

Use Travel on Credit in the admin workspace. Search by customer/route or exact provider reference; older selections have a paginated queue. Check customer identity before making the immutable loan link. Similar names/emails alone are insufficient.

Check the actual bank credit and enter its unique bank reference, NGN amount, receipt time and review reason. GoTrip collects the borrower's 30% plus lender funding and sends the full total to Borderless. Do not charge an additional contribution. The confirmed payload uses naira with kobo decimals and the transaction reference; narration is not expected. Approval or amount_disbursed in a webhook is not independent bank evidence.

Recheck the flight price. A quote is fresh for at most five minutes and is not a reservation or fare guarantee. Hold shortfalls, surplus and unavailable offers for resolution. The customer resumes checkout for traveller details; staff notes do not unlock allocation. Review the linked booking separately; allocation is not ticket issuance. The ticketing backend checks the accounting chain and its separate feature gate.

All staff actions require the existing admin session. Customer identity matching and bank records are immutable. Notes are append-only and record staff identity/time; notes never move money or issue tickets. Do not overwrite evidence to resolve a mismatch.

## Verification commands

Backend:

    node --test tests/security.test.js tests/gotrip.test.js tests/request-deadline.test.js tests/credit-release.test.js
    npm.cmd run test:integration
    npm.cmd run build

Admin:

    node --experimental-strip-types --test tests/admin-login.test.mjs tests/credit-review.test.mjs
    npm.cmd run build

For local browser review only, run tests/local-auth-api.mjs with CREDIT_REVIEW_DEMO=true and serve Vite on 127.0.0.1:5173 with VITE_API_BASE_URL=http://127.0.0.1:4201 and dummy firm/API keys. Local account: admin@example.test / local-test-password / code 1234. All credit actions use in-memory fake records. The fixture is not imported by the application bundle. Stop/restart the API to reset the data.

## Rollback and recovery

Disable the customer SDK and GOTRIP_ACCOUNTING_ENABLED/GOTRIP_TICKETING_ENABLED first to stop new financial actions. Keep authenticated intake running only if webhook storage remains trustworthy; otherwise disable GOTRIP_ENABLED and coordinate provider retries. Preserve events, matches, bank evidence, allocation records and ticket attempts. Never delete an uncertain reservation/ticket attempt and blindly retry it. Inspect the provider state and bank evidence before deciding a recovery action. Already allocated funds or issued tickets are not reversed by a feature flag. Roll back application versions through the separately approved deployment process; do not erase financial records or drop indexes.

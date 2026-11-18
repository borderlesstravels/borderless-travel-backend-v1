# Production release - 13 November 2026

The user explicitly authorized deployment of main app, backend and admin under the Borderless team, with Travel on Credit enabled. This supersedes the previous local-only constraint for this release.

Team: borderless-travels-projects (team_9lKkGMWD5Hz29yZXUzerIt6c).

Backend READY: dpl_9uyaZdp8D5ZzbaYmH1kERBfGP5nB, https://api.borderless.travel. Admin READY: dpl_9s93DjexmXQHgx5VXYsLtDHhjda2, https://admin.borderless.travel. These CLI deployments uploaded the current local sources, including previously uncommitted changes; Git commit metadata alone does not identify the complete uploaded source. No Git commits, pushes or merges were made.

Main app BLOCKED: dpl_A6ssR6umVtWzpbTMLyJECnKtVCWY. Vercel returned BLOCKED and its project-collaboration/team-configuration help URL before building. Commit metadata points to 8e8c81f, author tolu. The existing main production domains were not assigned to this blocked deployment. No author impersonation, membership/plan changes or policy bypass was attempted.

Backend production flags GOTRIP_ENABLED, GOTRIP_ACCOUNTING_ENABLED and GOTRIP_TICKETING_ENABLED were set true as authorized. Main production configuration NEXT_PUBLIC_GOTRIP_ENABLED=true was saved, but its new build did not deploy. Fake-data flags E2E_TEST_MODE, CREDIT_REVIEW_DEMO and NEXT_PUBLIC_CREDIT_DEMO were set false for the applicable projects. Existing secrets were retained, not decrypted. Local environment files were not uploaded; .vercelignore excludes secrets, build outputs, fixtures and review artifacts.

No GOTRIP_WEBHOOK_SECRET exists in the backend's production environment metadata. The webhook therefore fails closed with 503 Webhook not configured. No secret was invented. Provider registration and secret provisioning remain required. Full financial operation is unverified pending the coordinated low-value test; no loan, bank transfer, reservation or ticket was created by release smoke checks.

Observed smoke checks: API root 200; authenticated credit review/intents without credentials 401; unsigned webhook 503 (missing configuration); admin login and credit SPA route 200; staff-origin API preflight 204 with Access-Control-Allow-Origin https://admin.borderless.travel. Backend/admin runtime-error queries returned no errors in the checked 10-minute windows. These are limited smoke checks, not live end-to-end financial proof. Production database/index/backup and actual provider/bank behavior were not validated during this release.

Previous known backend rollback target: dpl_HpagE2sV6fTsqxH9jfrwqQak87Uu. Previous admin rollback target: dpl_BRgmDsxPh4ungvk91Kc2cY4vMAJq. Any rollback/feature shutdown should preserve all recorded financial evidence.

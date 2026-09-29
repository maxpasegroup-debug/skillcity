# AIRA Production Launch Checklist

The release remains blocked while any Critical item is open. High items require remediation or a written, time-bounded risk acceptance with an operational restriction.

## Critical Blockers

- [ ] Verify a production PostgreSQL backup and a tested restore path.
- [ ] Run `prisma migrate status`, resolve drift/failures, and deploy reviewed migrations using the migration runbook.
- [ ] Run every read-only normalization audit and manually reconcile required data gaps.
- [ ] Validate all production environment variables without exposing values.
- [ ] Complete authenticated cross-role and cross-organization smoke tests against production-shaped data.
- [x] Replace phone-only application status with contact plus an opaque hashed reference and uniform failure responses.
- [ ] Apply the remediation migration and verify new public application/reference lookup end to end; define legacy reference reissue.

## High Priority

- [x] Patch the production Next.js dependency to `16.3.7` or newer reviewed patch.
- [x] Remove automatic `prisma migrate deploy` from Railway application startup.
- [ ] Deploy and multi-replica validate the PostgreSQL-backed rate limiter for login, reset, public forms/status, AI, and exports.
- [ ] Run `npm run audit:payment-references`, reconcile duplicates, deploy the compound unique index, and verify concurrent rejection.
- [ ] Configure and validate private storage plus the signed gateway; prove unsigned/direct, expired, cross-scope, archived, and revoked access is denied.
- [ ] Configure production error monitoring, structured logs and alerts for auth, payments, communications, automation and AI failures.
- [ ] Define and test email delivery; configure WhatsApp/provider webhooks only with signature, replay and idempotency controls.
- [x] Add a deploy-time Railway health check for application, database, and required migration readiness.
- [ ] Add continuous external health monitoring and alerting; Railway's probe runs only during deployment.
- [ ] Verify HTTPS, secure cookies, trusted host/origin behavior, CSP and HSTS at the deployed edge.
- [x] Remove critical Vitest advisories and confirm zero production dependency findings.
- [ ] Review the remaining high development/build-tool advisories, including Prisma CLI, without forcing an unverified downgrade.

## Medium Priority

- [ ] Remove or enforce production-safe handling of development defaults in `lib/env.ts` and `config/site.ts`.
- [ ] Decide whether unused `AUTH_SECRET` and `REDIS_URL` are implemented or removed from the runtime contract.
- [ ] Add privileged MFA/session rotation/device management policy.
- [ ] Review 140 cascade-delete relations and prohibit direct deletion of historical business principals.
- [ ] Consolidate legacy and authoritative audit/communications/document concepts through a reviewed data plan.
- [ ] Add database integration, authenticated browser, provider sandbox and webhook tests.
- [ ] Measure query latency, bundle output, Core Web Vitals and mobile performance; no current CWV claim exists.
- [ ] Establish retention, privacy, export and secure-deletion policies with business/legal owners.

## Low Priority

- [ ] Remove unused dependencies and replace broad `latest` ranges with a controlled update policy.
- [ ] Optimize large public launch images after measured performance testing.
- [ ] Consolidate role-specific shell duplication only when it reduces observed maintenance cost.
- [ ] Add accessibility and visual-regression automation.

## Manual Validation Matrix

| Area | Step | Expected result | Failure condition |
|---|---|---|---|
| Railway | Deploy reviewed commit with required variables; inspect build/start logs | Build succeeds; app starts without auto-migrating | Migration runs during restart, missing-variable fallback, repeated restart |
| PostgreSQL | Verify target, backup, restore test and row-count sample | Restorable pre-release point exists | Backup unverified or target unknown |
| Prisma | Follow migration runbook and re-run status | All repository migrations applied, no drift/failure | Failed/divergent migration or missing table |
| Authentication | Login/logout/reset; test active, suspended, temporary PIN and revoked session | Only eligible identities enter; revoked sessions fail | Suspended/revoked user gains access or secret appears in logs |
| Authorization | Use global, division, district/branch, own and unauthorized accounts; craft another record ID | Permitted data only; crafted ID denied | Any cross-scope read/mutation/export succeeds |
| CRM | Create a test lead/application twice and assign within/outside scope | Duplicate is reused/prevented; outside assignment denied | Duplicate records or scope bypass |
| Admissions | Approve test application, assign compatible batch, verify capacity/enrollment | One authoritative enrollment; incompatible/full batch denied | Duplicate/over-capacity enrollment or alternate activation |
| Finance | Create/issue invoice; record and verify approved test payment; repeat provider reference | Paid state derives from verified amount; duplicate rejected | Duplicate transaction, overpayment, unverified activation |
| Learning | Student opens own work; trainer opens assigned batch; each tries another user/batch | Own/assigned access works; cross-access denied | Private progress/submission visible |
| Career | Apply once before deadline; test private application with another user | One application; private profile/application stays scoped | Duplicate or unauthorized application visibility |
| Documents | Open metadata as owner/manager and unauthorized user | Scoped metadata only; no public private-object URL | Predictable/public private file or key leakage |
| Communications | Send approved test email; inspect ledger/retry; simulate signed provider status in sandbox | State and audit progress once; invalid signature rejected | Business state changes on delivery failure or replay |
| Automation | Process same event twice; exhaust a failing rule | One effect; retries end in visible dead letter | Duplicate action or unlimited retry |
| AI | Use each role assistant/read tool; create and approve proposal | Scoped context; approval performs no business mutation | Cross-scope context or autonomous write |
| Analytics | Compare scoped dashboard/export to direct approved counts and another scope | Counts match source and remain scoped/currency-separated | Cross-scope rows, fabricated KPI or mixed currency |
| PWA | HTTPS install on Android/iOS/desktop; inspect cache after login/logout/offline | Public shell works; private pages/API are absent from Cache Storage | Authenticated/private response remains cached |
| Mobile | Test narrow viewport, keyboard, forms, tables and sign-out on physical devices | No overlap; commands remain usable | Hidden controls, clipped data or failed sign-out |
| Production smoke | Check public pages, login, each main shell, API 401/403, logs and alerts | Expected 2xx/redirect/401/403 with no secret/stack trace | 500, leaked internals, alert silence |

## Explicit Release Gates

### Database

- [ ] Production backup completed and its identifier/timestamp/retention recorded.
- [ ] Backup restored and verified in an isolated target using `PRODUCTION_BACKUP_RESTORE_RUNBOOK.md`.
- [ ] All 30 migrations reviewed; payment-reference audit reports zero unresolved duplicate groups.
- [ ] Migration executed manually by one authorized operator.
- [ ] Post-migration audits and application smoke tests passed.

### Security

- [x] Application lookup requires an opaque reference and does not return internal IDs.
- [ ] Distributed rate limiting verified against the deployed shared database.
- [ ] Private document provider/gateway configured and direct unsigned access denied.
- [ ] Payment-reference unique index verified in the production database.

### Environment

- [ ] Production server variables validated without printing values.
- [ ] Public domain, HTTPS, trusted origin, cookies, CSP/HSTS behavior validated.
- [ ] Email and WhatsApp provider variables/contracts validated where enabled.
- [ ] AI provider variables, timeout, scoped access, and failure behavior validated where enabled.
- [ ] Private document provider, HTTPS gateway, signing secret, and TTL validated.
- [ ] Payment provider credentials/webhooks validated only when those integrations are enabled.

### Validation

- [ ] Authenticated browser tests completed across representative roles/scopes.
- [ ] Production provider tests completed for every enabled external provider.
- [ ] Physical mobile-device checks completed.
- [ ] PWA installation/cache checks completed over production HTTPS.
- [ ] Critical workflows passed with approved test records.

## Go / No-Go

Proceed only after Critical items are signed off with evidence. Start with a limited operational cohort, monitor errors and business counts, and retain the rollback decision window. Do not treat a successful build as database or business validation.

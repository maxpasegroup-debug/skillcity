# Production Backup and Restore Runbook

## Status

This is the required operator procedure for the Railway-hosted PostgreSQL database. Repository access does not prove that the current Railway plan exposes snapshots, point-in-time recovery, or a particular restore command. Those provider capabilities, permissions, retention settings, and actual restore results require manual confirmation.

- Procedure documented: **YES**
- Production backup completed: **NOT VERIFIED**
- Isolated restore tested: **NOT VERIFIED**
- Production RPO/RTO approved: **NOT VERIFIED**

Do not begin a production migration until the checklist below has signed evidence.

## Ownership and Evidence

Assign one migration operator and one recovery verifier. Record the production project/environment/database labels without recording credentials. Retain outside this repository:

- backup or snapshot identifier;
- UTC creation and completion timestamps;
- provider location/service and retention expiry;
- operator and verifier;
- source database identifier and reviewed Git commit;
- restore target identifier;
- restore start/end timestamps and verification results;
- approved RPO, RTO, and incident contact.

## Before Migration

1. Identify the exact Railway project, environment, PostgreSQL service, and database. Stop if any target is ambiguous.
2. Confirm the authorized operator has backup and restore permissions using the Railway/provider interface available to the account. Do not infer capabilities from this repository.
3. Establish a maintenance/write-control window. Prevent concurrent migration jobs.
4. Create a full provider snapshot or a PostgreSQL logical backup using the organization-approved provider procedure.
5. Record the backup identifier, location, UTC timestamp, completion state, retention, source database, and operator.
6. Verify the provider reports completion and a non-empty artifact/snapshot. A creation request alone is not evidence.
7. Restore the backup into an isolated non-production database when the provider supports it.
8. Verify the isolated restore with schema presence, `_prisma_migrations`, representative table counts, and read-only authentication/scope queries. Never connect the production application to this test target.
9. Have the recovery verifier sign the evidence. Stop if creation, access, retention, or restore verification is unresolved.

## Restore Procedure

1. Declare the incident, stop application writes, and preserve logs plus current `prisma migrate status` output.
2. Select the verified backup by identifier, source database, and timestamp. Confirm it precedes the failed change and satisfies the approved recovery point.
3. Create a fresh recovery database/service where possible. Restore using the provider's confirmed UI/CLI procedure. Do not overwrite production until the recovery copy is verified.
4. Confirm restore completion and inspect PostgreSQL/service logs for errors.
5. Against the recovery target, verify `_prisma_migrations`, representative row counts, required indexes/constraints, and read-only business queries. Do not print credentials or PII.
6. Confirm the previously deployed application commit is schema-compatible. Update `DATABASE_URL` only through authorized Railway secret management.
7. Restart/redeploy the selected application commit, then run authentication, scoped-read, application-status, document, and finance smoke tests.
8. Re-enable writes only after the incident owner approves the evidence. Reconcile writes that occurred after the chosen recovery point.

## Emergency Recovery

1. Incident owner freezes writes and records detection time, suspected data-loss window, and last known healthy deployment.
2. Database operator identifies the newest verified recovery point meeting the approved RPO.
3. Application operator preserves the failing deployment and logs, then prepares the compatible commit.
4. Database operator restores to an isolated target and completes verification.
5. Incident owner chooses reconnect, provider-assisted recovery, or continued outage. No improvised schema rollback is permitted.
6. After recovery, rotate exposed credentials if compromise is suspected, reconcile missing writes, monitor critical counts, and publish an incident record.

## Failure Conditions

Stop release or recovery if the target is unknown, the backup is incomplete, restore permission is unavailable, the restore has not been verified, row-count/schema checks disagree, application compatibility is unknown, or the operator cannot preserve the recovery evidence.

## Current Evidence

No production `DATABASE_URL`, Railway database console, backup identifier, or restore target was available during this remediation. Therefore this procedure is **documented but not tested**, and backup/restore remains a production launch blocker.

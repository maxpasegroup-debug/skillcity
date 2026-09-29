# Production Database Migration Runbook

This runbook is manual by design. Railway application startup does not execute Prisma migrations. Never use `prisma migrate reset` or `prisma db push` against production.

## Release Order Warning

The remediated production rate limiter intentionally fails closed and requires `RateLimitBucket`. During a controlled maintenance window, an authorized operator must deploy migration `20260929000100_remediate_production_blockers` from the reviewed commit before routing login, password-reset, public-form/status, AI, or export traffic to the remediated application. Do not leave the new application serving traffic against the old schema. This is a separate operator action, never an application startup command.

## 1. Backup

1. In Railway/PostgreSQL, identify the exact production service and database name.
2. Pause business writes or announce a maintenance window if the provider cannot guarantee a consistent online snapshot.
3. Create a provider snapshot or logical backup covering schema and data.
4. Record backup identifier, time, operator and retention location outside the application repository.
5. Confirm the backup reports success. If possible, restore it to an isolated database and run a basic row-count check.

Expected: a dated, restorable backup exists. Failure condition: no verified backup or restore permission. Stop.

## 2. Verify Environment

1. Open an approved Railway shell/job attached to the intended database.
2. Confirm service/project/environment labels without printing `DATABASE_URL`.
3. Confirm Node satisfies `.node-version` and install exactly with `npm ci`.
4. Confirm the deployed commit matches the reviewed commit.
5. Run `npx prisma validate` and `npx prisma generate`.
6. Run `npm run audit:payment-references`. Stop if `duplicateGroups` is not zero; references are redacted and reconciliation is manual.

Expected: correct production target and valid schema. Failure condition: unknown target, credential error, schema error or commit mismatch. Stop.

## 3. Check Migration Status

Run only:

```bash
npx prisma migrate status
```

Save migration names and status without connection details. Compare against all 28 directories under `prisma/migrations`. Do not infer pending state from repository files alone.

Expected: no divergent, failed or edited migration. Compare against all 30 directories currently under `prisma/migrations`. Failure condition: failed migration, drift, unknown baseline or production-only migration. Stop and investigate.

## 4. Review SQL

Review pending SQL in timestamp order. Confirm that expected tables, columns, enums, indexes, data seeds and foreign keys match the release. The current static audit found no table/column drops, truncation or row deletion. Migration `20260831000300_harden_career_rm_integrity` intentionally drops one legacy unique index.

Check table size and lock implications before large index/constraint operations. Confirm free disk space and expected duration.

Migration `20260929000100_remediate_production_blockers` is additive: it adds the nullable admission lookup hash, shared rate-limit table, and compound payment-reference unique index. Its read-only guard raises an exception before the unique index if duplicate non-null `(provider, providerRef)` groups exist. It does not repair or delete those rows. Existing applications receive no guessed lookup reference and remain unavailable to public lookup until an authorized reference-reissue process exists.

## 5. Execute

With the backup complete and the application write window controlled:

```bash
npx prisma migrate deploy
```

Run once from a controlled job/shell, not from multiple application replicas. Do not run `db seed` unless the reviewed release procedure explicitly requires its idempotent reference data.

## 6. Verify Database

1. Run `npx prisma migrate status` again.
2. Run the read-only audits applicable to deployed phases:

```bash
npm run audit:employees
npm run audit:academic-advisors
npm run audit:labs
npm run audit:skill-studio
npm run audit:career-hub
npm run audit:core-operations
npm run audit:communications
npm run audit:payment-references
npm run audit:v2-governance
npm run audit:v2-communications
npm run audit:v2-sia
npm run launch:v2:verify
```

3. Record counts and classify gaps using each phase normalization document. Never invent missing assignments, designations, owners or results.
4. Verify uniqueness and foreign-key errors are absent from deployment logs.

## 7. Smoke Test

Start the reviewed application build. Test login/logout, one scoped read per representative role, CRM lead/application plus reference lookup, an existing enrollment, employee directory, finance duplicate rejection, private document delivery, shared rate limiting, communications ledger, AI configuration state, analytics export and PWA public assets. Use approved test records only.

Expected: existing data is readable and cross-scope attempts are denied. Failure condition: missing tables/columns, 500 responses, wrong counts, scope leakage or failed login. Stop writes and assess restore.

## 8. Rollback / Restore

Prisma migrations do not provide automatic down migrations. Do not hand-edit `_prisma_migrations` or improvise reverse SQL.

1. Stop application writes.
2. Capture failing logs and migration status.
3. If the migration completed but application rollback is compatible, redeploy the previous application commit.
4. If schema/data restoration is required, restore the verified pre-deploy backup into the production service using the provider procedure.
5. Repoint/restart only after row counts, auth, and scoped reads pass.
6. Document incident timeline, affected migrations and data reconciliation.

## Evidence To Retain

- Backup and restore-test identifiers
- Git commit and build/deployment IDs
- Pre/post migration status
- Audit script summaries without PII
- Smoke-test results and operator
- Any lock duration, error or recovery action

The complete provider-dependent recovery procedure is in `docs/production/PRODUCTION_BACKUP_RESTORE_RUNBOOK.md`. No migration or restore was executed during repository remediation.

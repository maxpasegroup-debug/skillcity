# AIRA Skill City V2 Production Release Runbook

This runbook finalizes the V2 code release without turning application startup into a migration or data-normalization process. Keep evidence free of credentials and personal data.

## 1. Release Candidate

1. Confirm the reviewed commit and a clean worktree.
2. Run `npm ci` with the Node version in `.node-version`.
3. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run prisma:validate`, `npm run launch:check`, and `npm run build`.
4. Stop on any error. A lint warning requires review but does not equal an error.

## 2. Environment

1. Confirm the Railway project, service, and environment labels without printing values.
2. Configure `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, and the documented AI settings.
3. Configure all `PRIVATE_DOCUMENT_*` variables together or leave private delivery disabled and fail-closed.
4. Run `npm run launch:v2:verify`. This is read-only and prints only readiness status and missing object names.

## 3. Database

1. Follow `PRODUCTION_BACKUP_RESTORE_RUNBOOK.md` and retain actual restore evidence.
2. Run the payment-reference audit and resolve duplicate groups manually.
3. Run `npx prisma migrate status` and review every pending SQL file.
4. Execute `npx prisma migrate deploy` once from a controlled job.
5. Re-run migration status and `npm run launch:v2:verify`.
6. Run all V2 and domain normalization audits. Never invent role, Employee, organization, channel, ownership, or designation data.

## 4. V2 Data Decisions

1. Review persisted role and permission drift from `audit:v2-governance`.
2. Confirm one accountable holder for CEO and Director roles.
3. Confirm department heads and their organization assignments.
4. Create Internal Channels only from approved ownership and membership lists.
5. Review pending SIA proposals lacking organization context; do not auto-assign scope.

## 5. Representative Smoke Matrix

Use approved test identities and records:

| Identity | Required proof |
|---|---|
| CEO | Opens CEO workspace, all authorized business areas, SIA global brief and proposal queue |
| Director | Opens Director operations and SIA without identity-management access |
| Each department head | Sees only its department/scope and only in-scope SIA proposals |
| Senior/Junior Advisor | Same Advisor permission surface; designation remains distinct |
| Frontline Employee | Opens only assigned workspaces, channels and own notifications |
| Platform Administrator | Manages platform identities but has no implicit business authority |
| Student | Opens only own academic data and no employee/Internal Channel surface |

For every scoped role, craft a URL/action using another organization’s ID and confirm denial server-side.

## 6. Communications And SIA

1. Create one approved test Team channel and Announcement channel.
2. Verify inactive/non-member users cannot read or send.
3. Verify a department head cannot add an out-of-scope Employee.
4. Create one allowlisted SIA proposal, inspect its exact payload, approve it, and confirm no business mutation executes.
5. Confirm another organization cannot see or review that proposal.

## 7. Deployment And Health

Railway starts with `npm run start` and probes `/api/health`. The endpoint reports only `ready` or `unavailable`, disables caching, checks database connectivity and requires the remediation, Internal Channels, and SIA approval migrations. Railway’s health probe is deploy-time protection, not continuous monitoring; configure an external monitor and alert separately.

## 8. Go / No-Go

Release only when backup/restore, migrations, audits, representative access checks, enabled providers, `/api/health`, logs, and rollback ownership all have named evidence. Begin with a limited cohort and retain the previous deployment for rollback. No code-only result may be recorded as production verification.

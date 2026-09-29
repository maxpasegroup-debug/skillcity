# AIRA Skill City V2 Launch Readiness

The V2 release combines the lean role catalog, role-aware workspaces, Internal Channels, and the governed SIA Operating Centre. A successful build is necessary but does not prove database or production readiness.

## Required Railway Variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Private document delivery is optional and fail-closed. When enabled, all three must be configured:

- `PRIVATE_DOCUMENT_PROVIDER`
- `PRIVATE_DOCUMENT_GATEWAY_URL`
- `PRIVATE_DOCUMENT_SIGNING_SECRET`

## Launch Commands

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm run launch:check
npm run build
```

With a confirmed production environment and read-only database access, run:

```bash
npm run launch:v2:verify
npm run audit:payment-references
npm run audit:v2-governance
npm run audit:v2-communications
npm run audit:v2-sia
```

## Railway Startup

Railway starts only the application:

```bash
npm run start
```

Railway probes `/api/health`, which returns success only when PostgreSQL is reachable and the required production-remediation/V2 migrations are applied. Migrations remain a separate, controlled operator step after backup and review:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Do not run `prisma migrate reset` or `prisma db push` against production. Run `npm run db:seed` only when the reviewed release procedure explicitly authorizes reference-data normalization.

## Launch Programs

- Startup Skool
- GenZ Builder
- NiceJobs - Sales Mastery Program

The seed keeps these programs public, active and admission-open.

## Admissions Gate

Students cannot self-register into dashboards. They must:

1. Apply through `/apply`.
2. Check status through `/application-status`.
3. Wait for Admission Cell approval.
4. Receive WhatsApp PIN.
5. Login and reset PIN.
6. Enter the student dashboard.

## V2 Release Gate

Follow [the V2 production release runbook](docs/production/AIRA_V2_PRODUCTION_RELEASE_RUNBOOK.md). The release remains blocked until backup/restore evidence, migration status, read-only audits, representative role/scope smoke tests, provider checks, and production monitoring are signed off.

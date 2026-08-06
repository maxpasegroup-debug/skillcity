# AIRA Skill City Launch Readiness

Phase 8 prepares the admissions-first launch flow for production.

## Required Railway Variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Launch Commands

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm run launch:check
npm run build
```

## Railway Startup

Railway runs:

```bash
npm run prisma:deploy && npm run start
```

Run this once after migrations are healthy:

```bash
npm run db:seed
```

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

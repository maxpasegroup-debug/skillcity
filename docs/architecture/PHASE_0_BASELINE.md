# Phase 0 Repository Baseline

Baseline date: 2026-09-27  
Repository: `D:\APPS\WEB\skillcity`  
Branch: `main`

## Runtime and Framework

| Item | Baseline |
| --- | --- |
| Node used for validation | `v22.14.0` |
| npm | `10.9.2` |
| Repository Node declaration | `>=20.9.0`; `.node-version` and `.nvmrc` specify `20.11.1` |
| Next.js | `16.2.11` installed (`latest` range) |
| React | `19.2.8` installed (`latest` range) |
| TypeScript | `6.0.3` installed (`latest` range) |
| Prisma CLI/client | `6.19.3` installed (`^6.16.3` range) |
| Database | PostgreSQL through Prisma |
| Package manager | npm, lockfile version 3 |
| Deployment | Railway Nixpacks; build then migration deploy/start |

The local validation runtime differs from the pinned Node file. CI intentionally uses `.node-version` so Node 20.11.1 remains the compatibility floor.

## Scripts Before Phase 0

| Script | Command | Present initially |
| --- | --- | --- |
| `dev` | `next dev` | Yes |
| `build` | `prisma generate && next build` | Yes |
| `start` | `next start` | Yes |
| `lint` | `eslint .` | Yes |
| `typecheck` | `tsc --noEmit` | Yes |
| `prisma:generate` | `prisma generate` | Yes |
| `prisma:validate` | `prisma validate` | Yes |
| `prisma:migrate` | `prisma migrate dev` | Yes |
| `prisma:deploy` | `prisma migrate deploy` | Yes |
| `db:seed` | `tsx prisma/seed.ts` | Yes |
| `launch:check` | `tsx scripts/launch-readiness.ts` | Yes |
| tests | None | No |

Phase 0 adds `test`, `test:watch`, and `test:coverage` backed by Vitest 3.2.4.

## Initial Validation Results

| Check | Command | Result before Phase 0 edits |
| --- | --- | --- |
| Dependencies | `npm.cmd ls --depth=0` | Passed with extraneous transitive packages reported; no declared package missing |
| TypeScript | `npm.cmd run typecheck` | Passed |
| ESLint | `npm.cmd run lint` | Passed |
| Prisma validate | `npm.cmd run prisma:validate` | Failed: `P1012`, `DATABASE_URL` not set |
| Prisma generate | `npm.cmd run prisma:generate` | Passed without a database connection |
| Production build | `npm.cmd run build` | Passed; 42 static pages generated and dynamic routes compiled |
| Tests | N/A | No script or framework existed |
| CI | N/A | No GitHub Actions workflow existed |

PowerShell blocks the `npm.ps1` shim under the machine execution policy. Local commands were therefore run through `npm.cmd`. This is a workstation shell issue, not an application failure.

## Environment Prerequisites

- Node `20.11.1` or another version satisfying `>=20.9.0`. Node 20.11.1 is the CI target.
- npm with lockfile support; use `npm ci` for reproducible CI installation.
- A PostgreSQL-shaped `DATABASE_URL` is required for `prisma validate`. Validation and generation do not connect to that URL.
- A reachable PostgreSQL database is required for migrations, seed, and runtime workflows.
- `AUTH_SECRET` must be at least 32 characters for application runtime validation.
- `RESEND_API_KEY` and `OPENAI_API_KEY` are optional outside their production features.
- `REDIS_URL` is declared but the current rate limiter does not use it.

CI uses non-secret placeholder values for schema validation and build. It does not run migrations or database-backed tests.

## Initial Git State

The working tree was not clean before Phase 0:

- Modified, pre-existing: `next-env.d.ts`.
- Untracked, created by the preceding architecture audit: four `AIRA_SKILL_CITY_*.md` files at repository root.

Phase 0 preserves those changes. No reset, checkout, migration, seed, deployment, or data mutation was performed.

## Warnings

- Many dependencies use `latest`, so a future clean install can change major versions despite the lockfile currently fixing resolved versions.
- Local Node and the repository pin differ.
- Prisma validation needs an environment value even when no connection is attempted.
- No database-backed integration suite exists yet.
- Existing build exposes `/email-previews` as a static route; access control is deferred.

# AIRA Skill City Phase 5 Report

## Implemented

Phase 5 establishes AIRA Labs as a first-class product-governance domain inside AIRA Skill City Core:

- authoritative scoped product registry;
- stable product code and internal detail route;
- controlled product type and lifecycle;
- primary Employee owner with retained replacement history;
- effective-dated Employee contributors;
- server-side permission, scope, Employee-state, and organization compatibility enforcement;
- mutation audit records;
- scoped Labs catalog and product detail/management UI;
- read-only data normalization audit.

No external product records were invented or seeded.

## Existing Architecture Reused

- Next.js App Router, server actions, and existing UI components;
- Prisma/PostgreSQL and additive migration conventions;
- custom User authentication and Employee one-to-one identity;
- Institution, Division, District, Campus/Centre, Department hierarchy;
- effective `EmployeeOrganizationAssignment` placement;
- centralized role/permission and GLOBAL through OWN scope resolution;
- resource-access assertions and organization hierarchy validation;
- existing `PlatformAudit` transaction pattern;
- Vitest, ESLint, TypeScript, Prisma generation, and Next.js build workflow.

`Program`, `PortfolioProject`, academic projects, marketplace projects, recruitment applications, AI providers, and automation settings retain their existing bounded meanings.

## New Models And Schema Changes

### `LabsProduct`

Stores canonical code, name, description, type, lifecycle, direct organization scope, optional technical metadata, archive timestamp, creator, timestamps, and assignments.

### `LabsProductAssignment`

Stores Product to Employee responsibility as `OWNER` or `CONTRIBUTOR`, optional responsibility label, active/inactive status, effective dates, creator, and timestamps.

### Controlled Enums

- Product Type: `PLATFORM`, `APPLICATION`, `AI_PRODUCT`, `INTERNAL_TOOL`, `AUTOMATION`, `SERVICE`
- Lifecycle: `IDEA`, `PLANNING`, `BUILDING`, `PILOT`, `LIVE`, `MAINTENANCE`, `ARCHIVED`
- Assignment Role: `OWNER`, `CONTRIBUTOR`
- Assignment Status: `ACTIVE`, `INACTIVE`

Product code is unique, lowercase/URL-safe, and immutable after creation. Products and responsibility history have no delete action. Foreign keys use restrictive deletion behavior.

## New Permissions

- `labs.read`
- `labs.create`
- `labs.update`
- `labs.manage`
- `labs.assign`

Admin, Director, CEO, and COO receive global grants through the migration. HOD receives organization-scoped read/create/update/assign. Archive and restore specifically require `labs.manage`.

## New Server-Side Authorization

- `/labs` and `/labs/[code]` require `labs.read`.
- Catalog/detail queries always apply `labsProductScopeWhere`.
- Mutations assert their specific permission and product/Employee scope.
- Crafted product IDs fail through `assertLabsProductAccess`.
- Product creation validates the full organization path.
- Initial owner creation is atomic with product creation.
- Owner/contributor Employees require active account and active employment state.
- Employee primary/effective secondary organization placement must cover the Product.
- Product organization movement and product-code renaming are rejected by the standard update action.
- Owner replacement and product creation use serializable transactions.

## Organization Scoping

Products directly reference Institution and Division, with optional District, Centre, and Department. The existing GLOBAL, ORGANIZATION, DIVISION, DISTRICT, BRANCH, DEPARTMENT, and OWN semantics apply. OWN visibility derives from an effective assignment belonging to the logged-in Employee.

No location, division, employee, or product is hard-coded.

## UI Added

- `/labs`: responsive scoped product catalog and authorized product registration.
- `/labs/[code]`: product overview, lifecycle update, organization summary, owner replacement, contributor assignment, and assignment history.
- Shared Labs navigation shell.
- Links from existing Admin, Director, and Executive navigation.

The UI displays no fake metrics, release status, deployment information, financial data, or product analytics.

## Audit Trail

`PlatformAudit` captures:

- `LABS_PRODUCT_CREATED`
- `LABS_PRODUCT_UPDATED`
- `LABS_PRODUCT_STATUS_CHANGED`
- `LABS_PRODUCT_OWNER_REPLACED`
- `LABS_PRODUCT_CONTRIBUTOR_ASSIGNED`
- `LABS_PRODUCT_ASSIGNMENT_ENDED`

## Tests

Vitest: **PASS, 129/129 tests across 23 files**.

Phase 5 adds 24 tests covering product schema/code, types/lifecycle, effective assignment dates, Employee organization compatibility, overlap behavior, organization and OWN visibility, authorized/unauthorized creation, invalid scope, duplicate code, inactive Employee rejection, owner mismatch, crafted-ID denial, owner history, contributor overlap, lifecycle audit, stable code, archive permission, and resource access. All previous 105 tests remain green.

## Validation

- `npm test`: PASS, 129/129
- `npm run lint`: PASS
- `npx tsc --noEmit`: PASS
- `npx prisma generate`: PASS, Prisma Client 6.19.3
- `npm run build`: PASS
- Next.js compilation: PASS
- Static pages: PASS, 42/42
- `/labs` and `/labs/[code]`: compiled as authenticated dynamic routes
- `git diff --check`: PASS

## Database Validation Status

`DATABASE_URL unavailable`

Prisma database validation blocked with `P1012` because no `DATABASE_URL` exists in the process or repository environment files. The read-only `npm run audit:labs`, migration rehearsal, and database-backed smoke tests were not run. No database credentials were invented or requested.

## Migration Status

Migration `20260928000200_add_aira_labs_foundation` was created and statically inspected. It is additive and contains no drop, truncate, delete, destructive rename, product seed, or historical-data rewrite.

Production migration was **not executed**. It must follow the existing pending migration sequence through Phase 4A and the normal Prisma deployment workflow.

## Data Normalization

`docs/architecture/PHASE_5_LABS_DATA_NORMALIZATION.md` separates safe automatic setup from manual product verification. `npm run audit:labs` is read-only and reports owner gaps, multiple owners, inactive employees, organization mismatches, and adjacent records that must not be auto-migrated.

TeachX Guru, LearnX Guru, HappiNotes, BGOS, Talkin Labs, Sales Booster, and ABSECO were not created or assigned guessed lifecycle states.

## Known Limitations

- Live product inventory and database smoke tests remain blocked by unavailable database access.
- Product organization moves require a future explicit governed workflow.
- Lifecycle values are controlled but no speculative transition state machine is imposed.
- Product assignees still require a separate centralized role grant for Labs access; assignment alone does not grant authorization.
- Technical metadata exists as an optional boundary but no repository, deployment, secret, or integration data is invented.

## Deferred Work

- complete project management, roadmaps, tasks, issues, and sprints;
- releases, versions, environments, and deployments;
- repositories, integrations, APIs, automation execution, and queues;
- product analytics, finance, billing, and subscriptions;
- full HR product-team management;
- AI assistant and executive intelligence;
- external Labs product onboarding and synchronization;
- Nice Jobs, Career Hub, mobile, WhatsApp, and email automation.

## Completion

What is complete: the code-level Labs product registry, ownership/team foundation, centralized authorization, organization scoping, audit behavior, UI, tests, migration, and documentation.

What remains: database migration rehearsal, live normalization inventory, safe database smoke tests, browser review, and production deployment verification. These remain because `DATABASE_URL` and production access are intentionally unavailable.

This does not expose a code dependency for a later phase, but database deployment is an operational gate before production use of Labs records.

# PHASE 5 STATUS: COMPLETE

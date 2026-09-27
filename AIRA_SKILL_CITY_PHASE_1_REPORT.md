# AIRA Skill City - Phase 1 Report

## Status

**PHASE 1 STATUS: COMPLETE**

The Phase 1 code and migration artifacts are complete. Authentication hardening, organization structure, centralized role/permission policy, scope propagation, server-side enforcement, and regression coverage are implemented for the target domains. The additive production migration and business-data normalization were intentionally **not executed**; they are deployment operations governed by the production migration plan, not missing implementation.

## 1. Authentication Changes

Authentication trace:

`login -> password/PIN verification -> opaque session token -> SHA-256 Session.tokenHash -> HttpOnly SameSite=Lax cookie -> active User -> RolePermission -> effective organization scope -> server guard -> scoped Prisma operation`

- Preserved the custom database session architecture and existing email/password, admin PIN, and approved-student PIN flows.
- Sessions reject missing, expired, revoked, deleted-user, and suspended/non-active-user sessions.
- Preserved bcrypt credentials and opaque session tokens; plaintext credentials are not stored.
- Removed fixed admin bootstrap credentials from source. Optional bootstrap requires environment values.
- Admin login and application entry points use centralized permissions.

## 2. Organization Architecture

- `Institution` is reused as Organization; no duplicate company model was introduced.
- Added `Division` and `District` under an organization.
- `Campus` is reused for Branch/Centre/Campus/Corporate Office through `OrganizationUnitType`.
- `Department` can belong to an organization, division, and/or campus.
- `Employee`, `Program`, `Lead`, and `CareerApplication` have direct scope fields where independent routing requires them. Employees also support active, time-bounded secondary organization assignments without duplicate users.
- No state or district list is hard-coded. The model supports any state/country expansion.
- Organization-management actions validate authorization, parent access, and same-organization consistency. Organization creation and the existing automation-rule control are global-only.

## 3. Role Architecture

- Existing production role names and `UserRole` assignments are preserved.
- `Role.key` provides a stable machine key and `Role.system` identifies system roles.
- Role keys and the compatibility grant map are centralized in `lib/auth/permissions.ts`.
- Database `RolePermission` rows become authoritative when present; future roles can be added without scattered role checks.

## 4. Permission Architecture

- Added `Permission` and `RolePermission` using `resource.action` keys.
- Added `GLOBAL`, `ORGANIZATION`, `DIVISION`, `DISTRICT`, `BRANCH`, `DEPARTMENT`, and `OWN` scopes.
- Explicit active `UserAccessScope` rows narrow broad role grants, including `GLOBAL` grants.
- Without explicit narrowing, a global grant remains global. Non-global grants can derive matching scope from `Employee`.
- Missing scoped assignments fail closed. `OWN` grants do not expand organization access.
- Shared APIs cover permission checks, effective-scope resolution, Prisma predicates, route/action guards, and record-level mutation assertions.

## 5. Data-Scoping Architecture

Authoritative ownership is documented in `docs/architecture/PHASE_1_AUTHORIZATION_AND_SCOPE.md`.

| Entity | Scope strategy |
| --- | --- |
| Employee | Direct primary organization fields plus active secondary assignments |
| Lead | Direct organization/division/district/campus |
| Career application | Direct organization/division/district/campus |
| Program | Direct organization/division/campus/department |
| Batch | Explicit campus, otherwise program |
| Admission application | Lead; program fallback only for entirely unscoped legacy leads |
| Student/enrollment | Enrollment -> batch -> program |
| Trainer | Active trainer assignment and employee organization |
| Document | Admission application, otherwise student enrollment |
| Invoice | Lead, then batch, program, or student enrollment |
| Activity/calendar | Batch, otherwise journey/program |
| Executive KPI | Predicates applied to each aggregated source |

Ambiguous legacy records are visible to global administrators for normalization but fail closed for scoped staff.

## 6. Server-Side Authorization

- Admissions lists, detail views, aggregate counts, conversion metrics, application review, payments, documents, enrollment logs, and mutations are scoped server-side.
- Program/batch/director lists, detail relationships, trainer assignment, student enrollment, and mutations validate inherited scope.
- Executive dashboards, finance, students, organization data, reports, and settings calculate within effective scope.
- Recruitment counts, grouped reports, candidate details, interviews, RM development, and employee options are scoped.
- Tara admissions/BDM context uses the same lead/application/invoice/document/program predicates.
- BDM workspaces and leaderboard no longer disclose other users outside the actor's scope.
- Student and trainer access remain relationship-bound. Client navigation is convenience only.

## 7. Database Changes

Migration artifacts: `20260927000100_add_identity_org_permissions` and `20260927000200_add_employee_organization_assignments`.

- Adds `OrganizationUnitType` and `AccessScopeType` enums.
- Adds `Division`, `District`, `Permission`, `RolePermission`, and `UserAccessScope`.
- Adds nullable organization foreign keys to the smallest set of independently scoped models.
- Adds direct scope to `CareerApplication` so recruitment does not rely on candidate free-text district.
- Adds optional employee reporting manager and time-bounded secondary organization assignments.
- Adds indexes and foreign keys; no production table, row, or critical field is dropped or renamed.
- Prisma Client generation and schema validation pass.

## 8. Migration Details

**PRODUCTION MIGRATION: NOT EXECUTED.**

The migration is additive, but production organization assignments cannot be inferred safely from names, city/state text, or candidate district text. The reviewed process is in `docs/architecture/PHASE_1_PRODUCTION_MIGRATION_PLAN.md`.

Deployment requires a verified backup, production-clone rehearsal, lock-duration review, migration deploy, idempotent seed, manual hierarchy/data normalization, explicit access-scope approval, and two-organization smoke tests. No reset, destructive migration, role rewrite, or production data change was performed.

## 9. Files Changed

Primary Phase 1 implementation files:

- Policy: `lib/auth/permissions.ts`, `server/auth/authorization.ts`, `server/auth/scoping.ts`, `server/auth/resource-access.ts`, `server/auth/session.ts`.
- Schema/data: `prisma/schema.prisma`, Phase 1 migration SQL, `prisma/seed.ts`, `.env.example`.
- Admissions: `server/admissions/*.ts`, admissions/telecaller/counsellor actions, and affected admissions pages.
- Learning/director: `server/director/queries.ts`, `actions/director.ts`, trainer and journey query guards.
- Executive: `server/executive/queries.ts`, `actions/executive.ts`, and existing organization-management pages/forms.
- Recruitment: `server/careers/queries.ts`, `server/careers/rm-performance.ts`, `actions/careers.ts`.
- AI/documents: `server/ai/context.ts`, Tara stream route, admissions document page/action.
- Tests: authorization, session, login, organization-scoping, and scoped aggregate suites under `tests/`.
- Documentation: architecture ADRs, scope architecture, migration plan, and this report.

## 10. Tests Added

The suite covers login/session states; admin, employee/trainer, student, route, API, and server-action authorization; own/organization/division/district/branch/fail-closed scopes; global-grant narrowing; scoped admissions and recruitment aggregates; inherited program/batch/application/document scope; district/division/global executive KPIs; and existing admissions/security/WhatsApp regressions.

Final result: **12 test files, 48 tests passed**.

## 11. Existing Behavior Preserved

- Existing role names, user-role rows, login routes, cookie name/format, password hashes, and active workflows remain.
- Existing admin, director, admissions, BDM, telecaller, counsellor, trainer, student, recruitment, success, community, and Tara entry points remain.
- Runtime pipeline setup was removed from affected read paths and placed in the explicit idempotent seed; mutation compatibility remains until deployment completes seeding.
- No payment, WhatsApp/email infrastructure, queue, portfolio, Nice Jobs, mobile, automation-engine, or visual redesign work was added.

## 12. Remaining Authorization Gaps And Risks

No known critical Phase 1 target-domain authorization gap remains in the code audit.

- Production rows and role assignments have not been inspected or normalized; scoped users should not be enabled until migration checks pass.
- Enforcement is in server/Prisma services, not PostgreSQL row-level security. Future code must use the shared scope services.
- Existing public applications are intentionally unscoped until reviewed and assigned; scoped staff cannot process ambiguous rows.
- Public application status lookup still relies on contact possession plus in-memory rate limiting; stronger verification and shared rate limiting remain security work.
- Existing document URLs have no storage ACL, signed download, malware scan, or retention controls. Phase 1 scopes metadata and does not expose a download route; storage security is deferred.
- Session rotation on privilege/credential changes, privileged MFA, and distributed rate limiting remain future identity/infrastructure hardening.
- Browser and live-database smoke tests were not run because no safe migrated test database/browser session was available.

## 13. Recommended Next Phase

Before Phase 2 feature work, execute the documented Phase 1 procedure in staging, normalize proven organization relationships, assign reviewed user scopes, and run representative two-organization database-backed smoke tests. Production deployment should proceed only after that evidence is signed off.

## PHASE 1 COMPLETION REVIEW

### Completed

Identity/session hardening, typed organization hierarchy, centralized roles and permissions, effective-scope resolution, inherited resource ownership, target-domain query/mutation propagation, read-path cleanup, additive migration artifacts, tests, and architecture documentation are complete.

### Scope Propagation

- Admissions: leads, applications, dashboard/report aggregates, conversions, review queues, payments, documents, students, and enrollment activity scoped.
- Programs/batches: direct and inherited program/campus scope, detail and mutation assertions, trainer assignment and student relationships scoped.
- Executive: admission, finance, student, workforce, organization, district/division, AI, and report/settings data scoped; inherently unscopable legacy marketplace/automation metrics fail closed for non-global actors.
- Recruitment: direct career-application scope, dashboard/grouped aggregates, details, interviews, RM performance, and employee selectors scoped.
- Documents: metadata listing and mutation access inherit application/enrollment scope; no storage/download system was introduced.

### Authorization

One flow is used throughout: authenticated active user -> permission -> effective scope -> relationship-aware predicate/assertion -> database operation. Explicit scope assignments narrow global grants, and scoped ambiguity denies access.

### Database

Schema and migration are additive and validated. No destructive operation was generated or run.

### Production Migration

**NOT EXECUTED**, because this workspace does not establish a safe non-production database or prove business scope assignments. The required transformation and rollback plan is documented.

### Tests

**48/48 passed across 12 files.** ESLint, TypeScript, Prisma validation, Prisma Client generation, and the production build pass.

### Remaining Gaps

No critical implementation blocker remains for Phase 1. Production normalization, migration execution, and database-backed smoke testing remain deployment gates.

### Deferred Work

Secure object storage/downloads, shared rate limiting, session rotation/MFA, payment and communications rebuilds, automation/queue infrastructure, portfolio/Nice Jobs/mobile work, advanced AI architecture, and broad UI redesign remain Phase 2 or later.

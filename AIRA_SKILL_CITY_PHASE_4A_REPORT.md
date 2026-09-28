# PHASE 4A STATUS: PARTIAL - DATABASE VALIDATION BLOCKED

## 1. Existing Advisor Architecture

The repository previously contained Academic Advisor recruitment catalog entries and an Employee `Designation`, but no operational Student/Batch assignment or advisor ownership check. No existing advisor assignment model was replaced.

## 2. New/Modified Assignment Architecture

Added one authoritative `AcademicAdvisorAssignment` from Employee to exactly one Student or Batch. It stores active/inactive status, effective dates, creator, timestamps, and retained history. No `AdvisorUser`, duplicate Student, duplicate Batch, or separate authorization system was created.

## 3. Student Assignment

Authorized Directors/Admins can create a direct assignment to an active enrolled Student. Server actions validate permission, actor scope, advisor eligibility, active enrollment, organization compatibility, date order, and overlapping direct ownership. Direct assignment is explicit and takes precedence over batch inheritance.

## 4. Batch Assignment

Authorized Directors/Admins can assign an advisor Employee to a scoped Batch. Students currently enrolled in that Batch inherit advisor access unless they have an effective direct assignment. No permanent per-student copies are generated from a batch assignment.

## 5. Effective Dates

Effective access requires `ACTIVE`, `startsAt <= now`, and no `endsAt` or `endsAt > now`. Future and expired records grant no access. Ending sets `INACTIVE` and an end time without deleting history. Overlapping direct student ownership and duplicate advisor/batch windows are rejected.

## 6. Organization Compatibility

Assignment mutations validate the actor's permission scope for both advisor and target. The advisor's primary or effective secondary Employee organization assignment must cover the target Program/Batch institution, division, and centre. Client-submitted identifiers do not establish scope.

## 7. Permissions

Added centralized `advisor.read`, `advisor.assign`, and `advisor.manage`. Academic Advisor receives `advisor.read` at `OWN`; Admin and Director receive global grants through the additive migration/seed architecture. Designation remains job metadata and does not grant authorization.

## 8. Access Enforcement

Added server-side advisor Student predicates and assertions. Advisors can read only directly assigned Students or Students in an assigned Batch. An effective direct assignment to another advisor blocks inherited Batch access. The Student dashboard resolves only the logged-in Student's advisor and exposes name/designation only.

## 9. Trainer Separation

Trainer access continues to use `TrainerAssignment` and `trainer.access`. Advisor assignment does not grant trainer batch, attendance, submission, or assessment privileges. Existing trainer behavior and tests remain green.

## 10. Data Normalization

Added read-only `npm run audit:academic-advisors` and `docs/architecture/PHASE_4A_ADVISOR_DATA_NORMALIZATION.md`. It inventories role/designation mismatches, missing Employee profiles, assignment coverage, duplicate direct ownership, organization mismatches, inactive advisor accounts, and active enrollments without advisor coverage. No assignments or business values are inferred automatically.

Live normalization results are unavailable because no `DATABASE_URL` exists in the process or repository environment files.

## 11. Database Changes

Additive migration `20260928000100_add_academic_advisor_assignments` creates:

- `AcademicAdvisorAssignmentStatus` enum;
- `AcademicAdvisorAssignment` table;
- exactly-one-target and date-order check constraints;
- advisor, student, batch, creator foreign keys;
- effective lookup indexes;
- centralized role, permissions, and standard role grants.

The migration contains no drop, truncate, delete, destructive rename, or mutation of existing Employee, User, Enrollment, Batch, Trainer, recruitment, CRM, or learning records.

## 12. Migration Status

Migration SQL was inspected and is additive. Production migration was not executed. Migration rehearsal and database-backed smoke tests were not executed because `DATABASE_URL` is unavailable. Pending Phase 1A/2 migrations must be confirmed before deployment.

DATABASE VALIDATION:
BLOCKED - DATABASE_URL UNAVAILABLE

## 13. Tests

Vitest: PASS, 105/105 tests across 20 files.

Phase 4A added 20 tests covering student and batch assignment input, target integrity, malformed/effective/expired/future dates, overlaps, direct precedence, assigned/unassigned Student access, trainer denial, direct/batch advisor resolution, authorized creation, unauthorized mutation, organization mismatch, overlap rejection, atomic audit creation, and non-destructive assignment ending. All previous 85 tests remain green.

## 14. Build Validation

- ESLint: PASS
- TypeScript: PASS
- Prisma Client generation: PASS, Prisma Client 6.19.3
- Prisma schema format: PASS
- Prisma validation: BLOCKED only by missing `DATABASE_URL` (`P1012`)
- Next.js production build: PASS
- Static generation: PASS, 42/42 pages
- New `/director/advisor-assignments` route: compiled successfully

The first sandboxed build could not fetch the existing Google-hosted Inter font; the approved network-enabled rerun passed. This was environmental and unrelated to Phase 4A code.

## 15. Remaining Gaps

- Database-backed migration rehearsal, inventory, and smoke tests remain blocked by missing `DATABASE_URL`.
- Existing advisor Employees must be manually reconciled with the new role and verified organizational assignments.
- Student/Batch advisor ownership must be assigned from verified operations data; it is intentionally not inferred.
- No standalone advisor dashboard, notes, follow-ups, risk workflow, messaging, or analytics was built. The scoped backend query foundation is ready for a later explicitly authorized phase.

Phase 4A stops here. Phase 5 and unrelated HR, academic, communication, payment, AIRA Labs, Nice Jobs, Career Hub, and mobile work were not started.

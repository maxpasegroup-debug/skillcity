# Phase 1 Production Migration Plan

No production database migration was executed during implementation.

## Preconditions

1. Take and verify a restorable PostgreSQL backup.
2. Run the inventory queries below against a read replica or during a low-impact window.
3. Review unknown role names, duplicate organization labels, orphan relationships, and unscoped records.
4. Rehearse migration, seed, normalization, and rollback against a recent production clone.
5. Schedule a low-write deployment window for indexes and foreign keys.

## Classification

| Data/change | Current -> transformation -> target | Classification |
| --- | --- | --- |
| Schema objects | Existing tables -> additive enums/tables/nullable columns/indexes/FKs -> Phase 1 schema | Automatic and safe after backup/rehearsal |
| Role names | Existing names -> idempotent key/permission seed -> stable role bundles | Automatic, then review |
| User-role rows | Existing assignments -> no reassignment -> preserved memberships | Automatic preservation |
| Pipeline stages/source | Runtime bootstrap -> idempotent seed -> explicit reference data | Automatic, review custom ordering |
| Campus type | Existing campus -> default `CAMPUS` -> reviewed branch/centre/campus/office type | Manual classification |
| Divisions/districts | Missing typed rows -> create approved hierarchy -> linked organization units | Manual |
| Employees | Partial institution/campus/department -> reviewed division/district links -> complete scope | Manual/review |
| Additional employee assignments | Single primary placement -> approved effective-dated secondary rows -> multi-scope employee | Manual; blocked without HR evidence |
| Reporting managers | No normalized relation -> approved manager mapping -> nullable `Employee.managerId` | Manual |
| Leads | Mostly unscoped -> map from verified owner/program/business routing -> direct scope | Manual; unsafe to infer from free text |
| Career applications | Unscoped public submissions -> HR triage assigns owning scope -> direct scope | Manual |
| Programs/batches | Existing relationships -> verify institution/division/campus ownership -> inherited learning scope | Review/manual corrections |
| Users needing restricted access | Broad role only -> approved `UserAccessScope` rows -> least-privilege access | Manual approval required |
| Documents/invoices/applications | Existing relationships -> validate inheritance chain -> derived scope | Review; repair ambiguous rows |

## Inventory Queries

Run read-only counts before deployment for:

- roles whose names/keys are not in the approved role catalog;
- active employees with no organization fields;
- programs with no institution/division/campus/department;
- leads and career applications with all scope fields null;
- campuses whose district belongs to a different institution;
- employees/departments whose linked units resolve to different institutions;
- documents without application or student, and invoices without any ownership path;
- users with multiple active explicit assignments that will create ambiguous ownership.

Store counts and reviewed exceptions with the deployment ticket. Do not normalize from `city`, `state`, candidate `district`, or names alone.

## Deployment Sequence

1. Put schema-changing admin operations into a maintenance window; ordinary reads may remain available if rehearsal confirms lock timing.
2. Run `prisma migrate deploy` with the reviewed migration.
3. Run the idempotent seed once to create permission grants and admission reference data.
4. Run the approved manual normalization script or reviewed SQL in small, auditable batches.
5. Add explicit user scope assignments only after employee and hierarchy data is verified.
6. Test two organizations plus two districts/branches using Admin, scoped executive, admissions, HR, BDM, trainer, and student accounts.
7. Verify cross-scope list, detail, mutation, aggregate, Tara-context, and document metadata denial.
8. Monitor authorization errors, slow queries, FK failures, and lock duration.

## Rollback

- Application rollback: deploy the prior application version. Additive nullable columns/tables remain compatible.
- Data rollback: restore reviewed normalization batches from captured before-values; do not drop Phase 1 objects during an incident.
- Migration rollback: restore the verified backup only when database recovery is required. The migration intentionally contains no destructive down step.

## Deployment Blockers

- No verified backup or clone rehearsal.
- Unknown role mapping that would grant broader permissions.
- Cross-organization parent relationships.
- Scoped staff assigned before their owned records are normalized.
- Migration lock duration not measured on production-sized tables.

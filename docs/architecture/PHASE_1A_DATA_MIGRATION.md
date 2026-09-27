# Phase 1A Data Migration

No database migration or production data update was executed during Phase 1A.

## Migration Artifact

`20260927000200_add_employee_organization_assignments`

The migration is additive:

- adds nullable `Employee.managerId`;
- creates `EmployeeOrganizationAssignment`;
- adds lookup indexes and foreign keys;
- drops or renames nothing.

It depends on the earlier additive Phase 1 migration that creates `Division` and `District`.

## Current To Target Mapping

| Current data | Transformation | Target | Classification |
| --- | --- | --- | --- |
| `User` with no employee | Preserve | Non-employee identity | Automatic preservation |
| `User` with `Employee` | Preserve unique `Employee.userId` | One identity and one personnel profile | Automatic preservation |
| Employee organization fields | Keep unchanged | Primary assignment compatibility fields | Automatic preservation |
| Proven extra division/location/department duties | Create reviewed assignment rows | Active additional assignments | Manual |
| Unproven extra duties | Do not infer | Remain unresolved | Blocked pending business data |
| Reporting manager | Populate only from approved HR reporting data | `Employee.managerId` | Manual |
| Existing campus type/district links | Retain; classify through the Phase 1 plan | Normalized location tree | Manual/review |

## Rules

- Do not create an additional assignment that simply duplicates the primary assignment.
- Do not infer assignments from role names, email domains, city text, candidate district text, or dashboard access.
- Every referenced division, district, campus, and department must belong to the assignment's organization.
- A campus district must match the selected district when both are supplied.
- A department's configured division/campus must match when those values are supplied.
- `startsAt` and `endsAt` must reflect approved effective dates. Historical rows may be retained with an end date.
- Employee reporting lines must not be inferred from titles alone.

## Pre-Deployment Inventory

1. Employees with no organization primary field.
2. Employees whose primary units resolve to different organizations.
3. Campuses linked to a district from another organization.
4. Departments whose organization, division, and campus disagree.
5. Duplicate user accounts believed to represent one person.
6. Approved cross-functional assignments and their effective dates.
7. Approved reporting-manager relationships, including cycle checks.

## Deployment Sequence

1. Verify backup and rehearse both Phase 1 migrations on a recent clone.
2. Run `prisma migrate deploy`; do not use `db push` or reset.
3. Confirm existing employee reads and authentication before adding assignment data.
4. Insert reviewed assignments in auditable batches.
5. Verify primary plus additional scope resolution for representative employees.
6. Verify expired assignments no longer contribute scope.
7. Retain before-values for every manual manager or assignment update.

## Rollback

Application rollback does not require dropping the additive table or nullable manager column. Manual assignment rows can be end-dated or removed only from the reviewed migration batch using captured identifiers. Do not perform a destructive schema rollback during an incident.

# Phase 2 Employee Data Normalization

No production migration or data update was executed. This workspace has no `DATABASE_URL`, so the live aggregate inventory could not be run. The read-only command `npm run audit:employees` is provided for an approved environment; it returns counts only and does not print employee PII.

## Required Inventory

Run the audit before migration and record:

- total Employee rows and status/type distribution;
- missing and case-insensitive duplicate employee codes;
- missing User relationships or duplicate personnel identities;
- missing legacy titles and normalized designations;
- missing joining dates and invalid exit-date combinations;
- missing primary organization placement;
- employees with no valid primary or active additional assignment;
- reporting lines with missing managers, cross-organization managers, or cycles;
- Trainer-role Users without an Employee;
- selected recruitment candidates without an Employee;
- existing assignments with invalid hierarchy, overlap, or unapproved dates.

The current schema guarantees unique `Employee.userId`; existing code also declares employee code unique, although null and historical formatting still require review.

## Current to Target

| Current data | Transformation | Target |
| --- | --- | --- |
| User with Employee | Preserve unique link | One authentication identity and one personnel record |
| User without Employee | Preserve unless HR confirms employment | Non-employee identity or reviewed Employee creation |
| Employee code present | Trim/uppercase only after collision review | Stable unique human-readable code |
| Employee code missing | Do not invent | HR-approved code required |
| Legacy `Employee.title` | Map only through approved title catalogue | `Employee.designationId`; retain title during transition |
| Assignment designation text | Map only exact approved values | Assignment `designationId`; retain text during transition |
| Existing Employee organization fields | Preserve | Primary placement compatibility fields |
| Approved secondary duties | Validate hierarchy and dates | Existing EmployeeOrganizationAssignment rows |
| Existing status/type/dates | Preserve unless contradictory | Controlled employment state and dates |
| Approved reporting record | Validate scope and cycle | `Employee.managerId` |
| Trainer User | Link existing Employee when confirmed | Employee -> User -> TrainerAssignment |
| Selected candidate | Explicit HR provisioning | Candidate -> Employee -> User, in approved order |

## Safe Automatic

The following may be automated only after a dry-run report and backup:

1. Seed the fixed permission keys and reviewed designation catalogue idempotently.
2. Map legacy title text to Designation only when normalized text has one exact approved match.
3. Map assignment designation text under the same exact-match rule.
4. Normalize employee-code case/outer whitespace only when the dry run proves no collision and HR approves the canonical format.
5. Report missing/invalid data without changing it.

Every automatic operation must be idempotent and produce before/after counts.

## Manual Review Required

- Create or assign missing employee codes.
- Merge or resolve suspected duplicate people/User accounts.
- Decide designations for missing, ambiguous, obsolete, or free-text titles.
- Confirm employment status, employment type, joining date, and exit date.
- Confirm primary and secondary organizational placement and effective dates.
- Confirm reporting managers; never infer a manager from title, role, or department.
- Confirm whether Trainer-role Users are employees, contractors, or external trainers.
- Approve conversion of selected candidates to User/Employee.
- Resolve any cross-organization hierarchy or assignment conflict.

## Deployment Sequence

1. Verify a current backup and rehearse migrations `00100`, `00200`, and `00300` on a recent clone.
2. Run the aggregate employee audit against the clone, then production under approved read-only credentials.
3. Review migration SQL, enum behavior, lock duration, and generated query plans.
4. Run `prisma migrate deploy`; never use reset or destructive `db push`.
5. Run the idempotent seed to create Designation and employee permission records/grants.
6. Verify authentication and existing trainer, admissions, recruitment, and executive flows.
7. Execute only approved safe mappings; export unresolved rows for HR review.
8. Test global, organization, district, branch, department, and cross-organization denial with representative users.

## Rollback and Risk

The migration adds enum values, a table, and nullable foreign keys. Application rollback can stop using the new fields while preserving them. Do not attempt to remove enum values or drop Designation during an incident. Restore application behavior first, retain data, and investigate. Manual normalization needs its own reversible scripts and approval log.

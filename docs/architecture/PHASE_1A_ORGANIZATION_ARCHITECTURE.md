# Phase 1A Organization Architecture

## Context

The repository already contained the completed Phase 1 organization and permission implementation when this Phase 1A pass began. This work preserves that implementation and closes the remaining organization-foundation gap: one employee serving multiple organizational scopes without duplicate user accounts.

## Hierarchy

`Institution (Organization)`

- `Division`: operating vertical.
- `District`: normalized geographic operating area with state and country attributes.
- `Campus`: branch, centre, campus, or corporate office; optionally belongs to a district.
- `Department`: function that may be organization-wide or attached to a division/campus.
- `Employee`: personnel profile for exactly one `User`, with one primary organizational placement.
- `EmployeeOrganizationAssignment`: time-bounded additional placement across a division, district, campus, or department.

Division and District are parallel dimensions beneath the organization. A campus belongs directly to an organization and may belong to a district. Programs connect divisions and campuses where operationally relevant. This avoids forcing every division to duplicate the geographic tree.

## Existing Models Reused

- `Institution` remains the organization/company root. Renaming it would create broad migration risk without adding capability.
- `Campus` remains the physical/operational location model and uses `OrganizationUnitType`.
- `Department` remains the functional-unit model.
- `User` remains the login identity.
- `Employee` remains the personnel profile and primary assignment.
- `Division` and `District`, already introduced additively in Phase 1, remain normalized typed models.
- `UserAccessScope` remains the explicit authorization assignment model. It is not an employment record.

## User And Employee

`User -> Employee` is one-to-zero-or-one through unique `Employee.userId`. A user is the authentication identity; an employee is the organizational profile. Additional organizational work creates assignment rows, never additional users.

`Employee.managerId` represents the primary reporting manager. Per-assignment managers and matrix reporting are deferred until a real HR workflow requires them.

## Employee Assignments

The nullable organization fields on `Employee` remain the primary assignment and compatibility path for existing queries. `EmployeeOrganizationAssignment` stores additional time-bounded assignments with:

- required organization;
- optional division, district, campus, and department;
- optional designation;
- start and end dates.

Active additional assignments participate in employee scope fallback. Expired or future assignments do not. Server validation rejects cross-organization units and incompatible district/campus or division/campus/department combinations.

## Organizational Scope

An employee's organization scope is the union of the primary placement and active additional assignments. The existing permission system may further narrow that scope with explicit `UserAccessScope` rows. Employment assignments and authorization grants remain distinct records because employment does not always imply application access.

## District Strategy

`District` stores a normalized organization-owned district/region with `stateName`, optional `stateCode`, and `countryCode`. No Kerala-specific values are embedded. A separate Country or State table is not justified yet; the current fields support India-wide expansion without creating speculative geography administration.

## Organization Service

`server/organization/service.ts` is the internal query boundary for organizations, divisions, districts, campuses, departments, and employee assignments. It uses the existing server-side organization permission and scope checks and is not exposed through a public route.

Pure hierarchy validation and employee-scope composition live in `lib/organization/hierarchy.ts` so they can be tested without a database.

## Team Decision

No `Team` model was added. Current operational groups are represented by departments, batches, trainer assignments, and ownership relationships. A Team model should be introduced only when a concrete workflow needs stable team membership, leadership, or lifecycle behavior.

## Current Limitations

- Existing employee rows are not automatically backfilled into additional-assignment rows; their direct fields remain primary.
- No employee-assignment management UI was added.
- No employee-document, payroll, leave, attendance, or performance system was added.
- Database foreign keys ensure referenced rows exist, while same-organization consistency is enforced by server validation because PostgreSQL foreign keys cannot express the full multi-column hierarchy rule cleanly.
- Production migration and data normalization remain unexecuted.

## Future Permission Interaction

The repository's existing permission layer already consumes active employee assignments as fallback scope. Future policy work should continue to distinguish organization membership from permission grants and should not infer access from inactive assignments.

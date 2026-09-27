# Phase 1 Authorization and Organization Scope

## Decision Summary

`Institution` is the organization boundary. `Division`, `District`, `Campus` (branch/centre/campus/corporate office), and `Department` are typed operational scopes. The application remains a single database with row-level authorization enforced in server code.

Authorization is evaluated as:

`active session -> permission grant -> effective user scope -> resource relationship -> Prisma predicate or mutation assertion`

UI visibility is not an authorization boundary.

## Effective Scope Rules

- Explicit, unexpired `UserAccessScope` rows narrow broad role grants, including a `GLOBAL` role grant.
- Without an explicit assignment, a `GLOBAL` grant remains global.
- Non-global role grants fall back to matching fields on `Employee`.
- `OWN` adds only ownership/assignment access and never expands organization scope.
- A scoped grant with no usable assignment fails closed.
- Multiple assignments are combined as an OR. Creation that needs one owning scope rejects ambiguous multi-scope actors.

## Authoritative Ownership

| Resource | Authoritative scope |
| --- | --- |
| Employee | Direct primary organization fields plus active additional `EmployeeOrganizationAssignment` rows |
| Lead | Direct organization/division/district/campus fields |
| Career application | Direct organization/division/district/campus fields |
| Program | Direct institution/division/campus/department fields |
| Batch | Explicit campus; otherwise program |
| Admission application | Lead; program only when the legacy lead is entirely unscoped |
| Student enrollment | Batch when assigned; otherwise program |
| Student document | Admission application; otherwise student enrollment |
| Fee invoice | Lead, then batch, then program, then student enrollment |
| Activity/calendar item | Batch when assigned; otherwise journey/program |
| Trainer/student access | Active trainer assignment or the authenticated student's enrollment |

Ambiguous all-null legacy records are not exposed to scoped users. Global actors can review and normalize them.

## Implementation Boundaries

- `lib/auth/permissions.ts`: permission catalog, compatibility grants, and effective-scope resolution.
- `server/auth/authorization.ts`: route/action guards.
- `server/auth/scoping.ts`: reusable Prisma predicates.
- `server/auth/resource-access.ts`: mutation and detail-record assertions.
- Module query/action services apply those predicates close to each database operation.

## Covered Phase 1 Domains

Admissions aggregates and operations, programs and batches, director views, executive/finance views, recruitment and RM performance, document metadata, BDM workspaces, and Tara admissions/BDM context use server-side scope enforcement.

Public applications remain intentionally unscoped until a branch or organization is selected or assigned. They require manual triage before scoped staff can process them.

## Deferred Boundaries

- Object storage, signed downloads, scanning, and document retention remain a later storage phase.
- Database row-level security is not enabled; Prisma service code is the enforcement boundary.
- Temporary elevation, break-glass access, delegated approvals, and shared distributed rate limiting are not implemented.

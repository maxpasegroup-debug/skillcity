# ADR-002: Authorization and Permissions

- Status: Accepted and implemented for Phase 1
- Date: 2026-09-27

## Context

Authorization currently checks hardcoded role names in layouts and server/query modules. Some guards check authentication only. No permission, role-permission, scope-assignment or policy model exists.

## Decision

Introduce a permission-based policy layer in Phase 1 while retaining roles as permission bundles. Authorization decisions must combine:

1. principal status and roles;
2. action/resource permission;
3. organization and operational scope;
4. ownership/relationship constraints;
5. resource state where relevant.

Server-side checks are authoritative. Navigation visibility is convenience only. Every mutation and sensitive read must call a policy function close to the domain boundary.

## Required Scopes

- Company/division
- Region/district
- Campus/centre/branch
- Department/team
- Batch/program/journey
- Lead/application ownership or assignment
- Student/self/guardian relationship where introduced

Scope must be explicit in policy inputs. A global role such as Admin must be intentionally granted global scope rather than inferred from a string.

## Migration Direction

- Inventory current guards and map each role check to named permissions.
- Add permissions and scoped assignments additively.
- Implement policy checks behind compatibility helpers.
- Close authenticated-only student/community/success gaps.
- Add denial and cross-scope tests before switching routes.
- Remove direct role-name checks only after coverage is complete.

## Implemented Scope Semantics

- Explicit active user assignments narrow broad role grants.
- Global applies only when no explicit narrowing assignment exists.
- Employee organization fields provide fallback assignments for non-global grants.
- Own access is additive and relationship-bound.
- Missing or unusable scoped assignments fail closed.
- Prisma predicate builders and record assertions are the shared server boundary.

## Unresolved Decisions

- Permission naming/versioning beyond the Phase 1 catalog.
- Temporary delegation and emergency access.
- Emergency access and audit/approval requirements.
- Caching and invalidation for permission changes.

## Consequences

The model supports district and campus operations without embedding those rules in every route. Phase 1 must avoid an all-at-once migration and preserve current access until equivalent policies are verified.

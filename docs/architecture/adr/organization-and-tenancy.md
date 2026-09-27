# ADR-003: Organization and Tenancy

- Status: Accepted and extended in Phase 1A
- Date: 2026-09-27

## Context

The original schema had `Institution`, `Campus`, `Department` and `Employee` but lacked explicit division and district nodes. Phase 1 added those nodes and scoped business records. The remaining Phase 1A gap was that `Employee` could express only one division/location/department even though one AIRA identity may serve several.

## Decision

Adopt the intended hierarchy:

`Institution/Organization -> Division and District -> Campus/Centre/Branch -> Department / operational scope`

The hierarchy is a business partition inside one application and database unless later scale or regulation requires physical tenancy. Records must carry or derive an unambiguous owning scope. Authorization policies enforce that scope; UI filters do not provide isolation.

Existing `Institution`, `Campus` and `Department` records are retained. `Division` and `District` are additive typed models. `Campus.type` distinguishes branch, centre, campus, and corporate office. This does not hard-code a state or district list.

`Employee` retains direct organization fields as its primary placement. `EmployeeOrganizationAssignment` represents additional effective-dated placements. `Employee.userId` remains unique, so additional assignments never require duplicate login identities. `Employee.managerId` represents the primary reporting line.

## Requirements

- Stable identifiers and auditable moves/renames.
- Explicit parent-child constraints and lifecycle status.
- Membership/assignment records with validity periods.
- Defined ownership for leads, employees, students, batches, invoices and reports.
- Global/shared records distinguished from tenant-owned records.
- Cross-scope reporting through authorized aggregation.

## Ownership Decision

Direct scope is used for independently routed records such as employees, leads, programs, and career applications. Applications, enrollments, batches, documents, invoices, activities, and trainer/student access derive scope through documented authoritative relationships.

Employee organization membership is the union of the primary placement and active additional assignments. Authorization grants remain separate from employment assignments; explicit user access may narrow the effective permission scope.

## Alternatives Considered

- Rename `Institution` to Company: rejected because it adds widespread migration risk without new capability.
- Generic recursive organization-unit table: deferred because typed existing models have active relationships and clearer constraints.
- Replace direct Employee fields with only an assignment table: rejected for now because it would break existing queries and require an unsafe data rewrite.
- Add a Team model immediately: deferred because no current workflow owns stable team membership or lifecycle rules.
- Duplicate a User/Employee per division: rejected because identity must remain central.

## Rationale

The hybrid primary-plus-additional model is additive, keeps live behavior stable, supports cross-functional employees, and provides a clear later migration path. Normalized District and typed Campus support geographic expansion without embedding a specific state.

## Migration Implications

- Existing employee fields remain unchanged and require no automatic backfill.
- Additional assignments and reporting managers are created only from approved business data.
- Parent consistency is validated server-side before writes.
- Migration artifacts add nullable fields/tables/indexes/foreign keys only and are not executed automatically.

## Unresolved Decisions

- District versus region cardinality and naming by geography.
- Cross-campus programs and students.
- Whether primary employee fields eventually become a maintained compatibility projection of assignment data.
- Per-assignment reporting managers and matrix organization behavior.
- Archival and transfer semantics.

## Consequences

The organization model supports central identity and multi-scope employment without duplicating accounts. Application services must validate cross-parent consistency, and production assignment data requires manual review. The existing permission layer can consume active employee assignments but must continue treating organization membership and access grants as separate concepts.

# Phase 8 Compliance Architecture

## Boundary

Compliance is a scoped operational control register, not legal advice or a generic workflow engine. `ComplianceRecord` references existing organization and person/business entities; it does not duplicate Employee, Student, Employer, Program, or Document identity.

## Record

A record contains stable code, subject type/reference, responsible organization path, responsible Employee, reviewer Employee, status, effective/expiry/review dates, supporting central documents, and audit identity. Subject references are validated server-side by type. Responsible/reviewer employees must be active and have an effective assignment covering the record scope.

Statuses are `PENDING`, `ACTIVE`, `EXPIRED`, `REJECTED`, `WAIVED`, and `ARCHIVED`. Transitions are explicit. An active record past its expiry is presented as effectively expired without silently rewriting history; future automation can perform reviewed transitions and notifications.

## Documents

`ComplianceDocument` associates a `CoreDocument` with a record. Both records must belong to the same organization and be authorized for the actor. The association does not expose storage references.

## Authorization

Permissions are `compliance.read` and `compliance.manage`. Compliance Manager receives organization scope. Admin, Director, CEO, and COO receive global scope. List, create, status change, reviewer assignment, subject validation, and document association are enforced server-side.

## Audit

Creation, status changes, and document attachment use `PlatformAudit`. Archived records and attached documents are retained.

## Deferred

- Notifications for review/expiry
- Generic approval workflows
- Jurisdiction-specific legal rules
- Automated compliance decisions
- Vendor and policy-acknowledgement workflows

# Phase 2 Employee and HR Foundation

## Purpose

Phase 2 establishes one central personnel model without building an HRMS. It preserves the Phase 1 identity, permission, organization, and scope systems.

`User (authentication) -> Employee (personnel) -> Employment -> Primary/additional organization assignments -> Designation -> Manager -> Employment status`

## Existing Architecture Audit

### Employee

- UUID primary key and unique `userId` already provided one User-to-Employee relationship.
- Nullable unique `employeeCode` already existed and is retained. New creates require a code; legacy nulls require normalization.
- Name and official email remain on the linked User. No duplicate personal identity fields were added.
- `employmentType`, `status`, `joinedAt`, and `exitedAt` already existed.
- Phase 1A `managerId` is retained as the self-referencing reporting line.
- Direct organization fields remain the primary placement and compatibility path.
- Phase 1A `EmployeeOrganizationAssignment` remains the only additional assignment model.
- Legacy `title`, performance, leave, and payroll fields remain untouched for compatibility. New HR modules were not built around them.

### User

User remains the authentication identity with password/session, account status, roles, and explicit access scopes. Employee remains personnel identity. Employment status never changes User account status automatically.

### Existing Consumers

| Area | Current relationship | Phase 2 decision |
| --- | --- | --- |
| Admissions | Scoped Employee lists select operational staff | Preserved |
| Trainer | `TrainerAssignment.trainerId -> User`; trainer selection requires an Employee in scope | Preserved as operational profile behavior through `User.employeeProfile` |
| Academic Advisor | Recruitment role catalogue plus authorization role; no duplicate profile model | Use Employee + Designation + Role after hiring |
| Recruitment | `CareerApplication.employeeId` and RM development point to Employee | Preserved; candidate conversion remains an explicit HR step |
| Executive | Existing employee aggregates and HR/recruitment view | Preserved; employee writes move to the scoped Employee module |
| CRM | Relationship-manager development links to Employee | Preserved |
| Documents | Only student documents currently exist | No competing employee document model added |
| Administration | User/role management remains separate | Preserved |

## User and Employee

`Employee.userId @unique` enforces zero-or-one Employee per User. Employee creation links an existing, non-deleted User by email. It does not create a second account or authentication system. User account provisioning and employee provisioning remain separate lifecycle steps.

## Designation

`Designation` is a normalized, centrally managed job-title catalogue with stable key, unique name, description, and active state. Employee and additional assignments may reference it. Legacy text title/designation fields remain during normalization and are populated for compatibility on new writes.

Designation has no permission relation. A title such as Academic Advisor describes work; RolePermission determines access.

## Employment State

Existing `ACTIVE`, `ON_LEAVE`, and `EXITED` states are retained. `PROBATION`, `ON_NOTICE`, and `INACTIVE` are added for current employee lifecycle and non-destructive deactivation. Existing FULL_TIME, PART_TIME, CONTRACT, and INTERN employment types are retained; no speculative types were added.

New and updated records validate that exit date is not before joining date. Deactivation sets Employee to INACTIVE, records exit date, and closes active additional assignments. It does not delete history or suspend the User.

## Organization Assignments

Direct Employee organization fields remain the primary assignment because existing admissions, recruitment, and scope queries depend on them. `EmployeeOrganizationAssignment` stores multiple additional effective-dated placements. Phase 2 adds an optional normalized designation reference to that existing model and retains its legacy designation text.

All writes validate permission, target organization scope, unit existence, and hierarchy consistency on the server. Overlapping duplicate placements are rejected. Active additional assignments continue to participate in Phase 1 effective-scope resolution; employment assignment alone does not create a permission grant.

## Reporting Manager

The Phase 1A `Employee.managerId` relation is reused. A manager must be visible under the actor's mutation permission and share the employee organization through a primary or active additional assignment. Self-reporting and direct/indirect cycles are rejected. Matrix and per-assignment managers are deferred.

## Permission and Scope Behavior

Phase 2 adds `employee.read`, `employee.create`, `employee.update`, and `employee.manage` to the existing permission catalogue. Admin and Director retain global grants. CEO/COO receive global read. HOD receives organization read. HR Manager receives organization read/create/update/manage; HR Executive receives organization read/create/update.

Database RolePermission rows remain authoritative. Deployment must run the existing idempotent seed after migration so new permission rows and grants exist.

Directory, detail, option lists, and every mutation use the existing `employeeScopeWhere`, record assertions, organization hierarchy validator, and authorization session. Client filtering is convenience only.

## Employee UI

`/employees` provides a scoped directory with code, name, designation, department, division, district, branch/centre, and status. Detail shows organization, reporting, identity, employment, and additional assignments. Authorized users can create, edit, add/end assignments, and deactivate records. No payroll, leave, attendance, performance, or document UI was added.

## Integrations

- Trainer remains an operational User assignment backed by one Employee identity; batch and learning behavior are unchanged.
- Academic Advisor remains a recruitment role until selection. After hiring it is represented by Employee, Designation, and authorization Role, not another person table.
- Recruitment already supports `Candidate -> selected CareerApplication -> Employee`; User/Employee creation remains deliberate and is not automated from candidate data.
- Employee documents should extend the central authorized document architecture later. Phase 2 does not add storage or expose URLs.
- Existing PlatformAudit records employee create, update, assignment create/end, and deactivation.

## Database and Indexes

Migration `20260927000300_add_employee_hr_foundation` is additive. It creates Designation, adds nullable designation foreign keys, extends EmployeeStatus, and adds designation indexes. Existing unique User and employee-code indexes plus manager, status/organization, division, district, campus, and department indexes are retained. No table or production row is dropped, renamed, or rewritten.

## Deferred Decisions

- Employee document metadata and secure object storage.
- Employee self-service beyond the authorized HR directory.
- User invitation/account creation orchestration.
- Per-assignment managers and matrix reporting.
- Payroll, salary, attendance, biometric, leave, performance, appraisal, expenses, and offboarding automation.
- Converting legacy performance, leave, or payroll JSON fields; they remain untouched pending their own phases.

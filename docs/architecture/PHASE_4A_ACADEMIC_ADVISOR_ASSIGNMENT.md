# Phase 4A Academic Advisor Assignment Architecture

## Decision

Academic advising uses one authoritative `AcademicAdvisorAssignment` model. The advisor is an existing `Employee`; the advised target is exactly one existing `User` student or one existing `Batch`. No advisor identity, student record, batch record, CRM, or permission system is duplicated.

## Identity And Eligibility

The identity path is:

`User -> Employee -> Academic Advisor role -> AcademicAdvisorAssignment`

`Designation` describes the employee's job title and does not grant access. Operational advisor access requires the centralized `advisor.read` permission. Assignment management requires `advisor.assign` or `advisor.manage`. The assignment service accepts only an active Employee with an active User account and the Academic Advisor role. Employee organization placement must cover the selected academic target.

## Assignment Model

`AcademicAdvisorAssignment` records:

- `advisorId`: required Employee relationship;
- `studentId`: optional direct student target;
- `batchId`: optional batch target;
- `status`: `ACTIVE` or `INACTIVE`;
- `startsAt` and `endsAt`: effective period;
- `createdById`, `createdAt`, and `updatedAt`: provenance and history.

The database check constraint requires exactly one of `studentId` and `batchId`. A second check requires `endsAt` to be later than `startsAt`. Foreign keys use `RESTRICT` for advisor, student, and batch so historical assignments cannot be silently removed by cascades.

## Direct And Batch Assignment

Direct student assignment represents explicit care ownership. Batch assignment represents inherited coverage for the students currently enrolled in that batch; it does not copy permanent assignments to every student.

Precedence is deterministic:

1. An effective direct student assignment wins.
2. If no effective direct assignment exists, an effective assignment on the student's active batch applies.
3. A direct assignment to another advisor blocks access inherited from a batch assignment.

Only one overlapping direct assignment may exist for a student. An advisor also cannot receive duplicate overlapping assignments to the same batch. Different advisors may cover the same batch when operations require shared coverage.

## Effective Dates And History

An assignment is effective only when:

- status is `ACTIVE`;
- `startsAt` is at or before the current time;
- `endsAt` is null or after the current time.

Ending an assignment sets status to `INACTIVE` and records an end time. Records are not deleted. Reassignment creates a new row, retaining the prior advisor history.

## Organization Scope

Assignment creation validates three independent boundaries server-side:

- the actor can manage the advisor Employee in the actor's permission scope;
- the actor can manage the target Student or Batch in the actor's permission scope;
- an effective Employee organization assignment covers the target Program/Batch institution, division, and centre.

Student targets derive organization context from the current active Enrollment and its Program/Batch. Batch targets derive context from Batch and Program. Client-submitted identifiers never establish authorization.

## Advisor Access

Advisor student access uses `permission + assignment ownership`:

- `advisor.read` is required;
- the logged-in User must have an Employee profile;
- the Student must be reached by an effective direct assignment or effective assigned Batch;
- direct assignment precedence is applied before inherited Batch access.

The backend query service returns only assigned students. It is ready for advisor workflows without introducing a new standalone advisor application in this phase.

## Student Visibility

The student dashboard resolves the effective direct or inherited advisor and shows only the advisor's name and designation. It does not expose private employee contact data or another student's assignment.

## Trainer Separation

Trainer authorization remains based on `TrainerAssignment`. Academic advisor assignment does not grant trainer batch, submission, assessment, or attendance privileges. A person holding both responsibilities must receive both centralized roles/permissions and the corresponding assignments.

## Administration And Audit

The existing Director surface provides scoped student and batch assignment forms plus assignment history and a non-destructive end action. Creates and ends write `PlatformAudit` records in the same database transaction as the assignment mutation.

## Migration

Migration `20260928000100_add_academic_advisor_assignments` is additive. It creates the enum, table, checks, relationship indexes, role, permissions, and standard grants. It does not alter or delete existing Employee, User, StudentEnrollment, Batch, TrainerAssignment, recruitment, CRM, or learning records.

The production migration is not executed by this implementation. It must be reviewed and deployed through the repository's existing Prisma migration workflow after the pending Phase 1A/2 migration sequence is confirmed.

## Deferred Work

- advisor dashboard and case-management workflow;
- advisor notes, risk flags, interventions, follow-ups, and communications;
- automated load balancing or batch reassignment;
- notification delivery;
- advisor analytics and SLA reporting.

These features can consume the authoritative assignment model later without changing identity or access ownership.

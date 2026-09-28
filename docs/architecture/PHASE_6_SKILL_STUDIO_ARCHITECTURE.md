# Phase 6: AIRA Skill Studio Architecture

## Purpose

AIRA Skill Studio is an academic operating domain inside the central AIRA Skill City application. It provides short-form, workshop, bootcamp, masterclass, professional, and corporate skill programs without introducing another LMS, CRM, student identity, trainer identity, or enrollment system.

## Existing Architecture Reused

| Concern | Authoritative model/service |
| --- | --- |
| Program identity | `Program` |
| Curriculum | `Journey`, `JourneyPhase`, `JourneyWeek`, `JourneyDay`, `Activity` |
| Cohorts | `Batch` |
| Learners | `User` with Student role |
| Enrollment | `StudentEnrollment`, created through Phase 3 admission activation |
| Trainers | `User` linked to central `Employee`, assigned through `TrainerAssignment` |
| Progress | `StudentProgress`, `Submission`, assessments and existing journey services |
| Organization | Institution, Division, District, Campus/Centre, Department |
| Authorization | Phase 1 permission and effective organization scope services |
| Audit | `PlatformAudit` |

No `SkillStudioStudent`, `SkillStudioTrainer`, `SkillStudioEnrollment`, or duplicate course table was introduced.

## Program Classification

`Program.operatingDomain` identifies the operating context:

- `STARTUP_SCHOOL`
- `SKILL_STUDIO`
- `GENERAL`

The field is nullable to preserve existing data until it is reviewed. New Skill Studio creation always writes `SKILL_STUDIO`.

Skill Studio programs additionally use controlled, nullable metadata:

- `skillStudioType`: course, workshop, bootcamp, masterclass, professional program, or corporate training.
- `deliveryMode`: online, offline, or hybrid.
- `learningModel`: standard or ALTT.

These fields are required by the Skill Studio action schemas but nullable in the database for additive migration safety.

## Skill Studio vs Startup School

Startup School keeps its ALTT-centered academic journey. Skill Studio uses the same generic curriculum hierarchy but does not automatically become ALTT.

- `learningModel = STANDARD`: generic Journey and Activity progress, with no ALTT stage presented.
- `learningModel = ALTT`: existing ALTT stage mapping and progress presentation applies.
- Existing unclassified programs retain legacy behavior until manually normalized.

This makes learning methodology explicit without rebuilding curriculum or progress.

## Skill Studio vs AIRA Labs

Skill Studio `Program` records represent education delivered to learners. `LabsProduct` records represent technology products owned and operated by AIRA Labs. A time-bound learning program is not a Labs product, and an academic project remains inside the learning domain.

## Batch and Delivery

Skill Studio batches reuse `Batch`. `Batch.deliveryMode` may override the program-level mode for a specific offering. Offline and hybrid batches require a centre. Existing validation also enforces:

- Journey belongs to Program.
- Batch dates are ordered.
- Capacity is positive.
- Program and batch centres do not conflict.
- Actor can access the Program and selected organization hierarchy.

Capacity and duplicate enrollment remain enforced by the Phase 3 admission activation path and `StudentEnrollment` constraints.

## CRM and Enrollment Handoff

The authoritative lifecycle remains:

`Lead -> AdmissionApplication -> approved/payment verification -> Student -> StudentEnrollment -> Batch -> learning`

Skill Studio adds no direct enrollment mutation. The catalog and program detail expose enrollment counts, while actual activation remains in admissions. This prevents CRM and academic state from diverging.

## Trainer Assignment

Trainer assignment remains:

`User -> Employee -> Trainer role -> TrainerAssignment -> Batch`

The Skill Studio assignment action requires:

- `skill-studio.assign` permission.
- Batch access in effective organization scope.
- Active User and eligible Employee employment status.
- Existing Trainer role.
- Employee organization placement compatible with Program and Batch scope.

The role label `Skill Studio Trainer` distinguishes operational responsibility without creating another identity.

## Permissions and Scope

Central permissions are:

- `skill-studio.read`
- `skill-studio.create`
- `skill-studio.update`
- `skill-studio.manage`
- `skill-studio.enroll`
- `skill-studio.assign`

Server-side predicates combine permission scope with `operatingDomain = SKILL_STUDIO`. Organization-scoped users see only permitted programs and batches. Trainers with OWN scope see assigned batches. Students with OWN scope see programs from their own enrollments. Crafted slugs and IDs are resolved through these predicates before mutation or detail access.

`skill-studio.enroll` is provisioned for the centralized admission boundary; Phase 6 does not add a competing enrollment writer.

## UI

- `/skill-studio`: scoped internal catalog and authorized program creation.
- `/skill-studio/[slug]`: scoped program details, update, batch creation, and trainer assignment.
- `/my-skill-studio`: student-owned enrollment view.

Existing trainer pages automatically include Skill Studio batches because they already query `TrainerAssignment`.

## Audit

Program creation/update, batch creation, and trainer assignment write `PlatformAudit` records in the same transaction as the business mutation.

## Deferred Work

- Public marketing/catalog redesign.
- Certificates and credential policy expansion.
- Corporate client contracting and billing.
- New assessment or examination engine.
- Attendance rebuild.
- Career Hub handoff enhancements.
- Automatic classification of historical programs.
- Product analytics and advanced AI.


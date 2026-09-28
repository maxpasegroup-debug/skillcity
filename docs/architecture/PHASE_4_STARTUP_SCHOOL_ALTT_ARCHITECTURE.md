# Phase 4 Startup School and ALTT Architecture

## Decision

Phase 4 keeps the existing learning platform. AIRA Startup School is represented through scoped `Program` records, not hard-coded program names or a second LMS. Curriculum, delivery, evidence, and progress continue through the existing journey and ALTT models.

## Academic Inventory

| Concept | Authoritative implementation | Phase 4 decision |
| --- | --- | --- |
| Program | `Program` | Keep as the reusable, organization-scoped academic offering. |
| Curriculum | `Journey -> JourneyPhase -> JourneyWeek -> JourneyDay` | Keep as the versioned curriculum hierarchy. |
| Learning design | `LearningFlow -> LearningStep` | Keep as reusable ALTT flow attached to curriculum days. |
| Learning activity | `Activity` | Keep for content, live work, tasks, quizzes, projects, assessments, and resources. |
| Batch | `Batch` | Keep as the program/journey/centre cohort with dates and capacity. |
| Student | `User` with Student permission | Keep one identity. |
| Enrollment | `StudentEnrollment` | Keep as the authoritative program/journey/batch academic handoff. |
| Trainer profile | Active Employee-backed User with `TrainerAssignment` | Keep the operational trainer profile; no second identity. |
| Mentor | `TrainerAssignment.role` where mentoring is assigned | Keep as an Employee/User responsibility, not a new login or person table. |
| Academic Advisor | Employee/designation/recruitment foundation only | No operational student assignment currently exists. Deferred rather than duplicated. |
| Session | `CalendarEvent` plus `AttendanceSession` | Keep. Attendance expansion is outside Phase 4. |
| Assignment | `Activity` (`TASK`, `PROJECT`, `ASSESSMENT`) | Keep. |
| Submission | `Submission`, `SubmissionReview`, `ReviewQueue` | Keep. |
| Assessment | `QuizQuestion`, `QuizAttempt`, `AssessmentResult`, `TrainerFeedback` | Keep. |
| Progress | `StudentProgress`, `DailyLearningSession`, enrollment `currentDay` | Keep; do not duplicate progress. |
| Academic project | `Activity.PROJECT` or ALTT Build step plus `Submission` | Keep inside the learning context. |
| Portfolio evidence | `PortfolioProject` and `SkillEvidence` | Existing downstream success evidence; not rebuilt here. |
| Outcome | Progress, submission, assessment, portfolio, founder/career evidence | Reuse existing records; do not create speculative analytics tables. |

## Program and Curriculum

`Program` supplies name, description, duration, status, admission configuration, division, institution, centre, and department scope. It supports any number of Startup School programs without business-logic slugs.

Each versioned `Journey` belongs to one Program. Phases, weeks, and days provide module-like grouping without adding duplicate Module, Subject, Topic, or Lesson tables. `Activity` and `LearningStep` provide lesson, exercise, assignment, project, and assessment behavior.

## Batch Operating Model

A Batch connects Program, optional Journey, inherited Centre, trainer assignments, enrollments, activities, sessions, and capacity. Phase 4 batch creation now:

- verifies Program and Journey scope;
- rejects a Journey from another Program;
- inherits `Program.campusId` as the batch centre;
- rejects an end date before the start date;
- retains the existing positive capacity rule.

Enrollment capacity remains enforced by the Phase 3 admission activation and Phase 5 batch-assignment path using authoritative active enrollment counts. The existing student/program/journey unique key prevents duplicate enrollment.

## Student Journey

The academic path is:

`StudentEnrollment -> Batch -> Program/Journey -> Day -> Activity/LearningStep -> Submission/Assessment -> Progress/Outcome`

Student pages derive all work from the logged-in student's active enrollment. The dashboard shows current program, batch, learning day, tasks, project access, progress, and current ALTT stage. The Projects page now lists real project/Build activities from the active journey.

No second academic activation exists. Phase 3 creates the authoritative enrollment; Phase 4 consumes it.

## Trainer and Mentor

An operational trainer is:

`User identity -> Employee -> Trainer role/permission -> effective TrainerAssignment -> Batch`

Trainer assignment requires an active account, active employment state, trainer role, actor scope, and an employee organization assignment compatible with the batch institution/division/centre. Effective start/end dates are enforced for trainer access.

Mentoring uses the same Employee/User and `TrainerAssignment.role` architecture. A role label can describe Trainer or Mentor responsibility, while permissions continue to control access. Phase 4 does not create `MentorUser` or another authentication identity.

## Academic Advisor

The repository has Academic Advisor recruitment and Employee designation support, but no authoritative Student/Batch advisor assignment. Phase 4 does not infer advisor ownership from designation and does not create a parallel CRM. A future additive advisor assignment must use Employee, permission, effective dates, and existing student/enrollment scope.

## Sessions

`CalendarEvent` represents the scheduled batch/program/journey event. `AttendanceSession` records the trainer-led class context, with `AttendanceRecord` as current supporting behavior. Trainer class creation validates effective batch assignment and active batch status. Full attendance redesign is deferred.

## Assignments, Assessments, and Projects

- Assignment: batch-scoped or curriculum-wide `Activity` with due date, points, and submission evidence.
- Submission: student-owned `Submission`, optionally linked to Activity and LearningStep.
- Evaluation: `SubmissionReview`, `TrainerFeedback`, and `ReviewQueue`.
- Quiz: `QuizQuestion` and student-owned `QuizAttempt`.
- Assessment: student-owned `AssessmentResult` followed by trainer review.
- Project: `PROJECT` Activity or `PROJECT_TASK` LearningStep with Submission evidence.

Student mutations now validate day enrollment, batch-specific activities, learning-flow steps, reflection ownership, and assessment/quiz target type. Trainer queries and reviews validate the exact student, journey, batch, and activity rather than accepting any work belonging to a student who happens to share another assigned batch.

## ALTT

The central cycle is represented without another database model:

| Stage | Existing representation |
| --- | --- |
| LEARN | Video, live class, article, PDF, interactive reading, voice instruction, learning resource |
| PRACTISE | Task, quiz, coding practice, checklist, AI discussion, offline activity |
| BUILD | Project Activity, project task, file/submission evidence |
| DEPLOY | External link, presentation/meeting, published or delivered submission evidence |
| EARN | Explicit LearningStep metadata and reflection/evidence of customer or value outcome; no finance ledger |
| GROW | Reflection, assessment, feedback, improvement, and next journey action |

`LearningStep.metadata.alttStage` is the explicit stage when supplied. Existing flows remain compatible through type/title inference. Newly created flows contain Learn, Practise, Build, Deploy, Earn, and Grow steps. Progress remains in `DailyLearningSession`, `StudentProgress`, submissions, and assessments.

## Outcomes

Phase 4 represents outcomes with existing academic evidence:

- skill or knowledge: completed progress and assessment;
- project built: project activity plus submission;
- deployment: URL, presentation, pilot, or delivery evidence in submission metadata/content;
- value/earn evidence: explicit ALTT step response without finance-grade data;
- growth: trainer feedback, assessment, portfolio, founder, or career progression.

No financial system, deployment platform, venture manager, or outcome intelligence engine was added.

## Organization Scope and Ownership

- Program: direct institution/division/centre/department scope.
- Journey/curriculum: inherited through Program.
- Batch: inherited through Program with centre refinement.
- Enrollment: Batch when assigned, otherwise Program.
- Activities and sessions: inherited through Day/Journey/Program and optional Batch.
- Trainer: effective assigned Batch plus Employee organization compatibility.
- Student: own active Enrollment and own submissions/progress/results.

Director mutations use Phase 1 resource assertions. Student mutations derive identity from the session and reject cross-journey/batch IDs. Trainer reads and reviews derive scope from effective assignments, not client input or UI visibility.

## CRM to Academic Handoff

The only handoff remains:

`Lead -> AdmissionApplication -> verified admission activation -> StudentEnrollment -> optional Batch -> Journey learning`

Academic code reads active `StudentEnrollment`; it does not create or infer admissions. CRM and learning therefore share one enrollment state.

## Deferred

- Operational Academic Advisor-to-student/batch assignment.
- Team projects beyond current student submission evidence.
- Detailed Deploy/Earn outcome taxonomy and verified economic reporting.
- Full attendance workflows and advanced academic analytics.
- Database-backed relationship inventory while `DATABASE_URL` is unavailable.

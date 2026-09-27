# AIRA Skill City Architecture Map

Audit date: 2026-09-27
Workspace: `D:\APPS\WEB\skillcity`
Revision note: refreshed after completion of the Phase 0 repository guardrails.

This map describes what exists in the codebase, not the desired future system.

## Technology Stack

| Area | Current implementation | Evidence |
|---|---|---|
| Framework | Next.js App Router, React, TypeScript | `package.json`, `app/`, `next.config.ts` |
| Styling | Tailwind CSS with custom component primitives | `tailwind.config.ts`, `app/globals.css`, `components/ui/*` |
| Database | PostgreSQL | `prisma/schema.prisma` datasource |
| ORM | Prisma Client 6.19.3 installed (`^6.16.3` range) | `package.json`, `package-lock.json`, `lib/prisma.ts` |
| Auth | Custom session cookie and DB session model | `server/auth/session.ts`, `actions/auth.ts` |
| Password hashing | bcryptjs | `lib/security/password.ts`, `actions/auth.ts` |
| Authorization | Role name checks in layouts, query guards, actions | `server/*/queries.ts`, protected layouts |
| Email | Resend transactional email, log-only fallback in dev | `server/email/provider.ts` |
| WhatsApp | Log-only provider with DB message log | `server/whatsapp/provider.ts`, `server/whatsapp/service.ts` |
| AI | OpenAI Responses API for Tara, local configuration fallback | `server/ai/tara.ts`, `app/api/tara/stream/route.ts` |
| Payments | Provider-neutral DB records only, no gateway SDK/webhook | `PaymentProvider` enum, `actions/admission-phase4.ts` |
| File storage | URL fields only, no upload/storage provider implementation | `StudentDocument.fileUrl`, `ContentLibrary.url`, forms |
| Deployment | Railway Nixpacks | `railway.json` |
| Testing | Vitest 3.2.4, V8 coverage, 5 files/10 database-free tests | `package.json`, `vitest.config.ts`, `tests/*` |
| CI/CD | GitHub Actions validates install, Prisma, lint, types, tests, build | `.github/workflows/ci.yml` |
| Background jobs | No scheduler/queue worker found | no queue/cron files; automation tables only |
| Caching | No external cache; in-memory rate limiter | `lib/security/rate-limit.ts` |
| Logging | Console plus AuditLog/PlatformAudit tables | `server/email/provider.ts`, `server/audit/log.ts`, Prisma models |

## Route Map

Counts observed:

- App page files: 148
- API route files: 1
- Layout files: role-specific layouts under admin, admissions, director, executive, trainer, success, bdm, telecaller, counsellor, community-hub, relationship-manager, student group
- Prisma models: 120
- Prisma enums: 84
- Test files: 5

### Public

- `/` - AIRA Skill City landing page, implemented by `app/page.tsx` and `features/landing/components/aira-landing-v2.tsx`.
- `/apply` - public application experience.
- `/application-status` - public WhatsApp-based application status lookup.
- `/admission-process` - public admissions process page.
- `/contact` - contact page.
- `/privacy` - privacy page.
- `/academies/[slug]` - public academy detail.
- `/programs/[slug]` - public program detail.
- `/careers` - public careers landing.
- `/careers/[roleSlug]` - public career role detail.
- `/careers/[roleSlug]/apply` - public career application.
- `/onboarding` - public/static onboarding steps page.
- `/email-previews` - email preview route. This appears risky if enabled in production.

### Authentication

- `/login` - email/password and WhatsApp PIN login UI.
- `/register` - student registration.
- `/forgot-password` - reset request.
- `/reset-password` - reset token flow.
- `/reset-pin` - temporary WhatsApp PIN reset.
- `/profile-setup` - student activation profile.
- `/admin-login` - admin/director PIN login.

Auth actions live in `actions/auth.ts` and `actions/admin-control.ts`.

### Student Workspace

Route group: `app/(student)/*`, visible URL paths:

- `/dashboard`
- `/calendar`
- `/community`
- `/learn/day/[dayId]`
- `/my-journey`
- `/my-journey/day/[dayId]`
- `/projects`
- `/settings`
- `/tara`
- `/todays-tasks`
- `/wallet`

Primary services:

- `server/journey/queries.ts`
- `server/altt/queries.ts`
- `actions/progress.ts`
- `actions/altt.ts`

### Admissions

Protected layout: `app/admissions/layout.tsx` uses `requireAdmissionUser()`.

- `/admissions`
- `/admissions/dashboard`
- `/admissions/action-queue`
- `/admissions/applications`
- `/admissions/applications/[applicationId]`
- `/admissions/approved`
- `/admissions/rejected`
- `/admissions/review`
- `/admissions/leads`
- `/admissions/counselling`
- `/admissions/payments`
- `/admissions/documents`
- `/admissions/enrollments`
- `/admissions/programs`
- `/admissions/communications`
- `/admissions/reports`
- `/admissions/settings`
- `/admissions/tara`

Primary services/actions:

- `server/admissions/queries.ts`
- `server/admissions/phase4-queries.ts`
- `server/admissions/phase5-queries.ts`
- `actions/admissions.ts`
- `actions/admission-phase4.ts`
- `actions/admission-phase5.ts`
- `actions/public-application.ts`

### Telecaller and Counsellor

Protected layouts:

- `app/telecaller/layout.tsx` -> `requireTelecallerUser()`
- `app/counsellor/layout.tsx` -> `requireCounsellorUser()`

Routes:

- `/telecaller`
- `/telecaller/leads/[leadId]`
- `/counsellor`
- `/counsellor/leads/[leadId]`

Primary code:

- `actions/telecaller.ts`
- `actions/counsellor.ts`
- lead scoping helpers in `server/admissions/queries.ts`

### Business Development

Protected layout: `app/bdm/layout.tsx` uses `requireBdmUser()`.

- `/bdm`
- `/bdm/dashboard`
- `/bdm/leads`
- `/bdm/referrals`
- `/bdm/commissions`
- `/bdm/payouts`
- `/bdm/targets`
- `/bdm/wallet`
- `/bdm/leaderboard`
- `/bdm/tara`

Primary service: `server/admissions/queries.ts`.

### Trainer

Protected layout: `app/trainer/layout.tsx` uses `requireTrainer()`.

- `/trainer`
- `/trainer/dashboard`
- `/trainer/todays-classes`
- `/trainer/my-batches`
- `/trainer/batches/[batchId]`
- `/trainer/students`
- `/trainer/students/[studentId]`
- `/trainer/assignments`
- `/trainer/attendance`
- `/trainer/submissions`
- `/trainer/reflections`
- `/trainer/assessments`
- `/trainer/resources`
- `/trainer/announcements`
- `/trainer/calendar`
- `/trainer/reports`
- `/trainer/settings`
- `/trainer/tara`

Primary code:

- `server/trainer/queries.ts`
- `actions/trainer.ts`
- `features/trainer/components/*`

### Director

Protected layout: `app/director/layout.tsx` uses `requireDirector()`.

- `/director`
- `/director/dashboard`
- `/director/programs`
- `/director/blueprints`
- `/director/batch-management`
- `/director/trainer-assignment`
- `/director/journey-planner`
- `/director/learning-flows`
- `/director/content-library`
- `/director/communications`
- `/director/calendar`
- `/director/analytics`
- `/director/careers`
- `/director/settings`
- `/director/tara`

Primary code:

- `server/director/queries.ts`
- `server/director/log.ts`
- `server/director/tara.ts`
- `actions/director.ts`

### Admin

Protected layout: `app/admin/layout.tsx` uses `requireAdminUser()`.

- `/admin`
- `/admin/dashboard`
- `/admin/users`
- `/admin/access`
- `/admin/admission-cell`
- `/admin/academic-health`
- `/admin/follow-ups`
- `/admin/careers`
- `/admin/settings`
- `/admin/settings/security`

Primary code:

- `server/admin/queries.ts`
- `actions/admin-control.ts`
- `actions/admin-follow-ups.ts`

### Executive

Protected layout: `app/executive/layout.tsx` uses `requireExecutive()`.

- `/executive`
- `/executive/dashboard`
- `/executive/campuses`
- `/executive/departments`
- `/executive/hr`
- `/executive/programs`
- `/executive/students`
- `/executive/admissions`
- `/executive/finance`
- `/executive/institution-health`
- `/executive/automation-center`
- `/executive/ai-command-center`
- `/executive/reports`
- `/executive/system-settings`

Primary code:

- `server/executive/queries.ts`
- `actions/executive.ts`
- `features/executive/*`

### Student Success

Protected layout: `app/success/layout.tsx` uses `requireSuccessStudent()`.

- `/success`
- `/success/dashboard`
- `/success/portfolio`
- `/success/projects`
- `/success/skills`
- `/success/certificates`
- `/success/achievements`
- `/success/resume`
- `/success/career-profile`
- `/success/placement`
- `/success/internships`
- `/success/founder-profile`
- `/success/settings`

Primary code:

- `server/success/queries.ts`
- `actions/success.ts`

### Community Hub

Protected layout exists at `app/community-hub/layout.tsx`.

- `/community-hub`
- `/community-hub/feed`
- `/community-hub/groups`
- `/community-hub/discussions`
- `/community-hub/events`
- `/community-hub/hackathons`
- `/community-hub/challenges`
- `/community-hub/leaderboard`
- `/community-hub/marketplace`
- `/community-hub/my-batch`
- `/community-hub/alumni`
- `/community-hub/wallet`
- `/community-hub/announcements`
- `/community-hub/settings`

Primary code:

- `server/community/queries.ts`
- `actions/community.ts`

### Careers and Relationship Manager

- `/admin/careers` - internal recruitment management.
- `/director/careers` - director recruitment view.
- `/executive/hr` - executive HR view.
- `/relationship-manager` - RM workspace.

Primary code:

- `features/careers/catalog.ts`
- `server/careers/queries.ts`
- `server/careers/rm-performance.ts`
- `actions/careers.ts`

### API Endpoints

- `POST /api/tara/stream` - SSE-like Tara stream endpoint, protected by `getCurrentUser()`, role scoped by requested Tara scope.

No payment webhooks, email webhooks, upload APIs, WhatsApp callbacks, cron APIs, or queue endpoints were found.

## Database Model Groups

### Identity and Access

- `User`
- `Role`
- `UserRole`
- `Session`
- `EmailOTP`
- `PasswordResetToken`
- `AuditLog`
- `StudentLoginCredential`
- `StudentActivationProfile`

Roles are name-based. There is no first-class `Permission` table.

### Learning and ALTT

- `Program`
- `Journey`
- `JourneyPhase`
- `JourneyWeek`
- `JourneyDay`
- `Activity`
- `StudentEnrollment`
- `StudentProgress`
- `Announcement`
- `Blueprint`
- `BlueprintVersion`
- `LearningFlow`
- `LearningStep`
- `DailyLearningSession`
- `Reflection`
- `StudentReflection`
- `Submission`
- `SubmissionReview`
- `QuizQuestion`
- `QuizAttempt`
- `AssessmentResult`

### Trainer and Academic Operations

- `TrainerAssignment`
- `AttendanceSession`
- `AttendanceRecord`
- `TrainerFeedback`
- `ReviewRubric`
- `ReviewComment`
- `DirectorAnnouncement`
- `CalendarEvent`
- `ResourceCategory`
- `Resource`
- `TrainerAnnouncement`
- `StudentConcern`
- `ReviewQueue`
- `DirectorActivityLog`

### Admissions, CRM, Sales, Finance

- `PipelineStage`
- `LeadSource`
- `LeadTag`
- `LeadTagOnLead`
- `Lead`
- `LeadActivity`
- `LeadNote`
- `CounsellingSession`
- `AdmissionApplication`
- `StudentDocument`
- `FeeInvoice`
- `PaymentTransaction`
- `CommissionRecord`
- `Referral`
- `EnrollmentLog`
- `CommunicationLog`
- `WhatsAppMessageLog`

### Success, Career Readiness, Portfolio

- `StudentPortfolio`
- `StudentPortfolioProgram`
- `PortfolioProject`
- `VerifiedSkill`
- `SkillEvidence`
- `Certificate`
- `CertificateVerification`
- `Achievement`
- `ResumeProfile`
- `PlacementProfile`
- `PlacementApplication`
- `Internship`
- `FounderProfile`
- `CareerMilestone`

### Community and Marketplace

- `CommunityGroup`
- `CommunityMembership`
- `CommunityPost`
- `CommunityComment`
- `CommunityReaction`
- `Event`
- `EventRegistration`
- `Challenge`
- `ChallengeParticipation`
- `Wallet`
- `WalletTransaction`
- `MarketplaceCategory`
- `MarketplaceListing`
- `MarketplaceApproval`
- `AlumniProfile`
- `Badge`
- `LeaderboardSnapshot`
- `Mission`
- `MissionCompletion`

### Executive OS and Organization

- `Institution`
- `Campus`
- `Department`
- `Employee`
- `AutomationRule`
- `AutomationExecution`
- `ExecutiveReport`
- `ExecutiveInsight`
- `SystemSetting`
- `PlatformAudit`
- `NotificationProvider`
- `ExecutivePaymentProvider`
- `StorageProvider`

### Recruitment and Nice Jobs Adjacent

- `CareerApplication`
- `CareerInterview`
- `CareerApplicationActivity`
- `RelationshipManagerDevelopment`

### AI

- `AIConversation`
- `AIMessage`
- `PromptTemplate`
- `AIUsageLog`
- `AIFeedback`
- `TokenUsage`

### Model-by-Model Implementation Inventory

Status legend: **Active** = exercised by current queries/actions; **Supporting** = mainly reached through relations/nested writes; **Partial** = implemented but shallow/incomplete; **Schema-only** = no meaningful application service/UI usage found. `R/I/U` shows relation declarations, explicit `@@index` declarations, and compound `@@unique` declarations in `prisma/schema.prisma`; field-level `@id` and `@unique` also create constraints/indexes and are not included in `I/U`.

#### Identity, Learning, and Academic Operations

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `User` | Principal profile; email/status/password; hub for roles, sessions and nearly every workflow | 41/2/0 | Active; structurally central and oversized |
| `Program` | Program catalog; fee/admission/public state; links journeys, batches, leads and enrollment | 3/7/0 | Active |
| `Journey` | Versioned program learning journey with phases, days and enrollment | 1/1/1 | Active |
| `JourneyPhase` | Ordered journey phase | 1/1/1 | Supporting through journey queries |
| `JourneyWeek` | Ordered phase week | 1/1/1 | Supporting through journey queries |
| `JourneyDay` | Daily curriculum node; learning flow, activities and ALTT work | 2/3/1 | Active |
| `Activity` | Typed task/content/assessment with points, due dates and progress | 2/4/1 | Active |
| `Batch` | Program/journey cohort; capacity, dates, trainer and student operations | 3/4/0 | Active |
| `StudentEnrollment` | Student-to-program/journey/batch state | 4/4/1 | Active; core lifecycle link |
| `StudentActivationProfile` | Student onboarding/contact/profile data | 1/1/0 | Active |
| `StudentProgress` | Per-student activity progress and completion | 2/2/1 | Active |
| `Announcement` | Program/batch/user academic announcement | 4/4/0 | Active |
| `Blueprint` | Director-owned academic blueprint | 3/2/0 | Active |
| `BlueprintVersion` | Version history for blueprint | 1/1/1 | Supporting; no direct service usage found |
| `ContentLibrary` | Director-managed learning resource metadata/URL | 2/3/0 | Active but URL-based |
| `TrainerAssignment` | Trainer-to-batch assignment with status | 2/2/1 | Active |
| `AttendanceSession` | Batch/trainer dated attendance session | 3/3/0 | Active |
| `AttendanceRecord` | Student status within an attendance session | 3/2/1 | Active |
| `TrainerFeedback` | Trainer feedback on student/submission/reflection/assessment | 5/3/0 | Active |
| `ReviewRubric` | Reusable rubric definition | 0/1/0 | Schema-only |
| `ReviewComment` | Threaded review comment linked to academic entities | 4/4/0 | Schema-only/supporting only |
| `DirectorAnnouncement` | Director announcement by program/batch/audience | 3/5/0 | Active |
| `CalendarEvent` | Scheduled academic event linked to batch/trainer | 3/4/0 | Active |
| `ResourceCategory` | Trainer resource taxonomy | 0/1/0 | Active as helper; minimal management |
| `Resource` | Trainer/batch learning resource URL | 3/4/0 | Active but URL-based |
| `TrainerAnnouncement` | Trainer announcement for batch/community display | 2/3/0 | Active |
| `StudentConcern` | Trainer-raised student risk/concern | 3/3/0 | Active |
| `ReviewQueue` | Review work item linking student/submission/assessment | 6/4/0 | Active |

#### Student Success and Career Readiness

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `StudentPortfolio` | One portfolio/public slug per student | 1/1/0 | Active; created during read path |
| `StudentPortfolioProgram` | Portfolio-to-program join | 2/1/1 | Supporting; no direct service usage found |
| `PortfolioProject` | Student project evidence and approval | 4/3/0 | Active |
| `VerifiedSkill` | Student skill with verifier/evidence | 3/2/0 | Active |
| `SkillEvidence` | Evidence linked to skill/project/submission/certificate | 5/2/0 | Supporting; no direct mutation found |
| `Certificate` | Student/program/skill certificate metadata | 5/3/0 | Active |
| `CertificateVerification` | Verification audit for certificate | 1/1/0 | Active but minimal |
| `Achievement` | Student achievement/badge-like record | 3/2/0 | Active |
| `ResumeProfile` | Versioned student resume data | 1/1/1 | Active |
| `PlacementProfile` | One placement readiness profile per student | 1/0/0 | Active; field-level unique provides lookup |
| `PlacementApplication` | Placement application under a profile | 1/1/0 | Active but shallow |
| `Internship` | Student internship placement and mentor link | 2/2/0 | Active |
| `FounderProfile` | One entrepreneurship/founder profile per student | 1/0/0 | Active; not a complete venture model |
| `CareerMilestone` | Student career milestone timeline | 1/1/0 | Read-only/partial |

#### Community and Marketplace

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `CommunityGroup` | Social group scoped to program/batch/type | 3/3/0 | Active |
| `CommunityMembership` | User membership in group | 2/1/1 | Active |
| `CommunityPost` | User/group post with comments/reactions | 4/4/0 | Active |
| `CommunityComment` | Post comments | 2/2/0 | Supporting; no direct action found |
| `CommunityReaction` | Unique user reaction per post/type | 2/1/1 | Supporting; no direct action found |
| `Event` | Community event with group/batch/registrations | 3/4/0 | Active |
| `EventRegistration` | User registration for event | 2/1/1 | Active |
| `Challenge` | Group/batch challenge | 2/3/0 | Active |
| `ChallengeParticipation` | User challenge participation | 2/1/1 | Active |
| `Wallet` | One community wallet per user | 1/0/0 | Active; lazily created on read |
| `WalletTransaction` | Wallet credit/debit history | 2/2/0 | Active; not finance-grade ledger |
| `MarketplaceCategory` | Listing taxonomy | 0/0/0 | Active helper; thin administration/indexing |
| `MarketplaceListing` | Seller/category marketplace listing | 2/3/0 | Active |
| `MarketplaceApproval` | Listing approval record | 2/2/0 | Schema-only |
| `AlumniProfile` | One alumni profile per user | 1/0/0 | Partial/read surface |
| `Badge` | Badge catalog | 0/0/0 | Schema-only |
| `LeaderboardSnapshot` | Periodic leaderboard payload | 0/1/0 | Schema-only; no snapshot job |
| `Mission` | Community mission definition | 1/2/0 | Read-only/partial |
| `MissionCompletion` | User mission completion | 2/1/1 | Supporting; no completion action found |

#### Organization, HR, Executive, and Recruitment

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `Institution` | Top current organization container | 0/1/0 | Active but incomplete hierarchy |
| `Campus` | Institution campus/centre with location | 1/1/1 | Active |
| `Department` | Institution/campus department | 2/3/0 | Active |
| `Employee` | User-linked employee scoped to org units | 4/3/0 | Active but shallow HR lifecycle |
| `CareerApplication` | Public/internal recruitment candidate record | 3/7/0 | Active |
| `CareerInterview` | Application interview with interviewer | 2/3/0 | Active |
| `CareerApplicationActivity` | Recruitment stage/activity history | 2/3/0 | Active |
| `RelationshipManagerDevelopment` | Employee/candidate RM development and evaluation | 3/3/0 | Active/partial Nice Jobs seed |
| `AutomationRule` | Rule definition and JSON condition/action | 0/1/0 | Partial; CRUD without runner |
| `AutomationExecution` | Rule execution record | 1/2/0 | Read surface only; no executor found |
| `ExecutiveReport` | Institution/report payload and creator | 2/2/0 | Partial CRUD, no report engine |
| `ExecutiveInsight` | Executive insight payload | 1/2/0 | Schema-only |
| `SystemSetting` | Scoped key/value configuration with encrypted flag | 1/1/1 | Active; encryption service not found |
| `PlatformAudit` | Executive platform audit record | 1/3/0 | Active |
| `NotificationProvider` | Provider configuration metadata | 0/0/0 | Schema-only |
| `ExecutivePaymentProvider` | Executive payment provider config | 0/0/0 | Schema-only |
| `StorageProvider` | Storage provider config | 0/0/0 | Schema-only |
| `DirectorActivityLog` | Director action log | 1/3/0 | Active |

#### ALTT and AI

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `LearningFlow` | Reusable ALTT flow attached to days | 0/2/0 | Active |
| `LearningStep` | Ordered step in flow/day | 2/3/1 | Active |
| `Reflection` | Day-level reflection prompt | 2/2/1 | Active |
| `StudentReflection` | Student answer to reflection | 2/2/1 | Active |
| `Submission` | Student day/activity submission | 4/4/0 | Active |
| `SubmissionReview` | Reviewer decision on submission | 2/2/0 | Active |
| `QuizQuestion` | Day quiz item | 2/3/0 | Active |
| `QuizAttempt` | Student quiz response/result | 4/3/0 | Active |
| `AssessmentResult` | Student assessment score/feedback | 4/3/0 | Active |
| `DailyLearningSession` | Student/day ALTT session and completed steps | 3/3/1 | Active; upserted during read |
| `AIConversation` | User/scope AI conversation | 1/2/0 | Active |
| `AIMessage` | Conversation messages and metadata | 2/3/0 | Active |
| `PromptTemplate` | Versioned prompt configuration | 0/1/1 | Active; runtime template upsert |
| `AIUsageLog` | Provider/model/token/cost usage | 2/3/0 | Active |
| `AIFeedback` | Unique user/message rating | 3/2/1 | Active |
| `TokenUsage` | Per-user/conversation token totals | 2/2/0 | Active |

#### CRM, Admissions, Finance, Communications, and Access

| Model | Purpose and important links | R/I/U | Status |
|---|---|---:|---|
| `PipelineStage` | Ordered lead pipeline reference data | 0/1/1 | Active; runtime bootstrapped |
| `LeadSource` | Lead-source reference | 0/0/0 | Active; name is field-level unique |
| `LeadTag` | Lead-tag catalog | 0/0/0 | Schema-only |
| `LeadTagOnLead` | Lead/tag join | 2/0/1 | Schema-only/supporting |
| `Lead` | CRM aggregate: contact, stage, source, assignee, owner, program | 5/5/0 | Active; strongest domain base |
| `LeadActivity` | Immutable-style lead event history | 2/2/0 | Active |
| `LeadNote` | Authored lead notes | 2/1/0 | Active |
| `CounsellingSession` | Lead/batch/counsellor schedule and outcome | 3/3/0 | Active |
| `AdmissionApplication` | Lead/program application linked to eventual student | 3/3/0 | Active |
| `StudentLoginCredential` | WhatsApp/PIN credential lifecycle | 3/4/0 | Active; duplicated activation paths |
| `WhatsAppMessageLog` | Outbound WhatsApp attempt/status log | 2/4/0 | Active but provider is log-only |
| `StudentDocument` | Student/application document URL and verification status | 2/2/0 | Active but insecure URL model |
| `FeeInvoice` | Lead/student/program/batch invoice | 4/3/0 | Active; no ledger/gateway reconciliation |
| `PaymentTransaction` | Invoice payment/provider/status record | 2/3/0 | Active; manual workflow |
| `CommissionRecord` | User commission approval/payment state | 4/3/0 | Active/partial |
| `Referral` | Referrer/lead/program referral code | 3/2/0 | Active |
| `EnrollmentLog` | Enrollment transition audit | 3/3/0 | Active |
| `CommunicationLog` | Lead/user channel message record | 2/3/0 | Active but not provider delivery log |
| `Notification` | In-app user notification | 1/2/0 | Active; no complete delivery center |
| `Role` | Named role catalog | 0/0/0 | Active; field-level unique name, no permissions |
| `UserRole` | User/role join | 2/0/1 | Active |
| `Session` | Hashed opaque session and revocation/expiry | 1/2/0 | Active |
| `EmailOTP` | Hashed email OTP challenge | 1/2/0 | Schema present; no complete verification flow found |
| `PasswordResetToken` | Hashed single-use reset token | 1/2/0 | Active |
| `AuditLog` | General actor/action/entity audit | 1/3/0 | Active |

Inventory conclusions:

- The schema is broad but not dead as a whole: core admissions, learning, trainer, recruitment, community, success and AI groups have real callers.
- Clearly schema-only or effectively dormant models include `ReviewRubric`, `ReviewComment`, `MarketplaceApproval`, `Badge`, `LeaderboardSnapshot`, `ExecutiveInsight`, `NotificationProvider`, `ExecutivePaymentProvider`, `StorageProvider`, `LeadTag`, and `LeadTagOnLead`. Several relation-only models may still be populated through nested Prisma operations; production data inspection is required before any removal.
- `PlacementProfile`, `FounderProfile`, `Wallet`, `MarketplaceCategory`, `AlumniProfile`, `Badge`, `NotificationProvider`, `ExecutivePaymentProvider`, and `StorageProvider` have no explicit `@@index`; some rely on field-level uniqueness. This is not automatically defective, but query plans must be validated before scale.
- No model is recommended for deletion solely from static usage. Migrations and production row counts must precede obsolescence decisions.

## Main Data Relationships

- `User` owns many roles via `UserRole`.
- `User` sessions are stored in `Session` as hashed tokens.
- `Program` has many `Journey`, `Batch`, `StudentEnrollment`, `Lead`, `AdmissionApplication`, `FeeInvoice`.
- `Journey` has phases, weeks, days, and activities.
- `StudentEnrollment` connects `User` to `Program`, `Journey`, and optionally `Batch`.
- `Lead` connects to program interest, pipeline stage, source, assignee, owner, activities, notes, counselling, applications, invoices, referrals, and communications.
- `AdmissionApplication` connects a lead to a program and optionally a student user.
- `FeeInvoice` connects lead/student/program/batch to `PaymentTransaction`.
- `Batch` connects enrollments, activities, attendance, trainer assignments, resources, events, and community entities.
- `Employee` is a profile over `User` with institution/campus/department.
- `CareerApplication` can connect to `Employee` and `RelationshipManagerDevelopment`.

## Server Action Map

- `actions/auth.ts` - register, login, WhatsApp PIN login, forgot/reset password, reset PIN, activation profile, logout.
- `actions/admin-control.ts` - admin login, role assignment, user status, reset access.
- `actions/admin-follow-ups.ts` - academic follow-up creation/status.
- `actions/admissions.ts` - leads, counselling, applications, review, programs, credentials, documents, invoices, payments, commissions, communications, enrollment conversion.
- `actions/admission-phase4.ts` - payment request, manual payment capture, verification, admission activation.
- `actions/admission-phase5.ts` - batch assignment/onboarding.
- `actions/public-application.ts` - public enquiry, public application, application status.
- `actions/telecaller.ts` - telecaller lead outcome and self-assignment.
- `actions/counsellor.ts` - counselling decision and self-assignment.
- `actions/director.ts` - programs, blueprints, batches, trainers, announcements, content, calendar, journey activities.
- `actions/trainer.ts` - trainer classes, tasks, attendance, reviews, resources, announcements, concerns.
- `actions/progress.ts` - student activity completion.
- `actions/altt.ts` - ALTT learning interactions.
- `actions/tara.ts` - Tara feedback.
- `actions/success.ts` - portfolio, projects, resumes, placement, internships, founder profile, approvals, certificates, achievements.
- `actions/community.ts` - posts, groups, events, registrations, challenges, listings.
- `actions/careers.ts` - public career applications, recruitment stages, interviews, RM development.
- `actions/executive.ts` - institutions, campuses, departments, employees, automation rules, reports, settings.

## Integration Map

| Integration | Status | Evidence |
|---|---|---|
| Resend email | Partial working integration | `server/email/provider.ts` |
| WhatsApp | Log-only stub | `server/whatsapp/provider.ts` |
| OpenAI | Working path if `OPENAI_API_KEY` is configured | `server/ai/tara.ts` |
| Payment gateway | Missing gateway SDK/webhook | enums and manual actions only |
| Cloudinary/S3/file storage | Missing | URL fields only |
| Redis | Declared env only, unused for rate limiting | `.env.example`, `lib/env.ts`, `lib/security/rate-limit.ts` |
| Railway | Present | `railway.json` |
| GitHub CI | Configured; first remote run not evidenced locally | `.github/workflows/ci.yml` |

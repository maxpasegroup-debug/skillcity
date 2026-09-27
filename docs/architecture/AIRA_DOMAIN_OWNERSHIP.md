# AIRA Domain Ownership

This map defines logical ownership for incremental development. A domain owns its rules and writes even when current code is physically shared. Cross-domain reads should use explicit query/service contracts; cross-domain writes should be orchestrated by the owning application service. Phase 0 does not move code.

## 1. Identity & Access

- **Purpose:** Users, credentials, sessions, identity lifecycle, login and recovery.
- **Current locations:** `server/auth/session.ts`, `actions/auth.ts`, `features/auth`, `lib/security`, auth pages.
- **Models:** `User`, `Role`, `UserRole`, `Session`, `EmailOTP`, `PasswordResetToken`, `StudentLoginCredential`, `AuditLog`.
- **Server/actions/routes:** `server/auth`, `actions/auth.ts`, `/login`, `/admin-login`, `/register`, `/forgot-password`, `/reset-password`, `/reset-pin`, `/onboarding`, `/profile-setup`.
- **Dependencies:** Communications for email; Admissions for student activation; Organization for employee scope.
- **Problems:** Role-name checks are scattered; student guards are inconsistent; student credential creation is duplicated in admissions; no session-management UI.
- **Target boundary:** Identity authenticates principals and manages credentials only. Authorization policies and organization scope remain separate services.

## 2. Organization

- **Purpose:** Company structure, operational units, campuses, departments and assignment scope.
- **Current locations:** `server/executive/queries.ts`, `actions/executive.ts`, `app/executive/campuses`, `app/executive/departments`.
- **Models:** `Institution`, `Campus`, `Department`, `Employee`; optional institution/campus/department fields on selected models.
- **Server/actions/routes:** Executive queries/actions and executive organization pages.
- **Dependencies:** Identity, People/HR, every future scoped domain.
- **Problems:** Division and region/district are absent; scope is not propagated consistently to users, leads, enrollments, finance or reporting.
- **Target boundary:** Canonical hierarchy and memberships: Company -> Division -> Region/District -> Campus/Centre/Branch -> Department -> Team/operational scope.

## 3. People / HR

- **Purpose:** Employee records, recruitment, assignment, performance and lifecycle.
- **Current locations:** `server/careers`, `actions/careers.ts`, `features/careers`, executive HR pages, relationship-manager workspace.
- **Models:** `Employee`, `CareerApplication`, `CareerInterview`, `CareerApplicationActivity`, `RelationshipManagerDevelopment`, `Notification`.
- **Server/actions/routes:** `server/careers/queries.ts`, `server/careers/rm-performance.ts`, `/careers`, `/admin/careers`, `/director/careers`, `/executive/hr`, `/relationship-manager`.
- **Dependencies:** Identity, Organization, Communications, Documents.
- **Problems:** Recruitment and employee lifecycle are coupled; payroll/leave are mostly fields rather than workflows; resume storage is URL-only.
- **Target boundary:** Recruitment hands an accepted candidate to a separate employee lifecycle service scoped by organization.

## 4. CRM & Admissions

- **Purpose:** Lead capture, counselling, application review, admission decisions and handoff to finance/learning.
- **Current locations:** `server/admissions`, four admissions action files, telecaller/counsellor actions, `features/admissions`, `features/apply`.
- **Models:** `Lead`, `LeadSource`, `LeadTag`, `PipelineStage`, `LeadActivity`, `LeadNote`, `CounsellingSession`, `AdmissionApplication`, `Referral`.
- **Server/actions/routes:** `/apply`, `/application-status`, `/admissions/*`, `/telecaller/*`, `/counsellor/*`, `/bdm/*`.
- **Dependencies:** Identity, Learning, Finance, Documents, Communications, Organization.
- **Problems:** Pipeline setup mutates from reads; phase files overlap with legacy actions; activation and payment responsibilities are mixed into admissions.
- **Target boundary:** Admissions owns lead-to-approved-application state. Finance owns invoices/payments; Identity owns credentials; Learning owns enrollment/batch placement.

## 5. Learning & ALTT

- **Purpose:** Programs, journeys, curriculum, daily learning, progress, submissions, assessment and academic operations.
- **Current locations:** `server/journey`, `server/altt`, `server/trainer`, director/trainer/student actions and features.
- **Models:** `Program`, `Journey`, `JourneyPhase`, `JourneyWeek`, `JourneyDay`, `LearningFlow`, `LearningStep`, `Activity`, `StudentEnrollment`, `StudentProgress`, `DailyLearningSession`, `Submission`, `AssessmentResult`, `QuizAttempt`, `Batch`.
- **Server/actions/routes:** Student journey pages, `/trainer/*`, `/director/*`, `actions/altt.ts`, `actions/progress.ts`, `actions/trainer.ts`, `actions/director.ts`.
- **Dependencies:** Identity, Organization, Communications, AI, Documents.
- **Problems:** Session creation occurs in a query; program administration overlaps admissions; authorization is partly role-name and partly batch-scoped.
- **Target boundary:** Learning owns curriculum and enrollment progress; trainer operations use explicit batch-scoped policy checks.

## 6. Startup School

- **Purpose:** Entrepreneurship program experience and venture outcomes.
- **Current locations:** Public academy/program content, seeded program/journey, generic learning and success modules.
- **Models:** Primarily shared `Program`, `Journey`, `Batch`, `StudentEnrollment`, `FounderProfile`, `PortfolioProject`.
- **Server/actions/routes:** `/programs/startup-skool`, `/academies/startup-skool`, student learning and success routes.
- **Dependencies:** Learning, Career Hub, Community, AI.
- **Problems:** No dedicated venture lifecycle or program-specific bounded service.
- **Target boundary:** A product/domain layer over shared learning primitives, adding venture milestones only when requirements are approved.

## 7. AIRA Labs

- **Purpose:** Product/venture portfolio, teams, incubation and product delivery.
- **Current locations:** Public content and seeded program references only.
- **Models:** No dedicated `Brand`, `Product`, `Portfolio` or `Venture` model.
- **Server/actions/routes:** `/programs/aira-labs`, `/academies/aira-labs`; no operational service.
- **Dependencies:** Learning, People/HR, Finance, Documents, AI, Executive Intelligence.
- **Problems:** Marketing concept is ahead of system implementation.
- **Target boundary:** Dedicated portfolio domain; do not overload generic `Program` with product governance.

## 8. Skill Studio

- **Purpose:** Short-form skill creation, content and competency delivery.
- **Current locations:** Generic academy content, learning flows, resources and content library.
- **Models:** Shared `Program`, `Activity`, `LearningFlow`, `Resource`, `ContentLibrary`.
- **Server/actions/routes:** Director content/flow pages and student learning routes.
- **Dependencies:** Learning, Documents, AI.
- **Problems:** No explicit product definition or ownership; content models serve several concerns.
- **Target boundary:** Product-specific catalog/composition layer reusing Learning delivery contracts.

## 9. Career Hub

- **Purpose:** Student career readiness, portfolios, internships, placement and evidence.
- **Current locations:** `server/success`, `actions/success.ts`, `features/success`, `app/success`.
- **Models:** `StudentPortfolio`, `PortfolioProject`, `VerifiedSkill`, `Certificate`, `Achievement`, `ResumeProfile`, `PlacementProfile`, `Internship`, `CareerMilestone`.
- **Server/actions/routes:** `/success/*`, student `/projects` and `/wallet` where relevant.
- **Dependencies:** Identity, Learning, Documents, Nice Jobs, Community.
- **Problems:** Portfolio creation mutates during reads; student-only authorization is not enforced by role; several records are self-reported.
- **Target boundary:** Career evidence and readiness service; employment marketplace concerns move to Nice Jobs.

## 10. Nice Jobs

- **Purpose:** Opportunities, matching, applications, commissions and payouts for learners/alumni.
- **Current locations:** Careers recruitment, BDM/RM pages and seeded Nice Jobs program fragments.
- **Models:** No complete opportunity marketplace model; adjacent models include `CareerApplication`, `Referral`, `CommissionRecord`, `PlacementProfile`.
- **Server/actions/routes:** `/careers/*`, `/bdm/*`, `/relationship-manager`.
- **Dependencies:** Career Hub, People/HR, Finance, Organization, Communications.
- **Problems:** Employer recruitment and learner opportunities are conflated; payout/marketplace workflow is absent.
- **Target boundary:** Separate opportunity and placement marketplace with explicit employer, candidate, commission and payout contracts.

## 11. Finance

- **Purpose:** Pricing, invoices, payment records, reconciliation, commissions and financial reporting.
- **Current locations:** Admissions actions/pages and executive finance views.
- **Models:** `FeeInvoice`, `PaymentTransaction`, `CommissionRecord`.
- **Server/actions/routes:** Payment portions of `actions/admissions.ts` and `actions/admission-phase4.ts`, `/admissions/payments`, `/executive/finance`, BDM commission/payout pages.
- **Dependencies:** Admissions, Organization, Communications, Executive Intelligence.
- **Problems:** Manual/provider-neutral records only; duplicate payment paths; no gateway/webhook/reconciliation/ledger service.
- **Target boundary:** Finance owns all payment state transitions and exposes verified-payment events to Admissions and Learning.

## 12. Documents

- **Purpose:** File metadata, storage, access, verification, retention and expiry.
- **Current locations:** Admissions document actions/pages, careers resume URL, content/resource URL fields.
- **Models:** `StudentDocument`, URL/upload metadata fields in `ContentLibrary`, `Resource`, `CareerApplication`.
- **Server/actions/routes:** `saveDocumentAction`, `/admissions/documents`, content library and resource forms.
- **Dependencies:** Identity, Admissions, People/HR, Career Hub, Storage provider.
- **Problems:** Arbitrary URLs, no object-store client, signed access, ACL, malware checks or lifecycle policy.
- **Target boundary:** Central document service storing provider keys and metadata, issuing short-lived access after policy checks.

## 13. Communications

- **Purpose:** Email, WhatsApp, notifications, templates, delivery state and inbound/outbound audit.
- **Current locations:** `server/email`, `server/whatsapp`, `server/notifications`, `emails`, communication actions.
- **Models:** `CommunicationLog`, `WhatsAppMessageLog`, `Notification`.
- **Server/actions/routes:** Email provider, WhatsApp service/provider/templates, admissions/admin follow-up actions.
- **Dependencies:** Identity and every workflow emitting messages.
- **Problems:** WhatsApp is log-only but reports `SENT`; email lacks durable delivery log/retry; no callback processing or queue.
- **Target boundary:** Channel-neutral command/event service with provider adapters, idempotency, retries and status callbacks.

## 14. Automation

- **Purpose:** Rules, schedules, workflow triggers, executions, retries and operational visibility.
- **Current locations:** Executive automation UI/actions and schema only.
- **Models:** `AutomationRule`, `AutomationExecution`.
- **Server/actions/routes:** `actions/executive.ts`, `/executive/automation-center`.
- **Dependencies:** Communications and all event-producing domains.
- **Problems:** No runner, scheduler, queue, retry or idempotency mechanism.
- **Target boundary:** Event-driven worker service introduced only after rule/event contracts and operational ownership are approved.

## 15. AI

- **Purpose:** Tara conversations, prompts, contextual assistance, tool use, usage and feedback.
- **Current locations:** `server/ai`, `actions/tara.ts`, `features/tara`, `app/api/tara/stream/route.ts`.
- **Models:** `AIConversation`, `AIMessage`, `PromptTemplate`, `AIUsageLog`, `AIFeedback`, `TokenUsage`.
- **Server/actions/routes:** `/tara` and role-specific Tara routes, `POST /api/tara/stream`.
- **Dependencies:** Identity plus read contracts from Admissions, Learning, Trainer and other scopes.
- **Problems:** Prompt templates can be runtime-upserted; permission/scope controls need hardening; provider calls are synchronous.
- **Target boundary:** AI orchestration consumes policy-filtered context and cannot bypass owning-domain authorization.

## 16. Community

- **Purpose:** Groups, feed, events, challenges, alumni, marketplace, missions and community wallet.
- **Current locations:** `server/community`, `actions/community.ts`, `features/community`, `app/community-hub`.
- **Models:** `CommunityGroup`, `CommunityMembership`, `CommunityPost`, `CommunityComment`, `CommunityReaction`, `Event`, `Challenge`, `MarketplaceListing`, `AlumniProfile`, `Mission`, `Wallet`, `WalletTransaction`.
- **Server/actions/routes:** `/community`, `/community-hub/*`.
- **Dependencies:** Identity, Learning/batch, Career Hub, Communications.
- **Problems:** Any authenticated user passes the guard; wallet creation occurs while reading; marketplace boundaries are immature.
- **Target boundary:** Community owns social interactions; wallet/value transfer must use Finance-grade invariants if it becomes monetary.

## 17. Executive Intelligence

- **Purpose:** Cross-domain KPIs, institutional health, reports and decision support.
- **Current locations:** `server/executive`, `server/admin`, executive/admin pages and actions.
- **Models:** `ExecutiveReport`, `SystemSetting` plus read aggregation across most transactional models.
- **Server/actions/routes:** `/executive/*`, `/admin/dashboard`, director analytics.
- **Dependencies:** Read-only contracts from all operational domains and Organization scope.
- **Problems:** Live wide-table aggregation, unclear KPI definitions, runtime admissions bootstrap, limited pagination/caching, settings encryption not implemented.
- **Target boundary:** Read-model/reporting layer with versioned KPI definitions; it must not own operational writes or bootstrap data.

## Dependency Direction Guardrails

1. Identity and Organization are foundational and must not import feature UI.
2. Operational domains own writes to their aggregates.
3. Executive Intelligence consumes read models and events; it does not mutate source domains.
4. Communications, Documents, Automation and AI are capabilities reached through explicit service contracts.
5. Public/server actions validate input and authorize scope, then call an owning-domain service.
6. Direct Prisma access remains temporarily accepted, but new cross-domain orchestration should not deepen that coupling.

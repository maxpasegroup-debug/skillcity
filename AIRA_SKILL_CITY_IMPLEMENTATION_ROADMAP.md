# AIRA Skill City Implementation Roadmap

Audit date: 2026-09-27
Revision note: refreshed after completion of the Phase 0 repository guardrails.

This roadmap is based on the current codebase and the target AIRA Skill City Core/OS direction. It intentionally does not implement any changes.

## Phase 0 - Architecture Cleanup

Goal: make future work safe.

Status on 2026-09-27: **foundation completed; production refactors deferred by design.** Completed outputs include the repository baseline, Vitest/coverage setup, five baseline test files, GitHub Actions CI, 17-domain ownership map, admissions consolidation analysis, runtime-bootstrap audit, deferred-issue register, and ADR-001 through ADR-006. See `docs/architecture/PHASE_0_COMPLETION_REPORT.md`.

- Freeze production feature expansion until auth, permissions, data boundaries, and tests are planned.
- Create a domain map: Identity, Organization, Admissions CRM, Learning/ALTT, Finance, Documents, Communications, Careers, Community, AI, Executive.
- Use the documented consolidation plan before changing duplicate admissions phase logic between `actions/admissions.ts`, `actions/admission-phase4.ts`, and `actions/admission-phase5.ts` (deferred).
- Move runtime seed/bootstrap logic like `ensureDefaultPipeline()` only after production data characterization and an explicit setup/migration plan (deferred).
- Add test stack and CI: lint, typecheck, Prisma validate, unit tests, selected integration tests.
- Add architecture decision records for auth, permissions, storage, payments, WhatsApp, and tenancy.

Exit criteria:

- Test tooling and initial critical-pure-function coverage exist; workflow characterization continues in later phases.
- CI workflow validates install, Prisma, lint, types, tests and build; first hosted run must be green before Phase 1 merge.
- A clean module ownership map exists.

## Phase 1 - Core Authentication, Organization, Roles, Permissions

Goal: central AIRA identity and access foundation.

- Retain `User`, `Role`, `UserRole`, `Session` temporarily, but add a real permission model.
- Define permission keys for modules: admissions, academic, finance, HR, executive, documents, AI, community, careers.
- Add role-permission assignments instead of hardcoding role arrays everywhere.
- Add scoped access rules for district, campus, department, batch, assigned lead, assigned student.
- Harden auth: session rotation, device visibility, admin MFA or separate admin credential policy, email verification completion.
- Normalize organization scope: Institution, Campus, Department, District/Region, Centre/Branch.

Exit criteria:

- Every protected server action has policy checks.
- Every protected route has route/layout guard and server query scoping.

## Phase 2 - Employee, HR, Department System

Goal: make employees first-class AIRA Skill City operators.

- Expand `Employee` into an HR profile with employment lifecycle, reporting manager, location, department, designation, joining/exit, documents.
- Connect employees to roles and operational assignments.
- Connect recruitment `CareerApplication` to employee creation cleanly.
- Add HR dashboards for employee status, attendance if needed, documents, and onboarding.

Exit criteria:

- AIRA employees can be managed from central core with role, department, campus, and status.

## Phase 3 - CRM, Leads, Admissions

Goal: productionize the strongest existing subsystem.

- Keep and refine `Lead`, `PipelineStage`, `LeadActivity`, `AdmissionApplication`, `CounsellingSession`.
- Add pagination, assignment policies, SLA tracking, duplicate management, lead source governance.
- Create explicit lifecycle:
  Lead -> Counselling -> Application -> Review -> Payment Request -> Payment Verification -> Admission Confirmation -> Student Credential -> Enrollment -> Batch Assignment.
- Replace manual provider labels with a payment integration plan.
- Add admission event audit and communication logs.

Exit criteria:

- Admissions can support one district reliably with real reporting and traceability.

## Phase 4 - Startup School

Goal: build the Startup School vertical on top of core.

- Create Startup School domain models only where `Program/Journey/Enrollment` are insufficient.
- Add entrepreneur profile, venture/company profile, business model, founder milestones, revenue experiments, company formation checklist.
- Map ALTT to founder progression: clarity, offer, brand, sales, operations, launch, revenue.
- Add district target tracking: 240 entrepreneurs/companies per district per year.

Exit criteria:

- Startup School is not just a course. It tracks entrepreneur and business creation outcomes.

## Phase 5 - AIRA Labs and Brand/Product Portfolio

Goal: model AIRA Labs as a portfolio/business unit.

- Add Brand/Product/Project models under Labs.
- Track product owner, stage, revenue model, users, clients, tech stack, KPIs, documents, and decisions.
- Represent existing/future products: TeachX, LearnX, HappiNotes, BGOS, Talkin Labs, Sales Booster, ABSECO, Nice Jobs where applicable.
- Connect Labs products to executive dashboards.

Exit criteria:

- AIRA leadership can see and manage product portfolio status from one dashboard.

## Phase 6 - Skill Studio

Goal: create practical skill program infrastructure.

- Build skill tracks, project briefs, client/project linkage, evidence, reviews, and deployable portfolio outputs.
- Reuse ALTT, trainer, journey, submission, verified skill, certificate models where possible.
- Add commercial/project opportunity linkage instead of simple certificates.

Exit criteria:

- Skill Studio programs produce project evidence and opportunity readiness.

## Phase 7 - Career Hub and Nice Jobs

Goal: transform careers/RM seeds into a full opportunity system.

- Keep existing recruitment and RM development pieces as references.
- Build opportunity model: sales opportunity, lead allocation, referral, task, conversion, commission, wallet, payout.
- Add employer/client/opportunity entities.
- Define Nice Jobs as a product under Career Hub or AIRA Labs depending on final business structure.
- Build commission approval, payout workflow, fraud controls, and ledger.

Exit criteria:

- Nice Jobs has its own operational workflow, not only careers pages and RM development.

## Phase 8 - Finance, Compliance, Documents

Goal: production back-office reliability.

- Add payment gateway abstraction and Razorpay/UPI/webhook implementation if chosen.
- Add ledger-style finance records instead of only invoices and payment transactions.
- Add GST/receipt/invoice export strategy.
- Replace URL-only documents with storage provider, signed URLs, document ACL, verification, expiry, and audit.
- Add company legal/compliance document categories.

Exit criteria:

- Finance and documents are auditable and access-controlled.

## Phase 9 - WhatsApp, Email, Automation

Goal: operational communication layer.

- Replace log-only WhatsApp with provider integration.
- Add inbound webhook/callback processing and delivery status updates.
- Add email log, templates, retries, bounce handling if provider supports it.
- Implement automation runner for `AutomationRule` and `AutomationExecution`.
- Add scheduled jobs for reminders, payment follow-ups, absence alerts, trainer pending reviews.

Exit criteria:

- Communication events are reliable, logged, retryable, and auditable.

## Phase 10 - AI Layer

Goal: make Tara useful and governed across roles.

- Keep `AIConversation`, `AIMessage`, `PromptTemplate`, `AIUsageLog`, `TokenUsage`.
- Add scoped AI tools for admissions, trainer, director, executive.
- Add data minimization and permission-aware context builders.
- Add cost limits, abuse limits, feedback loops, and prompt governance.

Exit criteria:

- Tara can assist operators and learners without leaking data across roles.

## Phase 11 - Executive Dashboards

Goal: true CEO/executive operating dashboard.

- Define KPIs per vertical: Startup School, Labs, Skill Studio, Career Hub, Nice Jobs.
- Replace placeholder metrics with audited aggregates.
- Add time series and district/campus filters.
- Add portfolio views, revenue views, admissions funnel, HR, finance, learning health, AI usage.

Exit criteria:

- CEO dashboard answers "what is happening, where, why, and what action is needed."

## Phase 12 - Mobile and PWA Improvements

Goal: make high-frequency student/operator workflows mobile-friendly.

- Audit responsive behavior page by page.
- Prioritize student dashboard, apply flow, WhatsApp PIN login, trainer attendance, telecaller/counsellor lead handling.
- Add PWA if useful for student and field sales workflows.
- Improve accessibility, loading states, empty states, and offline/error handling.

Exit criteria:

- Primary workflows are usable on mobile without layout breaks or dead ends.

## Recommended First Development Phase

Phase 0 is complete. Start Phase 1 as a controlled identity, organization and authorization sprint:

1. Add characterization tests for existing route/action guards and cross-role access.
2. Decide the Company/Division/Region/District/Campus/Department hierarchy mapping.
3. Define permission keys, scoped grants and compatibility behavior for current roles.
4. Harden session/admin access without replacing the authentication foundation.
5. Introduce policies incrementally, then address admissions/runtime bootstrap through their documented plans.

Reason: the current app already has useful admissions and learning code, and Phase 0 now protects the baseline. Permissions and organization scope are the next dependency for every vertical; production admissions cleanup should follow characterization rather than precede it.

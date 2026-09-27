# AIRA Skill City Current State Audit

Audit date: 2026-09-27
Application inspected: existing `D:\APPS\WEB\skillcity` codebase
Revision note: refreshed after completion of the Phase 0 repository guardrails.

## A. Current System Summary

The current application is a large Next.js App Router monolith for AIRA Skill City. It already includes public marketing/application pages, custom authentication, admissions CRM, learning/journey/ALTT features, trainer/director/admin/executive dashboards, student success, community, recruitment, relationship-manager development, Tara AI, and preliminary organization/HR models.

It is not yet a clean central AIRA Skill City Core/OS. The strongest implemented area is admissions plus learning/trainer workflows. Several future-facing areas exist as schemas and dashboards but are incomplete, manual, or placeholder-like.

Evidence:

- Next.js App Router: `app/*`
- Package stack: `package.json`
- Prisma schema: `prisma/schema.prisma`
- Auth/session: `server/auth/session.ts`, `actions/auth.ts`
- Admissions: `server/admissions/queries.ts`, `actions/admissions.ts`, `actions/admission-phase4.ts`
- Learning: `server/journey/queries.ts`, `server/altt/queries.ts`
- Executive/organization: `server/executive/queries.ts`, `actions/executive.ts`

## B. What Is Good

- The codebase has a real PostgreSQL/Prisma data model, not just static pages.
- Admissions has a credible end-to-end base: lead, application, review, invoice, payment record, admission activation, student credential, enrollment.
- Learning has structured program/journey/day/activity/progress models.
- Trainer access is batch-scoped through `getAssignedBatchIds()` and `assertTrainerBatchAccess()` in `server/trainer/queries.ts`.
- Tara AI has a real route, context builder, prompt templates, usage logging, and OpenAI Responses API integration path.
- The system already separates many server queries/actions by domain folders.
- Railway deployment configuration exists.
- A Phase 0 guardrail layer now exists: Vitest baseline tests, scoped coverage, GitHub Actions CI, domain ownership documentation, runtime-bootstrap analysis, admissions consolidation analysis, and six ADRs under `docs/architecture`.

## C. What Must Be Kept

- Next.js + Prisma foundation, unless a later architecture session chooses to split services.
- `User`, `Role`, `Session` base, as a bridge to a hardened identity system.
- Admissions CRM data model: `Lead`, `LeadActivity`, `AdmissionApplication`, `CounsellingSession`, `FeeInvoice`, `PaymentTransaction`.
- Learning model: `Program`, `Journey`, `Batch`, `Activity`, `StudentEnrollment`, `StudentProgress`.
- Trainer/director academic operations foundation.
- Tara AI conversation, message, usage, prompt template models.
- Recruitment models as a seed for HR/Career Hub.

## D. What Must Be Modified

- Authorization must move from scattered role-name checks to a permission/policy layer.
- Public application and admissions phase flows must be consolidated.
- Organization scope must be added consistently to leads, enrollments, finance, users/employees, and reports.
- Rate limiting must move from process memory to a durable/shared store.
- Dashboards need reliable KPI definitions and pagination.
- Documents must move from URL fields to secure storage.
- Communication architecture must gain queues, retries, logs, and provider status.

## E. What Should Be Removed

- Production reliance on `server/whatsapp/provider.ts` log-only WhatsApp provider.
- Runtime data bootstrapping from read paths, especially `ensureDefaultPipeline()` being called by dashboard/query functions.
- Placeholder/future text in production user journeys where it implies capabilities that do not exist.
- Any public production exposure of `/email-previews` unless access controlled.

## F. What Should Be Rebuilt

- Payments: current implementation is manual/provider-neutral records, not a gateway system.
- WhatsApp: current provider logs and returns `SENT`.
- Documents/storage: current system stores URLs only.
- Automation: schema/UI exists but no runner/scheduler was found.
- Permission system: roles exist, permissions do not.
- AIRA Labs portfolio and Nice Jobs product architecture: currently represented mostly by content/program/recruitment fragments.

## G. What Is Completely Missing

- Granular permission table/policy engine.
- District/region/branch/centre tenancy model.
- Real WhatsApp integration and webhooks.
- Payment gateway SDKs/webhooks/reconciliation.
- Secure file uploads/object storage.
- Application-wide integration/e2e coverage and a database-backed CI test stage. A baseline unit/server/domain test harness and CI workflow now exist.
- Automated job runner/queue.
- Brand/Product/Portfolio models for AIRA Labs.
- Full Nice Jobs opportunity/commission/payout platform.
- Full email logging/retry/delivery status architecture.

## 1. Technology Audit

### Framework and Build

- Framework: Next.js App Router with React and TypeScript.
- Build: `npm run build` runs `prisma generate && next build`.
- Package manager: npm, evidenced by `package-lock.json`.
- Node: `>=20.9.0`, `.node-version`, `.nvmrc`.
- Tailwind CSS and PostCSS are configured.

Evidence: `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`.

### Backend Architecture

Backend logic is implemented inside the Next.js app using:

- Server actions in `actions/*.ts`
- Server query/service modules in `server/*`
- One API route: `app/api/tara/stream/route.ts`
- Prisma direct calls throughout server actions and server query modules

There is no separate backend service.

### Database and ORM

- Database: PostgreSQL via Prisma datasource.
- ORM: Prisma Client 6.19.3 installed (`^6.16.3` manifest range).
- Migrations: 17 migration folders from auth through recruitment hardening.
- Models: 120.
- Enums: 84.

Evidence: `prisma/schema.prisma`, `prisma/migrations/*`, `lib/prisma.ts`.

### Auth

Auth is custom:

- Session cookie name: `skillcity_session`
- Session duration: 30 days
- Token is stored in cookie, hashed in DB as `Session.tokenHash`
- Passwords/PINs use bcrypt helpers
- Email OTP and password reset token tables exist

Evidence: `server/auth/session.ts`, `actions/auth.ts`, `lib/security/password.ts`, `lib/security/token.ts`.

### Authorization

Authorization is role-name based:

- Admin: `Admin`, `Director`
- Director: `Director`, `Admin`
- Executive: `Director`, `Admin`
- Admissions: `Admission`, `Director`, `Admin`
- BDM: `Business Development`, `Relationship Manager`, `Director`, `Admin`
- Recruitment: `Admin`, `Director`, `CEO`, `COO`, `HOD`, `HR Manager`, `HR Executive`
- Trainer: `Trainer`, `Director`, `Admin`

Evidence: `server/admin/queries.ts`, `server/director/queries.ts`, `server/executive/queries.ts`, `server/admissions/queries.ts`, `server/careers/queries.ts`, `server/trainer/queries.ts`.

There is no permission model. `types/auth.ts` lists platform roles, but no permission table exists.

### Email

Resend is used when `RESEND_API_KEY` exists. Development mode logs email metadata. Production throws if key is missing.

Evidence: `server/email/provider.ts`, `emails/templates.ts`, `.env.example`.

### WhatsApp

WhatsApp is not production-integrated. `LogOnlyWhatsAppProvider` writes to console and returns `SENT`.

Evidence: `server/whatsapp/provider.ts`, `server/whatsapp/service.ts`, `WhatsAppMessageLog` model.

### Payments

Payment provider enum includes Razorpay, Stripe, Manual, Scholarship. The actual workflow is manual capture and verification. No Razorpay/Stripe package, gateway client, webhook route, or callback endpoint was found.

Evidence: `PaymentProvider` enum in `prisma/schema.prisma`, `actions/admission-phase4.ts`, `features/admissions/components/phase4-forms.tsx`.

### AI

Tara uses OpenAI Responses API if `OPENAI_API_KEY` exists and falls back to a configuration message otherwise. Usage is logged to `AIUsageLog` and `TokenUsage`.

Evidence: `server/ai/tara.ts`, `app/api/tara/stream/route.ts`, `server/ai/context.ts`, `server/ai/prompts.ts`.

### Deployment

Railway deployment is configured:

- Builder: Nixpacks
- Build command: `npm run build`
- Start command: `npm run prisma:deploy && npm run start`

Evidence: `railway.json`.

### Testing and CI

Phase 0 added a minimal test and CI foundation:

- Vitest 3.2.4 with V8 coverage is configured in `vitest.config.ts`.
- `package.json` exposes `test`, `test:watch`, and `test:coverage`.
- Five test files currently contain 10 database-free baseline tests across security tokens/passwords, admissions schemas, WhatsApp templates, and the WhatsApp provider-to-log boundary.
- `.github/workflows/ci.yml` runs `npm ci`, Prisma generation/validation, lint, typecheck, tests, and production build on pull requests and pushes to `main`.
- CI uses placeholder non-secret environment values and does not run migrations or database-backed tests.
- The workflow is configured but no remote GitHub run is evidenced in the local repository.
- Current read-only validation snapshot: 5 test files/10 tests passed; ESLint passed; TypeScript passed; Prisma schema validation passed with a placeholder PostgreSQL-shaped URL (no database connection or migration).

Evidence: `package.json`, `vitest.config.ts`, `tests/*`, `.github/workflows/ci.yml`, `docs/architecture/PHASE_0_COMPLETION_REPORT.md`.

## 2. Complete Application Map

See `AIRA_SKILL_CITY_ARCHITECTURE_MAP.md` for route, model, service, and action maps.

## 3. User and Role System

### Existing User Types

User types are represented mostly by roles:

- Student
- Telecaller
- Counsellor
- Trainer
- Director
- CEO
- COO
- HOD
- HR Manager
- HR Executive
- Interviewer
- Admission
- Business Development
- Relationship Manager
- Admin

Evidence: `types/auth.ts`, `prisma/seed.ts`.

### Role Storage

Roles are stored in:

- `Role`
- `UserRole`

Role checks use `user.roles.map(item => item.role.name)`.

### Auth Flow

Email/password login:

1. `loginAction()` validates credentials.
2. Finds `User` by email.
3. Verifies password hash.
4. Blocks suspended/deleted users.
5. Creates audit log.
6. Calls `createSession()`.
7. Redirects to `/`.

WhatsApp PIN login:

1. `whatsappPinLoginAction()` normalizes WhatsApp.
2. Looks up `StudentLoginCredential`.
3. Checks active/revoked/expired.
4. Verifies PIN hash.
5. Updates last used and audit log.
6. Creates session.
7. Redirects to `/reset-pin` or `/dashboard`.

Evidence: `actions/auth.ts`.

### Permission Problems

- No permissions table.
- No role hierarchy model.
- Student requirement in `server/journey/queries.ts` checks only login, not `Student` role.
- Community and success modules allow any authenticated user through `requireCommunityUser()` and `requireSuccessStudent()` without role checks.
- Role names are hardcoded across many files.
- Some admin/executive roles overlap ambiguously.

## 4. Database Audit

### Overall

The schema is broad and ambitious: 120 models and 84 enums. It covers auth, LMS, ALTT, admissions, finance, communications, community, careers, executive OS, AI, and documents.

Strengths:

- Many foreign keys and indexes exist.
- Major workflow entities are connected.
- Soft-delete exists on selected models.
- Audit logging exists.

Concerns:

- The schema is too broad for the current implementation maturity.
- Some future-facing provider tables exist without active integrations.
- Several models are likely underused or only dashboard-backed.
- There is no tenant/district/centre scoping across core tables.
- `SystemSetting.encrypted` exists, but no encryption service was found in current inspected code.

### Important Model Groups

Identity:

- `User`, `Role`, `UserRole`, `Session`, `EmailOTP`, `PasswordResetToken`, `AuditLog`, `StudentLoginCredential`.

Learning:

- `Program`, `Journey`, `JourneyPhase`, `JourneyWeek`, `JourneyDay`, `Activity`, `StudentEnrollment`, `StudentProgress`.

Admissions:

- `Lead`, `PipelineStage`, `LeadSource`, `LeadActivity`, `LeadNote`, `CounsellingSession`, `AdmissionApplication`.

Finance:

- `FeeInvoice`, `PaymentTransaction`, `CommissionRecord`.

Documents:

- `StudentDocument` with `fileUrl`.
- `ContentLibrary` with URL/upload metadata.

Executive:

- `Institution`, `Campus`, `Department`, `Employee`, `AutomationRule`, `AutomationExecution`, `ExecutiveReport`, `SystemSetting`.

AI:

- `AIConversation`, `AIMessage`, `PromptTemplate`, `AIUsageLog`, `AIFeedback`, `TokenUsage`.

## 5. Feature Audit

Detailed classifications are in `AIRA_SKILL_CITY_GAP_ANALYSIS.md`.

Summary:

- Strongest: Admissions CRM, learning journey, trainer workspace, Tara base.
- Partial: Executive OS, community, success portfolio, HR/recruitment.
- Missing production integration: payments, WhatsApp, file storage, automation runner, database-backed integration tests, and browser end-to-end tests. Baseline tests and CI now exist.

## 6. UI/UX Audit

Live visual inspection was attempted against the local development server on 2026-09-27, but the in-app browser surface was unavailable. The UI conclusions below are therefore based on route/component/style inspection and successful production compilation, not screenshot-based responsive or interaction verification. Mobile breakpoints, focus order, visual overlap, dead controls, and runtime loading/error behavior still require a dedicated browser QA pass.

### Landing Page

Implemented in `features/landing/components/aira-landing-v2.tsx`.

Observations:

- Strong visual design with real image assets under `public/launch/v2/*`.
- Uses client-side GSAP animations.
- Main navigation is simple: Login and Apply Now.
- Some copy is generic and some text has mojibake quote characters.
- Programs shown are Startup Skool, AIRA Labs, Career Hub, but the future business architecture is not fully represented.

### Dashboards

Many dashboards exist, but density and maturity vary:

- Admin dashboard aggregates a large number of metrics in `server/admin/queries.ts`.
- Executive dashboard has broad pages but many metrics are simple counts or placeholders.
- Student dashboard is coherent and enrollment-aware.
- Trainer dashboard is practical but query-heavy.

### UI Risks

- Potential confusion from many role-specific workspaces.
- Some areas are likely empty-state-heavy because models exist before data.
- Public application status reveals high-level status by WhatsApp number; useful, but should be reviewed for privacy.
- `/email-previews` should not be public in production.

Keep:

- Student dashboard direction.
- Admissions operational pages.
- Trainer/director shells.
- Public application modal concept.

Redesign:

- Landing information architecture.
- Executive dashboard.
- Community marketplace and Nice Jobs positioning.
- Admin/settings/security flows.

Remove or gate:

- Email previews in production.
- Placeholder/future copy that promises unavailable capabilities.

## 7. Business Logic Audit

### Lead to Student Flow

Implemented path:

1. Public application creates/updates `Lead` and `AdmissionApplication` via `actions/public-application.ts`.
2. Admissions review updates application and pipeline via `reviewApplicationAction()`.
3. Payment request creates `FeeInvoice` in `actions/admission-phase4.ts`.
4. Manual payment capture creates `PaymentTransaction`.
5. Payment verification updates transaction and invoice.
6. Admission confirmation creates/updates student user, student role, activation profile, enrollment, lead status, and WhatsApp login credential.
7. Student logs in via WhatsApp PIN and resets PIN.
8. Student dashboard reads active enrollment and journey.

This is real but still manual/incomplete at integration points.

### Employee and HR

Career applications, interviews, recruitment stages, employee linking, and RM development exist in `actions/careers.ts` and `server/careers/queries.ts`. Full HR lifecycle is not complete.

### Sales and BDM

Lead assignment, referrals, commission records, BDM dashboard, RM development exist. Nice Jobs as a platform does not yet exist.

### Finance

Invoices and payment records exist. No ledger, payout, tax compliance, receipt generation, or gateway reconciliation found.

## 8. Security Audit

Risks found from code inspection:

- Role checks are hardcoded and not permission-based.
- `requireStudent()`, `requireCommunityUser()`, and `requireSuccessStudent()` only require login, not student role.
- Rate limiting is in-memory and not reliable across server instances.
- WhatsApp provider logs sensitive message contents including temporary PIN text in development/log-only mode.
- `AUTH_SECRET` is validated in env but not used in the inspected session-token flow.
- Documents are arbitrary URLs, with no signed access or ACL.
- Public application status lookup uses WhatsApp number only.
- `/email-previews` may expose templates if not protected.
- No CSRF-specific strategy was identified beyond server action patterns and SameSite=Lax cookie.
- No monitoring/security alerting found.

Positive:

- Session token stored hashed in DB.
- Cookie is httpOnly, SameSite=Lax, secure in production.
- Basic security headers are set in `proxy.ts`.
- Suspended/deleted checks exist in login/session retrieval.

## 9. Performance and Scalability Audit

Current architecture can support an early pilot or one district if data volume stays modest. It is not ready for multi-state scale without query and architecture work.

Risks:

- Many dashboard queries use large `include` trees.
- Several list views have no or limited pagination.
- `ensureDefaultPipeline()` mutates/ensures database state during dashboard/query execution.
- In-memory rate limiting fails across multiple instances.
- No queue for email/WhatsApp/AI/payment processing.
- No caching strategy for public content or dashboard aggregates.
- Executive/admin dashboards aggregate live transactional tables.

Examples:

- `server/admin/queries.ts` loads many dashboard metrics in one function.
- `server/trainer/queries.ts` loads batches, enrollments, progress, submissions, attendance, activities.
- `server/community/queries.ts` pulls many community collections in one call.

## 10. Automation Audit

Existing:

- `AutomationRule` and `AutomationExecution` models.
- UI/server action to create automation rule in `actions/executive.ts`.

Partial:

- Notifications created in some workflows, especially careers.
- Email sending in auth flows.
- WhatsApp message log creation.

Missing:

- Automation runner.
- Scheduled jobs.
- Queues.
- Retry mechanism.
- Webhook processing.
- Payment callbacks.
- WhatsApp inbound/delivery callbacks.
- Reminder engines.

## 11. Document Management Audit

Current document handling:

- `StudentDocument` stores `fileUrl`, type, title, status, rejection reason.
- Admissions document form asks for a URL.
- `ContentLibrary` has URL-style resource fields.

No Cloudinary, S3, Supabase Storage, local upload route, signed URL flow, or storage provider usage was found. Provider config tables exist (`StorageProvider`) but are not an active storage implementation.

## 12. Email Architecture Audit

Current:

- Provider: Resend.
- Templates: `emails/templates.ts`.
- Used by auth registration and reset flows.
- Development logs email target and subject.

Missing:

- Email log table usage for actual sends.
- Retry/queue.
- Bounce handling.
- Domain provisioning/admin.
- Employee mailbox/user email creation.
- IMAP or inbound processing.

## 13. AIRA Labs and Brand Portfolio Audit

Existing product/brand references:

- AIRA Skill City - main application and landing.
- Startup Skool - public program and seeded program.
- AIRA Labs - public program and landing content.
- GenZ Builder - public program.
- NiceJobs/Nice Jobs - seeded/free internship program, careers/RM-adjacent work.
- Career Hub - landing card.
- AI Skills Academy, Internship Academy, Care Professionals Academy, Teacher Academy, Defence Career Academy - static academy content in `features/launch/content.ts`.

Mentioned in business brief but not found as real product modules/models:

- TeachX
- LearnX
- HappiNotes
- BGOS
- Talkin Labs
- Sales Booster
- ABSECO

Current implementation status:

- AIRA Labs is represented as program/content, not a portfolio system.
- Nice Jobs is represented partially by program/recruitment/RM constructs, not a standalone platform.
- No `Brand`, `Product`, `Portfolio`, or `Venture` model exists.

## 14. Code Quality Audit

Strengths:

- TypeScript strict mode enabled.
- Zod schemas used in feature modules.
- Server actions usually validate form data.
- Domain folders are mostly clear.

Technical debt:

- Large schema and broad modules may be ahead of actual product readiness.
- Role names repeated throughout code.
- Runtime upsert/seed behavior inside request path.
- Multiple admissions action files with overlapping concepts.
- Test coverage is intentionally narrow and database-free; most server actions, policies, pages, and business state transitions remain uncharacterized.
- CI is configured locally but has not yet been proven by a GitHub-hosted run.
- Some copy/assets indicate placeholder launch state.
- External provider abstractions are incomplete.

## 15. Architectural Decision

Overall classification: MODIFY, not full rebuild.

Keep:

- Next.js/Prisma app foundation.
- Admissions CRM base.
- Learning/journey/trainer base.
- Tara AI base.
- Recruitment seed.

Modify:

- Auth, authorization, organization scope, dashboards, admissions workflow boundaries.

Rebuild:

- Payments, WhatsApp, documents, automation, permission system, Labs portfolio, Nice Jobs platform layer.

Remove/gate:

- Production exposure of previews/placeholders/stubs.

## 16. Target Architecture Gap Analysis

See `AIRA_SKILL_CITY_GAP_ANALYSIS.md`.

## 17. Final Recommendation

The next architecture/planning session should not start with a blank rewrite. The codebase already contains useful business knowledge and usable workflows, especially admissions and learning. The correct path is a controlled architecture cleanup followed by hardening of identity, permissions, organization scope, integrations, and tests.

Recommended target architecture:

- One central AIRA Skill City Core/OS.
- Modular domains inside the current app first, with service extraction only when needed.
- Unified identity, organization, permissions, and audit layer.
- Shared CRM/admissions/finance/document/communication services.
- Vertical portals for Startup School, Labs, Skill Studio, Career Hub/Nice Jobs using the shared core.

## 18. Implementation Roadmap

See `AIRA_SKILL_CITY_IMPLEMENTATION_ROADMAP.md`.

## Executive Summary

1. This application currently is a large AIRA Skill City monolith with real admissions, learning, trainer, student, admin, executive, community, recruitment, and AI surfaces.
2. It uses Next.js App Router, Prisma, PostgreSQL, custom cookie sessions, server actions, Resend, OpenAI, and Railway.
3. Already good: admissions CRM, learning data model, trainer scoping, Tara base, broad Prisma model coverage.
4. Structurally wrong: role checks are scattered, permissions are missing, integrations are stubs/manual, dashboards query transactional data directly.
5. Should be removed/gated: log-only WhatsApp reliance, public preview routes, placeholder production promises, runtime seeding in read paths.
6. Should be rebuilt: payments, WhatsApp, documents/storage, automation runner, permission system, Labs portfolio, Nice Jobs platform layer.
7. Missing: district/branch tenancy, secure uploads, payment webhooks, WhatsApp callbacks, brand/product management, a real executive KPI layer, database-backed integration tests, and end-to-end browser coverage.
8. Biggest gaps: permissions, payments, WhatsApp, documents, automation, organization scope, Labs portfolio, executive data layer, Nice Jobs platform, and broad regression coverage.
9. Recommended target architecture: central AIRA Core with shared identity/org/permissions/CRM/finance/documents/comms/AI services and vertical portals on top.
10. Recommended first development phase: Phase 1 - identity/auth hardening, organization hierarchy decisions, scoped permissions, and characterization tests around existing authorization and admissions behavior. Phase 0 guardrails are complete; admissions consolidation and runtime-bootstrap removal remain deliberately deferred.

# AIRA Skill City Gap Analysis

Audit date: 2026-09-27
Revision note: refreshed after completion of the Phase 0 repository guardrails.

## Current vs Target

| Area | Current State | Target State | Gap | Action | Priority |
|---|---|---|---|---|---|
| Core OS | Large Next.js monolith with many vertical modules; ownership is now documented in `docs/architecture/AIRA_DOMAIN_OWNERSHIP.md` | Central AIRA Skill City core with enforced vertical boundaries | Runtime code is still mixed by route/role rather than domain contracts | Introduce boundaries incrementally after identity/scope work | P1 |
| Authentication | Custom cookie sessions in DB | Production-grade central identity | No MFA, weak admin PIN semantics, limited session device controls | Harden auth and define identity service | P0 |
| Authorization | Role name checks in layouts/actions | Role and permission matrix with server-enforced policies | No permission model, no scoped ABAC, inconsistent student/community role checks | Add permission table/policy layer | P0 |
| Organization | Institution/Campus/Department/Employee models exist | Full organization hierarchy with branches, districts, centres | Models are new/partial and not consistently connected to all data | Normalize org scope across all core records | P0 |
| District strategy | No district entity | Multi-district, multi-state operations | District is just text in some records | Add district/region model and tenancy strategy | P0 |
| Startup School | Program/admissions/journey can support it | Dedicated Startup School entrepreneurship OS | No founder venture lifecycle, company creation, MSME/PLC workflow | Build Startup School domain on core entities | P1 |
| ALTT | Learning flows, steps, sessions, progress exist | ALTT as ecosystem-wide methodology | Implemented as learning feature, not a system-level methodology model | Formalize ALTT entities, rubrics, evidence | P1 |
| AIRA Labs | Public program and static references | Brand/product portfolio under AIRA Labs | No product portfolio model, brand P&L, project/product governance | Add Labs portfolio module | P1 |
| Skill Studio | Some public academy/program references | Practical skill program vertical | No distinct Skill Studio domain | Model skill studio tracks, projects, clients | P2 |
| Career Hub | Recruitment and student success exist | Talent/opportunity ecosystem | No central opportunity marketplace or employer/client model | Build Career Hub around opportunities | P1 |
| Nice Jobs | NiceJobs launch program and RM workflows exist | Nice Jobs platform under Career Hub | Not a separate product module; no robust wallet/commission payout architecture | Rebuild as Career Hub/Nice Jobs subsystem | P1 |
| Admissions | Strongest implemented workflow | End-to-end lead to enrollment | Good base, but payment/webhook/docs are manual and some duplicate paths exist | Consolidate phases and add real integrations | P0 |
| CRM | Leads, stages, activities, notes exist | Scalable CRM with assignments, SLAs, automation | Pipeline seeded at runtime, limited pagination, broad data access for admin/admission | Formalize CRM service and scoping | P1 |
| Payments | Manual/provider-neutral records | Razorpay/UPI/receipts/webhooks/reconciliation | No real gateway integration or webhooks | Add payment provider layer | P0 |
| Finance | Invoices, payments, commissions | Accounting, payouts, GST, compliance | Basic records only, no ledger/reconciliation | Add finance ledger and approval workflows | P1 |
| Documents | StudentDocument URL, ContentLibrary URL | Secure document management | No upload service, no signed URLs, no object permissions | Add storage provider and document ACL | P0 |
| Email | Resend send-only | Templates, logs, queues, domain config, retries | No queue/retry/status log per outbound email | Add communication service | P1 |
| WhatsApp | Log-only provider | Production WhatsApp provider/callbacks/templates | No actual provider integration | Add WhatsApp provider abstraction and callbacks | P0 |
| Notifications | DB notifications exist | Omnichannel notification center | No delivery worker, preferences, or realtime | Build notification pipeline | P2 |
| Automation | Rule/execution tables plus UI | Operational automation engine | No executor/scheduler found | Implement automation runner | P1 |
| AI | Tara chat with OpenAI | AI copilots across operations | Good starting point, but no policy/guardrail/cost controls beyond logs | Add AI governance and scoped tool access | P1 |
| Employee HR | Employee and career application models | HR lifecycle from hiring to employee ops | Hiring exists; employee management is shallow | Build HR lifecycle | P1 |
| Student lifecycle | Enrollment/journey/progress/success | Full student operating record | Good learning base; lacks compliance, documents, finance linkage depth | Strengthen student master data | P1 |
| Trainer ops | Trainer assignments, attendance, reviews | Scalable academic operations | Good early implementation, but many heavy include queries | Add pagination, indexes, service contracts | P2 |
| Executive dashboard | Many dashboard routes and aggregate queries | Reliable CEO dashboard | Metrics include placeholder values and raw counts | Define KPI warehouse/aggregation | P1 |
| Brand management | Static brand references in code | Brand/product management under AIRA Labs | No Brand/Product model | Add portfolio data model | P1 |
| Security | Some secure headers and hashing | Defense-in-depth | In-memory rate limits, no CSRF strategy noted, no permission model | Security hardening phase | P0 |
| Scalability | Direct Prisma calls in pages/actions | Service-layer architecture | Large includes, no pagination in many admin views, runtime pipeline seeding | Query optimization and domain services | P1 |
| Testing | Vitest baseline: 5 files/10 database-free tests | Regression-safe development with unit, integration and e2e coverage | Harness works, but most workflows and all real DB transactions are untested | Add characterization, database integration and browser tests incrementally | P1 |
| CI/CD | Railway deployment plus GitHub validation workflow | Proven CI with lint/type/test/build and isolated DB integration stage | Workflow exists but first hosted run and test database are still pending | Make first run green, then add isolated PostgreSQL integration job | P1 |
| Observability | Console and DB audits | Structured logs, metrics, errors | No Sentry/OpenTelemetry/health checks | Add monitoring | P1 |

## Feature Classification

Legend:

- A = Fully implemented and apparently working
- B = Implemented but incomplete
- C = UI exists but backend is missing/incomplete
- D = Backend exists but UI is missing/incomplete
- E = Placeholder/mock/demo
- F = Broken
- G = Duplicate/conflicting implementation
- H = Obsolete/unwanted

| Feature | Grade | Evidence | Reason |
|---|---:|---|---|
| Landing/public site | B | `features/landing/components/aira-landing-v2.tsx`, `features/launch/content.ts` | Rich UI exists; content has placeholder/future language and some mojibake quote text. |
| Public applications | B | `actions/public-application.ts`, `/apply`, `/application-status` | Creates/updates leads/applications with dedupe and rate limit; no captcha, queue, or notification provider. |
| Auth registration/login | B | `actions/auth.ts`, `server/auth/session.ts` | Custom sessions work, but no email verification completion flow was seen and rate limit is in-memory. |
| Admin/director login | B | `actions/admin-control.ts`, `/admin-login` | Role-restricted, but admin "PIN" is stored as user password hash semantics. |
| Role system | B/G | `types/auth.ts`, `Role`, `UserRole`, many `require*` functions | Roles exist but no granular permission model; role names scattered in code. |
| Student dashboard/journey | B | `server/journey/queries.ts`, `app/(student)/dashboard/page.tsx` | Real enrollment/progress logic; student role check is loose in `requireStudent()`. |
| ALTT learning | B | `LearningFlow`, `LearningStep`, `server/altt/queries.ts` | Meaningful schema and UI, but not yet core methodology across all verticals. |
| Director academic command center | B | `server/director/queries.ts`, `actions/director.ts` | Can manage programs, blueprints, batches, content, calendar. Needs workflow hardening. |
| Trainer workspace | B | `server/trainer/queries.ts`, `actions/trainer.ts` | Batch scoped access exists. Query load may grow quickly. |
| Admissions CRM | B | `server/admissions/queries.ts`, `actions/admissions.ts` | Strong implementation base; duplicated phase actions and runtime seeding need cleanup. |
| Payment workflow | C/D | `actions/admission-phase4.ts`, `PaymentTransaction` | Manual capture/verification only. No Razorpay/Stripe implementation despite enum/UI labels. |
| Student credential via WhatsApp | B/C | `StudentLoginCredential`, `server/whatsapp/provider.ts` | Credential generation exists; WhatsApp delivery is log-only. |
| Documents | C | `StudentDocument.fileUrl`, `features/admissions/components/admission-forms.tsx` | Stores URLs only, no upload/storage/permission layer. |
| Email | C | `server/email/provider.ts`, `emails/templates.ts` | Resend send path exists; no delivery logs, retries, queues, or domain management. |
| WhatsApp | E/C | `server/whatsapp/provider.ts` | Provider always logs and returns SENT. |
| Tara AI | B | `app/api/tara/stream/route.ts`, `server/ai/tara.ts` | Contextual AI works if configured; fallback is configuration message. |
| Community hub | B/C | `server/community/queries.ts`, `actions/community.ts` | Many social/marketplace features exist, but broad authenticated access and shallow moderation. |
| Student success/portfolio | B/C | `server/success/queries.ts`, `actions/success.ts` | Good data surface, but no public portfolio routing or deep verification workflow seen. |
| Recruitment/HR | B | `actions/careers.ts`, `server/careers/queries.ts` | Public applications and internal stages exist; HR lifecycle is partial. |
| Relationship manager development | B/C | `RelationshipManagerDevelopment`, `server/careers/rm-performance.ts` | Interesting Nice Jobs-adjacent workflow; not complete Nice Jobs platform. |
| Executive OS | C | `actions/executive.ts`, `server/executive/queries.ts` | Organization models and dashboards exist, but many are CRUD/aggregate shells. |
| Automation center | C/D | `AutomationRule`, `AutomationExecution`, `actions/executive.ts` | Rules can be created; no executor/scheduler found. |
| Notifications | D | `Notification` model, notifications in `actions/careers.ts` | Internal DB notifications created; no delivery UX/system-wide handling. |
| File/image storage | C | URL fields, `public/launch/*` | Public assets exist; no managed storage provider active. |
| Reports | C | `ExecutiveReport`, `actions/executive.ts` | Creates payloads, but no real report generation/export. |
| Testing/QA | B | `package.json`, `vitest.config.ts`, `tests/*`, `.github/workflows/ci.yml` | Test/CI foundation works locally; coverage is deliberately narrow and database/e2e layers are missing. |

## Biggest 10 Gaps

1. No granular permission system: roles are name checks, permissions are not modeled.
2. No production payment gateway/webhook flow.
3. WhatsApp is log-only while credentials depend on WhatsApp delivery.
4. Document management is URL storage, not secure file management.
5. Automation tables exist without a runner.
6. Baseline tests and CI now exist, but broad business-flow, database and browser regression coverage is still missing.
7. No district/branch/centre tenancy model despite target scale.
8. AIRA Labs brand/product portfolio is not modeled.
9. Executive dashboards are aggregate pages, not a reliable operating data layer.
10. Runtime mutation helpers such as `ensureDefaultPipeline()` are called from read paths, mixing bootstrapping with requests.

## Subsystem Keep/Modify/Rebuild/Remove

| Subsystem | Decision | Notes |
|---|---|---|
| Next.js + Prisma base | Keep/Modify | Valid stack for current phase; introduce modular services and tests. |
| Custom auth | Modify hard | Can be retained temporarily, but needs security hardening and permission layer. |
| Admissions CRM | Keep/Modify | Best existing foundation. Consolidate duplicate phase flows and add integrations. |
| Learning/Journey/ALTT | Keep/Modify | Strong data model start. Formalize ALTT as first-class methodology. |
| Trainer workspace | Keep/Modify | Useful and scoped. Optimize queries. |
| Public landing/apply | Keep/Redesign | Keep application capture. Redesign content/UX for accurate business positioning. |
| WhatsApp | Rebuild | Current provider is stub. |
| Payments | Rebuild | Manual records are not enough for production. |
| Documents/storage | Rebuild | Needs secure upload/storage/ACL. |
| Automation | Rebuild/Implement | Schema exists but engine missing. |
| AIRA Labs portfolio | Build new | Mostly missing. |
| Nice Jobs | Build under Career Hub | Existing careers/RM pieces are seeds, not final platform. |
| Executive OS | Modify/Rebuild parts | Org models useful; dashboards need real operating definitions. |

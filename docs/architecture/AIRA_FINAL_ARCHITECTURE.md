# AIRA Skill City Final Architecture

## System Overview

AIRA Skill City is a single Next.js App Router application backed by Prisma and PostgreSQL. React server components render operational views, server actions own mutations, and two route handlers provide Tara streaming and scoped executive CSV export. Railway is the deployment target. The architecture built through Phases 0-12 is one modular monolith, not a set of independent applications.

```text
Browser / installed PWA
        |
Next.js pages, layouts, server actions and route handlers
        |
Authentication -> permission -> organization scope -> ownership
        |
Domain queries/services and transactional mutations
        |
Prisma Client -> PostgreSQL
        |
Email / WhatsApp / AI / storage adapters where configured
```

## Identity

- `User` is the sole authenticated identity.
- Passwords and PINs are bcrypt hashes. Opaque random session tokens are stored only as SHA-256 hashes in `Session`.
- The `skillcity_session` cookie is HTTP-only, `SameSite=Lax`, path-wide, expiring after 30 days, and secure in production.
- Logout, password reset, account status changes and access reset revoke sessions.
- `Employee` is a one-to-one personnel profile, not a second identity.
- Email/password, WhatsApp/PIN and admin PIN are entry methods into the same `User` and `Session` system.

## Organization And Authorization

- `Institution`, `Division`, `District`, `Campus` and `Department` are the central hierarchy.
- `EmployeeOrganizationAssignment` provides effective-dated additional placement; `UserAccessScope` provides explicit access grants.
- `Role`, `Permission`, `RolePermission` and `UserRole` are authoritative. Legacy role grants are retained as a compatibility fallback when a role has no persisted permissions.
- Sensitive services combine a permission check with scoped Prisma predicates and resource assertions. `OWN` access is based on the authenticated user or assigned resource.
- UI hiding is convenience only. Server actions and API handlers re-check authorization.

## Domain Architecture

| Domain | Authoritative records | Main service boundary |
|---|---|---|
| Identity / HR | `User`, `Employee`, `Designation`, assignments | `server/auth`, `server/employees` |
| CRM / Admissions | `Lead`, `AdmissionApplication`, `StudentEnrollment`, `FeeInvoice` | `server/crm`, `server/admissions`, admissions actions |
| Startup School / ALTT | `Program`, `Journey`, `Batch`, `Activity`, progress/submission/assessment records | `server/academic`, `server/altt`, `server/trainer` |
| Academic Advisors | `AcademicAdvisorAssignment` | `server/advisor` |
| Labs | `LabsProduct`, `LabsProductAssignment` | `server/labs` |
| Skill Studio | shared `Program`/`Batch` with `operatingDomain` | `server/skill-studio` |
| Career Hub | `CareerTalentProfile`, `CareerEmployer`, `CareerOpportunity`, applications/referrals | `server/career-hub` |
| Documents / Compliance | `CoreDocument` and versions, `ComplianceRecord` | `server/core-operations` |
| Finance | `FeeInvoice`, `PaymentTransaction`, `CommissionRecord` | core-operations and admissions finance actions |
| Communications | `DomainEvent`, templates, `CommunicationMessage`, `Notification` | `server/communications` |
| Automation | `AutomationRule`, `AutomationExecution` | `server/communications/automation` |
| AI | assistants, conversations, usage and proposals | `server/ai` |
| Analytics | live scoped aggregates over domain tables | `server/analytics` |

Older `AuditLog`, `DirectorActivityLog`, `CommunicationLog`, `WhatsAppMessageLog`, `StudentDocument` and recruitment `CareerApplication` records remain for live compatibility. New platform work should use `PlatformAudit`, `CommunicationMessage`, `CoreDocument` and Career Hub models where their scope applies. These records must not be merged without a data reconciliation plan.

## Database Architecture

- PostgreSQL is the sole transactional store; Prisma schema currently contains 146 models and 117 enums.
- The 27 migration directories are ordered and statically additive except an intentional legacy unique-index removal in `20260831000300_harden_career_rm_integrity`.
- Unique keys protect sessions, role assignments, enrollment identity, event/message idempotency and many domain codes.
- High-value mutations commonly use Prisma transactions; finance verification and document versioning use serializable isolation.
- Cascade deletes are extensive. Business workflows should continue using status/archive/soft-delete paths; administrative SQL deletion requires impact review.

## Communications And Automation

Domain events form the durable outbox boundary. Event and communication idempotency keys prevent normal duplicate processing. Automation is constrained to registered actions and currently supports internal notifications. Retry and dead-letter state exist, but no continuously running worker or provider webhook endpoint is deployed by this repository.

## AI And Analytics

- AI providers are behind a provider-neutral adapter. Tool codes are allowlisted and schema validated.
- Read tools re-enter scoped services. Write tools create proposals only; approval records a human decision and does not execute a business mutation.
- Analytics queries authoritative tables directly with the actor's permission and organization filters. Currency totals remain separated and exports are private/no-store and audited.

## Mobile / PWA

The responsive web application is the mobile experience. The service worker caches only public shell/static assets, bypasses `/api`, and uses network-only navigation with an offline fallback. It does not cache authenticated page responses or mutations. Native clients are deferred until versioned APIs and short-lived client credentials exist.

## Deployment And Security

- GitHub Actions runs `npm ci`, Prisma generation/validation, lint, typecheck, tests and build on pull requests and `main`.
- Railway uses Nixpacks, `npm run build`, then `npm run start`. Production migrations are deliberately separate and manual.
- Headers currently include frame denial, MIME sniff prevention, referrer policy and restrictive device permissions. CSP and HSTS verification remain launch work.
- No raw SQL, unsafe Prisma query API, command execution or `dangerouslySetInnerHTML` was found in the reviewed application paths.
- Secure storage/download delivery, distributed rate limiting, provider webhooks, production observability and backup/restore evidence are not complete.

## Testing Architecture

Vitest provides 267 unit/service characterization tests across 42 files. CI performs static and production-build checks. Database-backed integration, authenticated browser, provider sandbox, accessibility, load and real-device/PWA installation tests remain external launch gates.

## Architectural Decision

The Phase 0-12 architecture is coherent and should be retained. Production work should harden operational boundaries and validate real data rather than create another identity, organization, admissions, academic, communication, AI or analytics system.

# Phase 11 Executive Intelligence Architecture

## Purpose

Executive Intelligence is a read-only reporting layer over authoritative AIRA Core domains. It does not create a second operational source of truth, infer unsupported business outcomes, or grant access beyond Phase 1 permissions and organization scope.

## Audited Starting Point

The repository already contained executive, director, admissions, trainer, employee, finance, academic-health, Career Hub, Labs, communications, and AI governance views. Most domain views read their operational models directly. The old executive summary also contained three unsafe analytics shortcuts: a fixed retention value, an always-healthy system score, and finance totals that did not preserve currency boundaries. Director analytics duplicated part of the same surface.

Phase 11 keeps the domain dashboards and consolidates the executive overview behind one service. The unsupported health and retention values were removed, director analytics now routes to the consolidated view, and executive finance is currency-separated.

## Request Flow

`executive route -> executive.access -> effective scope -> scoped Prisma aggregates -> metric semantics -> dashboard or aggregate CSV`

`server/analytics/queries.ts` is the authoritative executive aggregate service. It uses existing scope builders for each domain and returns aggregate values only. It does not return cross-scope record details or personal data.

## Authorization And Scope

Phase 11 reuses `executive.access`; no competing analytics permission was introduced. The existing resolver supports `GLOBAL`, `ORGANIZATION`, `DIVISION`, `DISTRICT`, `BRANCH`, `DEPARTMENT`, and effective employee assignments. Each domain query receives its established scope filter. Crafted routes and export requests therefore pass through the same server-side authorization and scoped query service as the visible dashboard.

The executive dashboard can link to an existing domain page, but the destination still enforces its own authorization. A link never expands the actor's access.

## Time Model

Supported periods are `TODAY`, `THIS_WEEK`, `THIS_MONTH`, `THIS_QUARTER`, and `THIS_YEAR`. Unknown inputs fall back to `THIS_MONTH`. Calendar boundaries use `ANALYTICS_TIME_ZONE`, defaulting to `Asia/Kolkata`, and are converted to UTC instants for database queries. Weeks start Monday.

Trend metrics compare the elapsed portion of the selected period with the same elapsed duration in the previous calendar period. When the previous value is zero, no percentage trend is reported.

## Domain Sources

- Admissions: `Lead`, `AdmissionApplication`, `CounsellingSession`, `StudentEnrollment`
- Startup School and Skill Studio: `Program`, `Batch`, `StudentEnrollment`, `TrainerAssignment`, `AcademicAdvisorAssignment`
- Labs: `LabsProduct`, `LabsProductAssignment`
- Career Hub: `CareerTalentProfile`, `CareerOpportunity`, `CareerOpportunityApplication`, `CareerReferral`, `CareerEmployer`
- People: `Employee`, `EmployeeOrganizationAssignment`
- Finance: `FeeInvoice`, `PaymentTransaction`
- Documents and compliance: `CoreDocument`, `ComplianceRecord`
- Communications and automation: `CommunicationMessage`, `AutomationExecution`, `DomainEvent`
- AI governance: `AIUsageLog`, `AIAssistant`, `AIActionProposal`, `PlatformAudit`
- Organization: `Institution`, `Division`, `District`, `Campus`, `Department`

## Finance Safety

Money is never summed across currencies. Invoice creation totals, current outstanding amounts for invoices created in the period, and successful payments made in the period are grouped by invoice currency. A headline amount is shown only when exactly one non-null currency is represented. Missing or mixed currencies produce an explicit unavailable headline and remain separate in the detail table and export.

Payments use `paidAt`; invoices use `createdAt`. The currency set comes from all authorized invoices so a payment against an older invoice remains visible in the selected payment period.

## Attention Items

Attention counts are direct operational facts: overdue invoices, compliance expiring within 30 days, failed communications, failed automations, and pending AI proposals. Phase 11 does not calculate speculative risk, performance, health, forecasts, or recommendations.

## Export And Audit

`/api/executive/analytics/export` exports only the scoped aggregate payload used by the dashboard. It includes no employee, student, lead, or customer rows. Every successful export creates an `EXECUTIVE_ANALYTICS_EXPORTED` `PlatformAudit` record and is returned with `private, no-store` caching headers.

## Performance And Caching

The service uses bounded `count`, `aggregate`, and `groupBy` queries in parallel and does not hydrate record collections. Payment aggregation runs once per represented currency, a bounded business classification. No cache or materialized view was added: the response is permission- and assignment-sensitive, and a shared cache would require additional isolation and invalidation controls. This can be revisited only with measured production query evidence.

## AI Boundary

AI usage is reported only from measured logs and audited tool executions. No AI-generated KPI, prediction, anomaly, recommendation, or narrative is used as an authoritative metric. Future narrative explanations must cite the metric code, period, scope, and source result they explain.

## Deferred

- Predictive analytics, forecasting, anomaly detection, and executive recommendations
- Custom report builders and arbitrary query interfaces
- Data warehouse, OLAP, materialized views, and BI integrations
- Row-level executive exports and scheduled report delivery
- Cross-currency conversion and accounting statements
- Benchmarks, targets, and performance scores without approved definitions


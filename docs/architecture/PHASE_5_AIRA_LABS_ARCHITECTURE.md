# Phase 5 AIRA Labs Architecture

## Decision

AIRA Labs is a first-class product governance domain inside AIRA Skill City Core. It reuses central User/Employee identity, organization hierarchy, permissions, effective Employee assignments, resource scoping, and `PlatformAudit`.

The authoritative registry is `LabsProduct`. The authoritative responsibility history is `LabsProductAssignment`. No existing academic, student portfolio, marketplace, provider, or application record is overloaded.

## Existing Inventory

| Existing concept | Meaning | Phase 5 decision |
| --- | --- | --- |
| `Program` and the `aira-labs` program/content | Academic offering and public marketing | Preserve. It is not a governed technology product. |
| `PortfolioProject` | Student career evidence | Preserve. It is not a Labs product or development project. |
| `Activity.PROJECT` and submissions | Academic project work | Preserve inside ALTT. |
| `MarketplaceListing.PROJECT` | Community marketplace asset | Preserve. It does not imply Labs ownership. |
| AI provider/conversation models | Runtime AI infrastructure and usage | Preserve. Providers are not automatically products. |
| Automation/provider settings | Executive configuration | Preserve. No workflow or integration platform is built here. |
| Named external Labs products in the Phase brief | Candidate registry entries | Do not seed or infer status. Onboard through authorized creation after verification. |

## Product Registry

`LabsProduct` stores:

- stable unique `code`, used as the internal URL identifier;
- name and description;
- controlled product type;
- controlled lifecycle;
- central institution/division and optional district/centre/department scope;
- optional technical metadata reserved for verified integration data;
- archive timestamp and creation provenance;
- effective owner/contributor assignments.

Product code is lowercase, URL-safe, unique, and immutable after creation. Display-name changes do not alter integrations or routes.

## Product Types

The focused initial set is:

- `PLATFORM`
- `APPLICATION`
- `AI_PRODUCT`
- `INTERNAL_TOOL`
- `AUTOMATION`
- `SERVICE`

This classifies the governed product without attempting to model every technology implementation.

## Product Lifecycle

The initial lifecycle is:

`IDEA -> PLANNING -> BUILDING -> PILOT -> LIVE -> MAINTENANCE -> ARCHIVED`

Phase 5 controls values but does not impose a speculative transition matrix. Authorized operators may correct lifecycle state, and every state change is audited. `ARCHIVED` records remain readable within scope; no product deletion action exists.

## Ownership And Team

`LabsProductAssignment` links an existing Employee to a product as:

- `OWNER`: authoritative primary owner;
- `CONTRIBUTOR`: additional product responsibility with a descriptive responsibility label.

Assignments include active/inactive status, start/end dates, creator, and timestamps. Product creation atomically creates one owner. Owner replacement atomically ends existing owner records and creates the new owner, retaining history. Primary owners cannot be removed through the contributor end action.

This is a product responsibility layer, not an HR team hierarchy. Developer, design, QA, AI, and other responsibilities use the contributor label until a verified need for controlled disciplines exists.

## Organization Scope

Products require Institution and Division and can optionally narrow to District, Centre, and Department. Product reads use `labsProductScopeWhere` with the existing GLOBAL, ORGANIZATION, DIVISION, DISTRICT, BRANCH, DEPARTMENT, and OWN semantics.

OWN access is derived from an effective `LabsProductAssignment` for the logged-in Employee. Organization-scoped access compares the product's authoritative organization fields. Empty permissions produce an impossible predicate.

Product creation validates the entire hierarchy through `validateOrganizationPathForActor`. Organization scope and product code are immutable through the ordinary editor so crafted submissions cannot move a product across boundaries or change canonical identity.

## Employee Compatibility

Owner and contributor assignment requires:

- authorized access to the Employee;
- active User account;
- employment status `ACTIVE`, `PROBATION`, or `ON_NOTICE`;
- primary or currently effective secondary Employee organization placement that covers the product scope.

Browser-submitted Employee IDs never establish eligibility.

## Permissions

- `labs.read`
- `labs.create`
- `labs.update`
- `labs.manage`
- `labs.assign`

Admin and Director receive global grants. CEO and COO receive global grants. HOD receives organization-scoped read/create/update/assign. `labs.manage` is reserved for broader administrative policy; Phase 5 does not build deletion or advanced governance.

## Server Authorization

Every Labs page requires authentication and `labs.read`. Catalog and detail queries apply the product scope predicate. Every mutation asserts its specific permission and resource scope server-side. Product detail uses the stable code plus scope predicate, and mutations assert product ID plus scope, preventing crafted route/action access.

## Audit

The existing `PlatformAudit` records product creation, updates, lifecycle changes, owner replacement, contributor assignment, and assignment ending. Product creation and owner creation share one serializable transaction. Owner replacement also uses a serializable transaction.

## User Interface

`/labs` provides the scoped product catalog and authorized creation form. `/labs/[code]` provides verified overview, organization, lifecycle, edit, owner replacement, contributor assignment, and assignment history. Existing Admin, Director, and Executive navigation links to this shared section.

No fake metrics, deployment status, release data, finance, or integration state is shown.

## Product Versus Project

A Labs Product is a durable technology/application/platform governed by AIRA Labs. A Project is time-bound work that may create or change a product. Phase 5 implements Product only. Existing student and academic projects keep their current meaning; a future project-management phase may reference `LabsProduct` without renaming those records.

## Migration Strategy

Migration `20260928000200_add_aira_labs_foundation` is additive. It creates enums, registry and assignment tables, constraints, indexes, foreign keys, permissions, and standard role grants. It inserts no product records and changes no historical records. Production migration is not executed automatically.

## Deferred Work

- development projects, tasks, roadmaps, sprints, and issue tracking;
- releases, versions, environments, and deployment records;
- product metrics, analytics, billing, and subscriptions;
- repositories, APIs, integrations, automation execution, and secrets;
- documents and secure artifact storage;
- full product-team discipline and capacity management;
- external product synchronization.

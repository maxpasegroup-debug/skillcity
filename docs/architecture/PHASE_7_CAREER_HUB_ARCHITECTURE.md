# Phase 7: AIRA Career Hub / Nice Jobs Architecture

## Executive Decision

Career Hub owns AIRA's opportunity and work-transition layer. Nice Jobs is the opportunity experience within that domain. Central identity, Employee, Student/Learner, CRM, admissions, learning, organization, authorization, and audit remain authoritative.

Phase 7 adds a minimal production foundation for talent presentation, employer partners, opportunities, opportunity applications, and non-financial referral attribution. It does not add financial settlement, fake listings, matching, or a second CRM.

## Existing Architecture Audited

| Existing concept | Decision |
| --- | --- |
| `User` | Authoritative participant identity for learners, employees, and external Career Participants. |
| `CareerApplication` | Keep as AIRA internal HR recruitment. Never overload for Nice Jobs. |
| `StudentPortfolio`, `PortfolioProject`, `VerifiedSkill` | Reuse as learner evidence through the same User identity. |
| `ResumeProfile` | Reuse as optional participant-owned resume evidence; no new document model. |
| `PlacementProfile`, `PlacementApplication` | Preserve as current student readiness/self-reported tracking. Do not treat as authoritative Nice Jobs applications. |
| `Internship`, `CareerMilestone` | Preserve as downstream success evidence; no automatic conversion. |
| `Referral` | Keep for admissions/lead/program attribution. It is not a Career Hub referral. |
| `CommissionRecord` | Keep in existing admissions/BDM finance context. No Career Hub integration. |
| `Wallet`, `WalletTransaction` | Existing reward wallet is not used as a monetary Nice Jobs ledger. |
| `Institution`/organization hierarchy | Reuse as AIRA operational ownership and scope, not as an external employer substitute. |
| `Employee` | Reuse for responsible opportunity ownership. |
| `PlatformAudit` | Reuse for all important Career Hub mutations. |

## Domain Boundary

`Career Hub = Talent + Employer Partners + Opportunities + Opportunity Applications + Referral Attribution`

Internal recruitment remains under HR. Admissions remains under CRM. Learning evidence remains under academic/success services. Finance owns any future settlement.

## Talent Architecture

`CareerTalentProfile` is one-to-one with User and supports participants who are not Students. It stores only career presentation and preference data:

- headline and professional summary;
- self-described skills;
- experience and education summaries;
- preferred opportunity types and work mode;
- availability, location, and explicit visibility.

Visibility defaults to `APPLICATION_ONLY`. `PRIVATE` and `DISCOVERABLE` are available, but Phase 7 does not expose a talent directory. Existing Student portfolio, verified skills, approved projects, resume profiles, and placement readiness are read by User ID rather than copied.

## Employer Architecture

`CareerEmployer` represents an external opportunity provider/partner. It is not an AIRA `Institution` and does not replace the central organization tree. Institution/Division/District/Centre/Department fields identify the AIRA team responsible for the partnership.

Employer states are `PENDING`, `VERIFIED`, `SUSPENDED`, and `REJECTED`. New employers always start Pending. Verification changes require scoped management permission and produce PlatformAudit history. Private contact fields are restricted to the management view and excluded from participant queries.

## Opportunity Architecture

`CareerOpportunity` provides a stable code, title, public description, controlled type, required skills, work mode, optional location/compensation summary/deadline/capacity, lifecycle, visibility, employer, responsible Employee, and direct AIRA scope.

Supported types are Employment, Freelance, Contract, Internship, Apprenticeship, Project, and Self Employment. Lifecycle is Draft, Open, Paused, Closed, or Archived. Visibility is Internal, Authenticated, or Public.

An opportunity cannot open unless its employer is actually Verified. Opportunity ownership requires an active Employee whose effective organization assignment covers the opportunity. No listing is seeded automatically.

## Application Architecture

`CareerOpportunityApplication` is separate from admissions and internal HR `CareerApplication`. It links one User and one CareerTalentProfile to one CareerOpportunity, with a database unique key preventing duplicate applications.

Application lifecycle is Submitted, Under Review, Shortlisted, Rejected, Withdrawn, or Selected. Controlled transitions prevent terminal records from being silently reopened. Participants can only read and withdraw their own eligible applications. Managers and owners can only review applications inherited through authorized Opportunity scope.

Capacity is rechecked inside a serializable transaction immediately before insertion. The application stores optional referral attribution and a participant cover note. Manager review notes remain private.

## Candidate Privacy

Employer/owner candidate presentation uses an explicit allowlist:

- User display name;
- CareerTalentProfile headline, bio, skills, experience/education summary, location, and availability;
- verified skill name and level.

It excludes email, phone, documents, CRM/lead notes, advisor notes, finance, permissions, private portfolio internals, unrelated applications, and internal academic data. A full Student profile is never exposed automatically.

## Referral Architecture

`CareerReferral` is separate from the admissions `Referral`. It provides a unique NICE code tied to one referrer User and one Opportunity. Repeated generation preserves existing attribution. Application submission validates opportunity, active state, and prevents self-referral.

Referral records create no wallet transaction, coins, commission, payout, or earning. Financial behavior is explicitly deferred.

## CRM and Learning Integration

Career Hub does not create CareerLead or CandidateCRM. It may read the same User identity that CRM or admissions later activated, but owns no Lead state.

Learner evidence remains:

`Enrollment -> learning progress -> approved project/verified skill/resume -> CareerTalentProfile -> OpportunityApplication`

Participation does not require Student status. A `Career Participant` role supports external talent without duplicate identity or forced academic enrollment.

## Permissions

- `career.read`
- `career.profile.manage`
- `career.apply`
- `career.opportunity.manage`
- `career.application.manage`
- `career.referral.manage`

System roles added are Career Hub Manager (organization scope), Career Participant (own scope), and Opportunity Owner (own scope). Students receive participant permissions. Admin/Director and CEO/COO receive global grants. Trainer, Academic Advisor, HR, admissions, and unrelated Employee roles do not automatically receive candidate-management access.

## Organization Scope

Employer and Opportunity management use direct Institution/Division/District/Centre/Department scope. Opportunity owners receive OWN access through `CareerOpportunity.ownerEmployee.userId`. Applications inherit scope through Opportunity and also support applicant OWN access. Visible Open opportunities are intentionally discoverable to authenticated participants across organizational boundaries; mutation and private candidate access remain scoped.

## UI

- `/career`: participant dashboard.
- `/career/opportunities`: authorized opportunity catalog.
- `/career/opportunities/[code]`: safe opportunity detail, application, and referral attribution.
- `/career/profile`: own talent profile and evidence summary.
- `/career/applications`: own applications and withdrawal.
- `/career/referrals`: own referral codes and attribution counts.
- `/career/manage`: scoped employers, verification, opportunity creation/status, and privacy-limited candidate review.

The existing `/careers` routes remain AIRA public HR recruitment and were not changed.

## Audit

PlatformAudit covers profile save, employer creation/verification, opportunity creation/status, application submission/withdrawal/status, and referral creation. Business records and audit entries are written atomically where applicable.

## Engagement and Outcome Decision

Phase 7 does not add speculative Engagement or CareerOutcome tables. `SELECTED` records an application decision, but starting/completing work requires confirmed operational contracts before an authoritative post-selection model is safe. Existing Internship and CareerMilestone records remain untouched and are not silently promoted to verified outcomes.

## Deferred

- Public unauthenticated opportunity delivery for records marked Public.
- Employer self-service accounts and contact authorization.
- Engagement and verified outcome records.
- Shared skills taxonomy and matching.
- Portfolio/document access grants.
- AI matching or career advice.
- Finance ledger, commissions, NICE Coins, payouts, tax, and billing.
- Communications, queues, workflows, analytics, and mobile application.


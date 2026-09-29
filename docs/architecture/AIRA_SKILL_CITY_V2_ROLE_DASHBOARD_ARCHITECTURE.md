# AIRA Skill City V2 Role and Dashboard Architecture

## Decision

Version 2 uses one authenticated `User`, one optional central `Employee`, centralized Roles and Permissions, effective organization scope, and a separate Designation. It extends the existing operating system; it does not create a second identity or dashboard platform.

Authorization is always:

`Role + Permission + Organization Scope + Resource Ownership`

Designation is a job title only. Senior Academic Advisor and Junior Academic Advisor therefore share the `ACADEMIC_ADVISOR` security role while retaining different Designations.

## Leadership

| Role | Primary workspace | Authority |
| --- | --- | --- |
| CEO | Executive Intelligence | Global business visibility, business role governance, and final human approval |
| Director | Director Operations | Global operational management without platform or identity administration |
| Platform Administrator | Platform Administration | Technical identity/access operations without business management authority |

CEO and Platform Administrator are intentionally separate. Director does not receive `admin.access` or `user.manage`.

## Department Heads

The lean V2 structure has six accountable department heads:

- People & Operations Head
- Admissions & Growth Head
- Academic Head
- Finance & Compliance Head
- Technology & Products Head
- Career & Partnerships Head

Each head receives only the relevant permissions and organization-scoped access. The structure can operate centrally or at future district/branch scope without hard-coded geography.

## Execution Roles

- HR & Operations Executive
- Hub Coordinator
- Admission Officer
- Business Development
- Counsellor
- Telecaller
- Academic Advisor
- Trainer
- Mentor
- Finance Executive
- Marketing & Communications Executive
- Product Contributor
- Career Operations
- Student

Legacy roles remain readable for compatibility. They require reviewed normalization rather than silent reassignment.

## Workspace Routing

| Role/capability | Default route |
| --- | --- |
| CEO | `/executive/dashboard` |
| Director | `/director/dashboard` |
| People & Operations | `/employees` |
| Admissions & Growth | `/admissions/dashboard` |
| Academic Head | `/director/dashboard` |
| Academic Advisor | `/advisor/dashboard` |
| Trainer/Mentor | `/trainer/dashboard` |
| Business Development/Relationship Manager | `/bdm/dashboard` |
| Counsellor | `/counsellor` |
| Telecaller | `/telecaller` |
| Hub Coordinator | `/admissions/dashboard` |
| Finance & Compliance | `/finance` |
| Technology & Products | `/labs` |
| Career & Partnerships | `/career/manage` |
| Communications | `/communications` |
| Platform Administrator | `/admin/dashboard` |
| Student | `/dashboard` |

`/workspace` is the authenticated switcher for people with more than one valid workspace. Exact role matches determine the default before overlapping permissions, preventing accidental routing to a secondary area.

## Creation Authority

- People & Operations can create and update Employee records within authorized scope.
- Admissions can create and progress students only through the authoritative admissions and enrollment flow.
- CEO controls assignment of protected leadership and platform roles.
- Platform Administrator may execute ordinary role assignments but cannot appoint CEO, Director, Admin, or Platform Administrator.
- Department heads cannot grant themselves broader scope or platform access.

All checks occur server-side. Browser-submitted role, employee, organization, and resource IDs remain untrusted.

## SIA Boundary

SIA is the V2 executive/operations experience over the existing AIRA AI Core. It does not introduce a parallel AI engine. Existing assistant routes, context builders, audit records, and tool controls remain authoritative.

SIA may:

- read information already visible to the actor;
- summarize and prioritize work;
- draft communications and operating material;
- propose controlled actions.

SIA may not:

- grant roles or organization scope;
- approve its own proposals;
- execute privileged mutations without human approval;
- bypass resource ownership or organization scope;
- make final HR, admissions, finance, academic, or compliance decisions.

The Advisor workspace deliberately does not expose AI until an Advisor-specific AI context and permission are approved.

## Communication

The existing Notifications and Communications modules remain the communication foundation. V2 dashboards link users to notifications and authorized communications. A later phase may add structured management channels; Phase 2 does not create a competing messaging system.

## Deferred

- New real-time chat/channel infrastructure
- SIA autonomous execution
- Advisor-specific AI context
- Dashboard analytics not backed by authoritative records
- Payroll, attendance, leave, and performance workflows
- New schema or organization models

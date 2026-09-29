# Phase 12 Mobile and PWA Architecture

## Principle

Phase 12 provides one responsive web application and one progressive enhancement layer over AIRA Core. Desktop web, mobile web, and installed PWA use the same routes, sessions, permissions, domain services, server actions, and authoritative database. There is no `/mobile` application and no client-side business-rule fork.

## Existing Experience Audit

### Keep

- Next.js App Router and server-rendered domain pages
- Existing desktop sidebars and role-specific route catalogs
- Responsive grids, stacked form breakpoints, cards, shared buttons, and shared inputs
- 48px shared button/input heights and typed telephone, email, numeric, and date controls
- Student task-first dashboard, trainer workspace, Career Hub cards, scoped Employee service, Phase 11 executive analytics, notifications, authentication, and server-side authorization
- Horizontal overflow for genuinely comparative finance/operations tables
- Existing Next Image optimization for large public landing images

### Modify

- Replace duplicated mobile horizontal route strips with one shared header, drawer, and bottom navigation
- Add mobile safe-area spacing so content is not covered by the bottom bar
- Present Employee Directory rows as mobile cards while retaining the desktop table
- Add application-wide loading, recoverable error, connectivity, and offline states
- Add installability metadata and a minimal safe service worker

### Consolidate

Sixteen authenticated shells now consume `MobileAppNavigation`. Each keeps one local role route list; only serializable `href` and `label` values cross into the client component. Notifications and the existing logout server action are available from the common drawer.

### Remove

The duplicated horizontal mobile navigation strips were removed from role shells. No desktop route or domain action was removed.

### Missing Or Deferred

- Real-device testing, install-prompt testing, and authenticated visual QA
- Push provider, subscription storage, and delivery worker
- Enterprise/global search
- Offline learning packages and draft synchronization
- Native mobile client and versioned public API
- Production performance traces and Core Web Vitals

## Responsive Architecture

Desktop sidebars remain available at their existing `lg` or `xl` breakpoints. Below those breakpoints, the shared mobile experience provides:

- compact branded header
- direct notifications access
- drawer with the complete role route list
- four role-priority routes in a fixed bottom bar
- active-route semantics
- existing server-side logout
- 48px controls, keyboard escape, focus containment, and focus return
- safe-area padding for modern phones

The first four routes are selected from the existing role ordering. This preserves each domain's priority without introducing a competing navigation registry.

## Role Experiences

- Student: dashboard, journey, Skill Studio, Career Hub, tasks, learning, community, Tara, and settings use the same student services.
- Trainer: dashboard, batches, today's classes, attendance, assignments, submissions, assessments, learners, and notifications remain scope-protected.
- Executive: the responsive Phase 11 dashboard uses `getExecutiveIntelligence`; no mobile metric calculation exists.
- Director/Admin/Admissions: existing operational routes are surfaced through the shared drawer and prioritized bottom bar.
- BDM/Telecaller/Counsellor/Relationship Manager: compact navigation prioritizes current work and existing lead/counselling services.
- Employee: the scoped directory uses mobile cards and the existing desktop comparison table from one query.
- Career: a responsive shared layout exposes profile, opportunities, applications, and referrals without creating a second Career Hub.
- Academic Advisor: Phase 4A assignments remain authoritative; no unsupported standalone advisor workflow was invented.

## PWA Runtime

`app/manifest.ts` supplies name, short name, stable start URL, root scope, standalone display, AIRA colors, branded icon purposes, categories, and safe shortcuts. Root metadata references the manifest and defines viewport-fit and Apple standalone metadata.

`PwaRuntime` registers `/sw.js` only in production and reports browser offline state. Browser-native installation remains the install mechanism; no custom install prompt is forced.

## Service Worker And Offline Strategy

The service worker has root scope but a deliberately narrow cache policy:

- navigations: network first, public `/offline` fallback only
- APIs: never intercepted or cached
- mutations: never intercepted
- authenticated/personalized pages: never cached
- public icon, Next immutable static assets, and public launch assets: cache first
- old public-shell cache versions: deleted during activation

Online access remains mandatory for identity, authorization, CRM, admissions, finance, employee data, learning state, submissions, AI, communications, analytics, and all mutations. Future offline learning content requires explicit encryption, expiry, conflict, revocation, and sync design.

## Notifications And Deep Links

The existing Phase 9 `/notifications` inbox remains the mobile notification source. Phase 12 creates no push provider or second notification store. Existing internal URLs remain the deep-link contract and continue through normal Next.js route authorization.

Future push messages must reference an allowlisted internal route and resolve identity, permission, scope, and resource ownership after opening. A notification URL never grants access.

## Performance

The shared shell adds one small client navigation component and one connectivity/service-worker component. Domain pages remain server components unless already interactive. No polling, auto-refresh, mobile data preload, duplicate dashboard query, PWA library, or Workbox bundle was added.

Large public source images are already delivered through `next/image`; production Core Web Vitals and real mobile traces are required before further image or bundle optimization.

## Browser Support

The implementation uses standards supported by current Chrome Android, Safari iPhone, Chrome/Edge desktop, and Safari desktop. Service-worker and standalone behavior degrades safely when unsupported. No real-device or installation validation is claimed.


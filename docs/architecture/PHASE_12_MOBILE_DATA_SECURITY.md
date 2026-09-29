# Phase 12 Mobile Data Security

## Identity And Sessions

Mobile web and PWA reuse the existing database-backed session. The browser holds only the opaque `skillcity_session` cookie with `httpOnly`, `sameSite=lax`, production `secure`, root path, and explicit expiry. No mobile identity, mobile session table, bearer token, or client role flag was added.

Logout calls the existing server action, revokes the current database session, deletes the cookie, and redirects. The service worker never stores authenticated HTML, so logout does not leave a private page in the PWA cache.

## Browser Storage Audit

Application code does not use `localStorage`, `sessionStorage`, or IndexedDB for identity, permissions, business records, finance, or personal data. Phase 12 adds none. React Query remains in-memory and receives no persistence adapter.

## Cache Classification

### Safe Public Cache

- `/icon.svg`
- immutable `/_next/static/*` build assets
- public `/launch/*` branding/media
- public `/offline` fallback

### Online Required And Never Service-Worker Cached

- authenticated route documents
- `/api/*` responses and exports
- authentication/session responses
- CRM, admissions, employee, learning, Career, Labs, finance, compliance, document, communication, AI, and analytics data
- all POST/PUT/PATCH/DELETE requests and server actions

### Future Review

Selected learning packages and drafts may become offline-capable only after per-user encryption, expiry, revocation, conflict, and logout-cleanup rules are approved.

## Authorization

Responsive rendering changes presentation only. Existing layouts, pages, APIs, server actions, query services, scope builders, and resource assertions remain the security boundary. Hidden mobile controls and route labels grant no capability. Crafted IDs and direct URLs still require permission, effective scope, and ownership.

## Notifications And Links

The shared mobile shell links to the existing authenticated notification inbox. Future web/native push must use Phase 9 communications, minimal payloads, and allowlisted internal URLs. Opening a link always reauthorizes the target; notification possession is not authorization.

## Service Worker Safety

- installed only in production-capable browsers
- scope explicitly `/`
- no API interception
- no mutation interception
- navigation requests always use network and only fall back to the non-personalized offline page
- cache writes are limited to explicit public asset paths
- response must be successful and same-origin basic before runtime caching
- cache versioning removes stale public-shell caches
- worker script itself is served `no-cache, no-store, must-revalidate`

## Sensitive Display

Phase 12 adds no screenshot capture, background sync, clipboard persistence, device contact access, camera, microphone, or geolocation. Existing `Permissions-Policy` continues to disable camera, microphone, and geolocation. Export authorization remains server-side and exported files are not cached by the worker.

## Production Checklist

- enforce HTTPS and verify secure cookies
- verify service-worker scope and cache storage contents
- verify logout followed by offline navigation exposes no personalized page
- verify account revocation and session expiry on installed PWA
- verify direct URL and crafted-ID denials for each role
- inspect manifest/icon rendering on target browsers
- confirm CDN/proxy does not publicly cache authenticated HTML or APIs
- establish CSP before enabling external push or native deep-link integrations


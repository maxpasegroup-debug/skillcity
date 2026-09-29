# Phase 12 Native App Readiness

## Current Position

No Flutter, React Native, Expo, Android, or iOS application is introduced. The current server actions are optimized for the Next.js web client and must not be treated as an undocumented public native API.

## Required Future Boundary

`native client -> versioned AIRA API -> session/token validation -> centralized authorization -> domain service -> Prisma -> authoritative PostgreSQL data`

A native client must never connect directly to PostgreSQL, Prisma, Railway internals, provider credentials, or server-only actions.

## Authentication Requirements

- Reuse the central `User`, account status, roles, permissions, scopes, Employee relationship, and audit records.
- Define a native-appropriate short-lived access-token and rotating refresh-token flow before implementation.
- Keep web HTTP-only database sessions for web/PWA unless an approved migration deliberately unifies transport.
- Support device/session inventory, revocation, expiry, logout, password reset, student PIN activation, rate limiting, and audit attribution.
- Never persist raw passwords, PINs, provider secrets, or long-lived bearer tokens in ordinary device storage. Use Keychain/Keystore-backed secure storage.

## API Requirements

- Versioned JSON endpoints with stable schemas and consistent errors
- Server-side pagination, search, and filters for lists
- Idempotency keys for retryable mutations
- Existing Zod validation and domain services behind API adapters
- Permission, organization scope, and resource ownership on every request
- Rate limits, request IDs, structured audit, and bounded payload/file sizes
- No Prisma model leakage as the public API contract

## Role Experience Requirements

- Student: own journey, learning, submissions, progress, notifications, and Career Hub
- Trainer: assigned batches, learners, sessions, reviews, and assessments
- Advisor: authoritative assigned students/batches only
- Employee/operator: scoped quick actions and notifications
- Executive: Phase 11 aggregates and authorized drill-down, never separate formulas

Native menus and screens may differ, but the domain service and authorization decision must be shared.

## Deep Links

Define one canonical HTTPS link per supported resource and map it to Universal Links/App Links. After launch, the client must restore or request authentication, then perform server authorization before resolving the target. Unknown or unauthorized identifiers fail without revealing record existence.

## Push Notifications

Extend Phase 9 communications rather than creating a device-only notification system. Required future pieces are device installation records, consent/preferences, APNs/FCM provider adapters, token rotation, invalid-token cleanup, delivery status, allowlisted internal deep links, and auditable send policy.

Push payloads should contain minimal display text and a safe route reference, not sensitive CRM, finance, HR, academic, or document data.

## Files And Media

Future native uploads require authorized signed upload/download flows, MIME and size validation, malware scanning policy, ownership metadata, expiry, and revocation. Database/provider credentials must remain server-only. Offline media needs an explicit retention and encryption policy.

## Offline Requirements

Start read-through online. Any later offline capability must define:

- exact cacheable content types
- encryption at rest
- per-user cache separation
- logout/account-revocation cleanup
- expiry and remote invalidation
- mutation idempotency and conflict resolution
- connectivity/retry UX
- audit attribution after synchronization

Finance, permissions, CRM/admissions decisions, communications, AI, and sensitive employee/document records remain online-required.

## Delivery Prerequisites

- approved native threat model
- API contract and lifecycle/version policy
- secure token/session design
- APNs/FCM and communication-governance design
- privacy and retention policy
- device matrix and accessibility plan
- production observability and incident response
- app-store ownership, signing, review, and release process


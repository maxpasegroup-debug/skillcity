# AIRA Skill City V2 Internal Communications Architecture

## Purpose

V2 Phase 3 provides a simple internal communication layer for leadership, department heads, hub coordinators, managers, trainers, advisors, and employees. It extends the Phase 9 Communications foundation and does not replace provider delivery, CRM history, academic announcements, or personal notifications.

## Model

`InternalChannel` is an organization-scoped container. It supports:

- `TEAM`: active members may post.
- `ANNOUNCEMENT`: only Owners and Moderators may post; members read.

`InternalChannelMember` connects an authenticated User to a channel and records Owner, Moderator, or Member authority, active/inactive state, join time, and last-read time.

`InternalMessage` is an immutable text record authored by the authenticated User. Phase 3 does not support edits, deletion, attachments, reactions, calls, or consumer-style presence.

## Identity

Channel members are selected through active Employee records and their linked Users. No separate communication identity is created. Access requires both an active User and an employment state of `ACTIVE`, `PROBATION`, or `ON_NOTICE`. Channel creation always makes the authenticated creator the Owner.

## Organization Scope

A channel belongs to one Organization and may be narrowed by Division, District, Hub/Centre, and Department. Creation validates the complete hierarchy with the Phase 1 organization service.

Managers can add only active employees who:

- are visible under the manager's `internal-communications.manage` scope; and
- have a compatible primary or effective-dated secondary organization assignment.

Crafted IDs are checked again server-side.

## Authorization

Permissions:

- `internal-communications.read`
- `internal-communications.send`
- `internal-communications.manage`

Department heads and approved operational managers can manage channels within scope. Frontline employees can read/send only when they are active members. Students are not included in the employee channel permission set.

Membership and permission are both required. Announcement publishing additionally requires Owner or Moderator membership.

## Operations

Managers can:

- create scoped channels;
- select initial members;
- add compatible members;
- assign Member/Moderator authority;
- deactivate non-owner memberships;
- archive channels without deleting history.

Members can:

- list their active channels;
- read up to the latest 100 messages;
- post when channel policy permits;
- explicitly mark a channel read.

## Notifications

Each message creates an in-app Notification for every other active member in the same transaction. Notifications link back to the channel. External Email and WhatsApp delivery are not triggered.

## Audit

`PlatformAudit` records channel creation, member addition/deactivation, member-role changes, message sends, and channel archival. Message content is not copied into audit metadata.

## SIA

SIA is not a channel member and has no ambient channel access. It cannot post, add members, moderate, or archive. A human may use an independently authorized assistant workspace to prepare a draft and then choose to post it manually. Future SIA integration requires explicit read context, privacy review, and human approval.

## Performance

Indexes cover organization/archive lookup, channel type, membership by user/status, messages by channel/time, and audit ownership. Directory/detail queries use bounded relation loads; message history is capped at 100 records.

## Deferred

- WebSocket or push-based real-time updates
- Attachments and voice/video
- Threads, reactions, mentions, and search
- External guests and student channels
- Message edit/delete
- Email/WhatsApp mirroring
- SIA channel ingestion or autonomous posting

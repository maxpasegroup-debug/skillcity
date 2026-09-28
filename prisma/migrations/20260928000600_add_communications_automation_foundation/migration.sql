-- Phase 9 adds a durable event outbox, provider-neutral communication ledger,
-- versioned templates, and bounded automation execution without replacing CRM history.
ALTER TYPE "AutomationTriggerType" ADD VALUE IF NOT EXISTS 'EVENT';

CREATE TYPE "DomainEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');
CREATE TYPE "CommunicationDeliveryStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUBMITTED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');
CREATE TYPE "CommunicationPurpose" AS ENUM ('TRANSACTIONAL', 'OPERATIONAL', 'MARKETING');
CREATE TYPE "CommunicationTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

ALTER TABLE "AutomationRule"
  ADD COLUMN "code" VARCHAR(120),
  ADD COLUMN "eventType" VARCHAR(160),
  ADD COLUMN "institutionId" UUID,
  ADD COLUMN "divisionId" UUID,
  ADD COLUMN "districtId" UUID,
  ADD COLUMN "campusId" UUID,
  ADD COLUMN "departmentId" UUID,
  ADD COLUMN "createdById" UUID,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3;

ALTER TABLE "AutomationExecution"
  ADD COLUMN "domainEventId" UUID,
  ADD COLUMN "idempotencyKey" VARCHAR(240),
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "Notification" ADD COLUMN "communicationMessageId" UUID;

CREATE TABLE "DomainEvent" (
  "id" UUID NOT NULL,
  "type" VARCHAR(160) NOT NULL,
  "idempotencyKey" VARCHAR(240) NOT NULL,
  "aggregateType" VARCHAR(120) NOT NULL,
  "aggregateId" VARCHAR(140) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "DomainEventStatus" NOT NULL DEFAULT 'PENDING',
  "institutionId" UUID,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "actorId" UUID,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationTemplate" (
  "id" UUID NOT NULL,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "channel" "CommunicationChannel" NOT NULL,
  "purpose" "CommunicationPurpose" NOT NULL DEFAULT 'OPERATIONAL',
  "status" "CommunicationTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "institutionId" UUID,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationTemplateVersion" (
  "id" UUID NOT NULL,
  "templateId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "subject" VARCHAR(220),
  "body" TEXT NOT NULL,
  "requiredVariables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "providerTemplateId" VARCHAR(180),
  "locale" VARCHAR(20) NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunicationTemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationMessage" (
  "id" UUID NOT NULL,
  "channel" "CommunicationChannel" NOT NULL,
  "purpose" "CommunicationPurpose" NOT NULL DEFAULT 'OPERATIONAL',
  "status" "CommunicationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" VARCHAR(240) NOT NULL,
  "recipientUserId" UUID,
  "recipientAddress" VARCHAR(320),
  "recipientMasked" VARCHAR(320),
  "templateVersionId" UUID,
  "subject" VARCHAR(220),
  "body" TEXT,
  "provider" VARCHAR(100),
  "providerRef" VARCHAR(180),
  "domainEventId" UUID,
  "automationExecutionId" UUID,
  "institutionId" UUID,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "createdById" UUID,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "errorCode" VARCHAR(100),
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationRule_code_key" ON "AutomationRule"("code");
CREATE INDEX "AutomationRule_eventType_active_idx" ON "AutomationRule"("eventType", "active");
CREATE INDEX "AutomationRule_institutionId_active_idx" ON "AutomationRule"("institutionId", "active");
CREATE INDEX "AutomationRule_divisionId_idx" ON "AutomationRule"("divisionId");
CREATE INDEX "AutomationRule_districtId_idx" ON "AutomationRule"("districtId");
CREATE INDEX "AutomationRule_campusId_idx" ON "AutomationRule"("campusId");
CREATE INDEX "AutomationRule_departmentId_idx" ON "AutomationRule"("departmentId");
CREATE UNIQUE INDEX "AutomationExecution_idempotencyKey_key" ON "AutomationExecution"("idempotencyKey");
CREATE INDEX "AutomationExecution_domainEventId_idx" ON "AutomationExecution"("domainEventId");
CREATE INDEX "AutomationExecution_status_nextAttemptAt_idx" ON "AutomationExecution"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "DomainEvent_idempotencyKey_key" ON "DomainEvent"("idempotencyKey");
CREATE INDEX "DomainEvent_status_availableAt_idx" ON "DomainEvent"("status", "availableAt");
CREATE INDEX "DomainEvent_type_createdAt_idx" ON "DomainEvent"("type", "createdAt");
CREATE INDEX "DomainEvent_institutionId_status_idx" ON "DomainEvent"("institutionId", "status");
CREATE INDEX "DomainEvent_divisionId_idx" ON "DomainEvent"("divisionId");
CREATE INDEX "DomainEvent_districtId_idx" ON "DomainEvent"("districtId");
CREATE INDEX "DomainEvent_campusId_idx" ON "DomainEvent"("campusId");
CREATE INDEX "DomainEvent_departmentId_idx" ON "DomainEvent"("departmentId");
CREATE INDEX "DomainEvent_aggregateType_aggregateId_idx" ON "DomainEvent"("aggregateType", "aggregateId");
CREATE UNIQUE INDEX "CommunicationTemplate_institutionId_code_key" ON "CommunicationTemplate"("institutionId", "code");
CREATE INDEX "CommunicationTemplate_channel_status_idx" ON "CommunicationTemplate"("channel", "status");
CREATE INDEX "CommunicationTemplate_institutionId_status_idx" ON "CommunicationTemplate"("institutionId", "status");
CREATE INDEX "CommunicationTemplate_divisionId_idx" ON "CommunicationTemplate"("divisionId");
CREATE INDEX "CommunicationTemplate_districtId_idx" ON "CommunicationTemplate"("districtId");
CREATE INDEX "CommunicationTemplate_campusId_idx" ON "CommunicationTemplate"("campusId");
CREATE INDEX "CommunicationTemplate_departmentId_idx" ON "CommunicationTemplate"("departmentId");
CREATE UNIQUE INDEX "CommunicationTemplateVersion_templateId_version_key" ON "CommunicationTemplateVersion"("templateId", "version");
CREATE INDEX "CommunicationTemplateVersion_templateId_createdAt_idx" ON "CommunicationTemplateVersion"("templateId", "createdAt");
CREATE UNIQUE INDEX "CommunicationMessage_idempotencyKey_key" ON "CommunicationMessage"("idempotencyKey");
CREATE INDEX "CommunicationMessage_status_availableAt_idx" ON "CommunicationMessage"("status", "availableAt");
CREATE INDEX "CommunicationMessage_channel_status_idx" ON "CommunicationMessage"("channel", "status");
CREATE INDEX "CommunicationMessage_recipientUserId_createdAt_idx" ON "CommunicationMessage"("recipientUserId", "createdAt");
CREATE INDEX "CommunicationMessage_provider_providerRef_idx" ON "CommunicationMessage"("provider", "providerRef");
CREATE INDEX "CommunicationMessage_institutionId_status_idx" ON "CommunicationMessage"("institutionId", "status");
CREATE INDEX "CommunicationMessage_divisionId_idx" ON "CommunicationMessage"("divisionId");
CREATE INDEX "CommunicationMessage_districtId_idx" ON "CommunicationMessage"("districtId");
CREATE INDEX "CommunicationMessage_campusId_idx" ON "CommunicationMessage"("campusId");
CREATE INDEX "CommunicationMessage_departmentId_idx" ON "CommunicationMessage"("departmentId");
CREATE INDEX "CommunicationMessage_domainEventId_idx" ON "CommunicationMessage"("domainEventId");
CREATE INDEX "CommunicationMessage_automationExecutionId_idx" ON "CommunicationMessage"("automationExecutionId");
CREATE UNIQUE INDEX "Notification_communicationMessageId_key" ON "Notification"("communicationMessageId");

ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_domainEventId_fkey" FOREIGN KEY ("domainEventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationTemplateVersion" ADD CONSTRAINT "CommunicationTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "CommunicationTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_domainEventId_fkey" FOREIGN KEY ("domainEventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_automationExecutionId_fkey" FOREIGN KEY ("automationExecutionId") REFERENCES "AutomationExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_communicationMessageId_fkey" FOREIGN KEY ("communicationMessageId") REFERENCES "CommunicationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Role" ("id", "name", "key", "system", "description", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Communications Manager', 'COMMUNICATIONS_MANAGER', true, 'Scoped communication operations manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Automation Manager', 'AUTOMATION_MANAGER', true, 'Scoped event automation operations manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "key" = EXCLUDED."key", "system" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'communications.read', 'communications', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'communications.manage', 'communications', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'communications.send', 'communications', 'send', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'communication-templates.manage', 'communication-templates', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'automations.read', 'automations', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'automations.manage', 'automations', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'communications.read', 'GLOBAL'), ('Admin', 'communications.manage', 'GLOBAL'), ('Admin', 'communications.send', 'GLOBAL'), ('Admin', 'communication-templates.manage', 'GLOBAL'), ('Admin', 'automations.read', 'GLOBAL'), ('Admin', 'automations.manage', 'GLOBAL'),
  ('Director', 'communications.read', 'GLOBAL'), ('Director', 'communications.manage', 'GLOBAL'), ('Director', 'communications.send', 'GLOBAL'), ('Director', 'communication-templates.manage', 'GLOBAL'), ('Director', 'automations.read', 'GLOBAL'), ('Director', 'automations.manage', 'GLOBAL'),
  ('CEO', 'communications.read', 'GLOBAL'), ('CEO', 'communications.manage', 'GLOBAL'), ('CEO', 'communications.send', 'GLOBAL'), ('CEO', 'communication-templates.manage', 'GLOBAL'), ('CEO', 'automations.read', 'GLOBAL'), ('CEO', 'automations.manage', 'GLOBAL'),
  ('COO', 'communications.read', 'GLOBAL'), ('COO', 'communications.manage', 'GLOBAL'), ('COO', 'communications.send', 'GLOBAL'), ('COO', 'communication-templates.manage', 'GLOBAL'), ('COO', 'automations.read', 'GLOBAL'), ('COO', 'automations.manage', 'GLOBAL'),
  ('Communications Manager', 'communications.read', 'ORGANIZATION'), ('Communications Manager', 'communications.manage', 'ORGANIZATION'), ('Communications Manager', 'communications.send', 'ORGANIZATION'), ('Communications Manager', 'communication-templates.manage', 'ORGANIZATION'),
  ('Automation Manager', 'communications.read', 'ORGANIZATION'), ('Automation Manager', 'automations.read', 'ORGANIZATION'), ('Automation Manager', 'automations.manage', 'ORGANIZATION')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "AutomationRule" ("id", "code", "name", "description", "triggerType", "eventType", "actionType", "conditions", "actionConfig", "active", "institutionId", "maxAttempts", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'SYS_LEAD_CREATED_' || LEFT(REPLACE(institution."id"::TEXT, '-', ''), 12), 'Lead assignment notification', 'Notify the authoritative lead assignee through the in-app channel.', 'EVENT', 'lead.created', 'SEND_NOTIFICATION', '{}'::JSONB, '{"recipientPayloadKey":"recipientUserId","title":"New lead assigned","message":"A new lead has been assigned to you.","actionUrl":"/admissions/leads"}'::JSONB, true, institution."id", 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Institution" institution
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "AutomationRule" ("id", "code", "name", "description", "triggerType", "eventType", "actionType", "conditions", "actionConfig", "active", "institutionId", "maxAttempts", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'SYS_CAREER_APPLICATION_' || LEFT(REPLACE(institution."id"::TEXT, '-', ''), 12), 'Career application notification', 'Notify the opportunity owner through the in-app channel.', 'EVENT', 'career.application.submitted', 'SEND_NOTIFICATION', '{}'::JSONB, '{"recipientPayloadKey":"recipientUserId","title":"New career application","message":"A new Career Hub application is ready for review.","actionUrl":"/career/manage"}'::JSONB, true, institution."id", 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Institution" institution
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "AutomationRule" ("id", "code", "name", "description", "triggerType", "eventType", "actionType", "conditions", "actionConfig", "active", "institutionId", "maxAttempts", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'SYS_PAYMENT_CONFIRMED_' || LEFT(REPLACE(institution."id"::TEXT, '-', ''), 12), 'Payment confirmation notification', 'Notify the student after authoritative payment verification.', 'EVENT', 'payment.confirmed', 'SEND_NOTIFICATION', '{}'::JSONB, '{"recipientPayloadKey":"recipientUserId","title":"Payment confirmed","message":"Your payment has been verified and confirmed.","actionUrl":"/student"}'::JSONB, true, institution."id", 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Institution" institution
ON CONFLICT ("code") DO NOTHING;

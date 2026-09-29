-- Phase 10 adds governed assistants, traceable AI usage, and human-approved action proposals.
CREATE TYPE "AIAssistantStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AIOutputType" AS ENUM ('TEXT', 'STRUCTURED', 'ACTION_PROPOSAL');
CREATE TYPE "AIActionProposalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "AIAssistant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "status" "AIAssistantStatus" NOT NULL DEFAULT 'ACTIVE',
    "allowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIAssistant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AIConversation" ADD COLUMN "assistantId" UUID;
ALTER TABLE "AIConversation" ADD COLUMN "organizationContext" JSONB;
ALTER TABLE "AIUsageLog" ADD COLUMN "errorCode" VARCHAR(80);
ALTER TABLE "AIUsageLog" ADD COLUMN "assistantId" UUID;
ALTER TABLE "AIUsageLog" ADD COLUMN "requestId" UUID;
ALTER TABLE "AIUsageLog" ADD COLUMN "outputType" "AIOutputType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "AIUsageLog" ADD COLUMN "inputTokens" INTEGER;
ALTER TABLE "AIUsageLog" ADD COLUMN "outputTokens" INTEGER;

CREATE TABLE "AIActionProposal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "assistantId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "conversationId" UUID,
    "toolCode" VARCHAR(120) NOT NULL,
    "input" JSONB NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "organizationContext" JSONB,
    "status" "AIActionProposalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIActionProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIAssistant_code_key" ON "AIAssistant"("code");
CREATE INDEX "AIAssistant_status_name_idx" ON "AIAssistant"("status", "name");
CREATE INDEX "AIConversation_assistantId_updatedAt_idx" ON "AIConversation"("assistantId", "updatedAt");
CREATE UNIQUE INDEX "AIUsageLog_requestId_key" ON "AIUsageLog"("requestId");
CREATE INDEX "AIUsageLog_assistantId_createdAt_idx" ON "AIUsageLog"("assistantId", "createdAt");
CREATE UNIQUE INDEX "AIActionProposal_idempotencyKey_key" ON "AIActionProposal"("idempotencyKey");
CREATE INDEX "AIActionProposal_status_createdAt_idx" ON "AIActionProposal"("status", "createdAt");
CREATE INDEX "AIActionProposal_assistantId_status_idx" ON "AIActionProposal"("assistantId", "status");
CREATE INDEX "AIActionProposal_actorId_createdAt_idx" ON "AIActionProposal"("actorId", "createdAt");

ALTER TABLE "AIAssistant" ADD CONSTRAINT "AIAssistant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIActionProposal" ADD CONSTRAINT "AIActionProposal_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "AIAssistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIActionProposal" ADD CONSTRAINT "AIActionProposal_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIActionProposal" ADD CONSTRAINT "AIActionProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIActionProposal" ADD CONSTRAINT "AIActionProposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AIAssistant" ("id", "code", "name", "description", "status", "allowedTools", "allowedDomains", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'tara', 'Tara', 'AIRA''s governed learning, admissions and operational assistant.', 'ACTIVE', ARRAY['academic.get-own-progress', 'career.get-own-profile', 'crm.get-lead-summary', 'communications.propose-notification'], ARRAY['academic', 'career', 'crm', 'communications'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = 'ACTIVE', "allowedTools" = EXCLUDED."allowedTools", "allowedDomains" = EXCLUDED."allowedDomains", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'ai.use', 'ai', 'use', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'ai.manage', 'ai', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'ai.audit', 'ai', 'audit', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'ai.approve', 'ai', 'approve', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'ai.use', 'GLOBAL'), ('Admin', 'ai.manage', 'GLOBAL'), ('Admin', 'ai.audit', 'GLOBAL'), ('Admin', 'ai.approve', 'GLOBAL'),
  ('Director', 'ai.use', 'GLOBAL'), ('Director', 'ai.manage', 'GLOBAL'), ('Director', 'ai.audit', 'GLOBAL'), ('Director', 'ai.approve', 'GLOBAL'),
  ('CEO', 'ai.use', 'GLOBAL'), ('CEO', 'ai.manage', 'GLOBAL'), ('CEO', 'ai.audit', 'GLOBAL'), ('CEO', 'ai.approve', 'GLOBAL'),
  ('COO', 'ai.use', 'GLOBAL'), ('COO', 'ai.manage', 'GLOBAL'), ('COO', 'ai.audit', 'GLOBAL'), ('COO', 'ai.approve', 'GLOBAL'),
  ('Admission', 'ai.use', 'ORGANIZATION'), ('Business Development', 'ai.use', 'OWN'), ('Relationship Manager', 'ai.use', 'OWN'),
  ('Trainer', 'ai.use', 'OWN'), ('Student', 'ai.use', 'OWN')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

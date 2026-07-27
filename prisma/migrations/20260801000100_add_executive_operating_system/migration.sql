CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'EXITED');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');
CREATE TYPE "AutomationTriggerType" AS ENUM ('STUDENT_ABSENCE', 'TRAINER_PENDING_REVIEWS', 'FEE_OVERDUE', 'CERTIFICATE_ISSUED', 'CHALLENGE_COMPLETED', 'MANUAL');
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_EMAIL', 'SEND_NOTIFICATION', 'AWARD_COINS', 'CREATE_TASK', 'ESCALATE');
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');
CREATE TYPE "ExecutiveReportType" AS ENUM ('INSTITUTION', 'PROGRAM', 'DEPARTMENT', 'FINANCIAL', 'ADMISSIONS', 'TRAINER', 'STUDENT', 'COMMUNITY', 'MARKETPLACE', 'AI_USAGE');
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Program" ADD COLUMN "institutionId" UUID, ADD COLUMN "campusId" UUID, ADD COLUMN "departmentId" UUID;
ALTER TABLE "Batch" ADD COLUMN "campusId" UUID;

CREATE TABLE "Institution" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(180) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "legalName" VARCHAR(220),
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "branding" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campus" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "city" VARCHAR(120),
  "state" VARCHAR(120),
  "address" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID,
  "campusId" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "description" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Employee" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "institutionId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "employeeCode" VARCHAR(80),
  "title" VARCHAR(140),
  "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  "performanceScore" INTEGER NOT NULL DEFAULT 0,
  "leaveBalance" INTEGER NOT NULL DEFAULT 0,
  "payrollMeta" JSONB,
  "joinedAt" TIMESTAMP(3),
  "exitedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationRule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "triggerType" "AutomationTriggerType" NOT NULL,
  "actionType" "AutomationActionType" NOT NULL,
  "conditions" JSONB NOT NULL,
  "actionConfig" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecution" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ruleId" UUID NOT NULL,
  "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecutiveReport" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID,
  "createdById" UUID,
  "type" "ExecutiveReportType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "summary" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "exportMeta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExecutiveReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecutiveInsight" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerId" UUID,
  "category" VARCHAR(120) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "detail" TEXT NOT NULL,
  "severity" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutiveInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSetting" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID,
  "key" VARCHAR(140) NOT NULL,
  "value" JSONB NOT NULL,
  "encrypted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformAudit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorId" UUID,
  "action" VARCHAR(160) NOT NULL,
  "entity" VARCHAR(140),
  "entityId" VARCHAR(140),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationProvider" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(120) NOT NULL, "status" "ProviderStatus" NOT NULL DEFAULT 'INACTIVE', "config" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "NotificationProvider_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ExecutivePaymentProvider" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(120) NOT NULL, "status" "ProviderStatus" NOT NULL DEFAULT 'INACTIVE', "config" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ExecutivePaymentProvider_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StorageProvider" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(120) NOT NULL, "status" "ProviderStatus" NOT NULL DEFAULT 'INACTIVE', "config" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StorageProvider_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");
CREATE UNIQUE INDEX "Campus_institutionId_slug_key" ON "Campus"("institutionId", "slug");
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");
CREATE UNIQUE INDEX "SystemSetting_institutionId_key_key" ON "SystemSetting"("institutionId", "key");
CREATE UNIQUE INDEX "NotificationProvider_name_key" ON "NotificationProvider"("name");
CREATE UNIQUE INDEX "ExecutivePaymentProvider_name_key" ON "ExecutivePaymentProvider"("name");
CREATE UNIQUE INDEX "StorageProvider_name_key" ON "StorageProvider"("name");

CREATE INDEX "Program_institutionId_idx" ON "Program"("institutionId");
CREATE INDEX "Program_campusId_idx" ON "Program"("campusId");
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");
CREATE INDEX "Batch_campusId_idx" ON "Batch"("campusId");
CREATE INDEX "Institution_status_idx" ON "Institution"("status");
CREATE INDEX "Campus_institutionId_status_idx" ON "Campus"("institutionId", "status");
CREATE INDEX "Department_institutionId_idx" ON "Department"("institutionId");
CREATE INDEX "Department_campusId_idx" ON "Department"("campusId");
CREATE INDEX "Employee_institutionId_status_idx" ON "Employee"("institutionId", "status");
CREATE INDEX "AutomationRule_triggerType_active_idx" ON "AutomationRule"("triggerType", "active");
CREATE INDEX "AutomationExecution_ruleId_executedAt_idx" ON "AutomationExecution"("ruleId", "executedAt");
CREATE INDEX "ExecutiveReport_institutionId_type_idx" ON "ExecutiveReport"("institutionId", "type");
CREATE INDEX "ExecutiveInsight_category_severity_idx" ON "ExecutiveInsight"("category", "severity");
CREATE INDEX "PlatformAudit_action_idx" ON "PlatformAudit"("action");

ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutiveReport" ADD CONSTRAINT "ExecutiveReport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutiveReport" ADD CONSTRAINT "ExecutiveReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutiveInsight" ADD CONSTRAINT "ExecutiveInsight_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformAudit" ADD CONSTRAINT "PlatformAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

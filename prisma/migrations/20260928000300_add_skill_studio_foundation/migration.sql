-- Phase 6 classifies Skill Studio programs without replacing the central academic models.
CREATE TYPE "ProgramOperatingDomain" AS ENUM ('STARTUP_SCHOOL', 'SKILL_STUDIO', 'GENERAL');
CREATE TYPE "SkillStudioProgramType" AS ENUM ('COURSE', 'WORKSHOP', 'BOOTCAMP', 'MASTERCLASS', 'PROFESSIONAL_PROGRAM', 'CORPORATE_TRAINING');
CREATE TYPE "ProgramDeliveryMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');
CREATE TYPE "ProgramLearningModel" AS ENUM ('STANDARD', 'ALTT');

ALTER TABLE "Program"
  ADD COLUMN "operatingDomain" "ProgramOperatingDomain",
  ADD COLUMN "skillStudioType" "SkillStudioProgramType",
  ADD COLUMN "deliveryMode" "ProgramDeliveryMode",
  ADD COLUMN "learningModel" "ProgramLearningModel";

ALTER TABLE "Batch" ADD COLUMN "deliveryMode" "ProgramDeliveryMode";

CREATE INDEX "Program_operatingDomain_status_idx" ON "Program"("operatingDomain", "status");
CREATE INDEX "Program_skillStudioType_deliveryMode_idx" ON "Program"("skillStudioType", "deliveryMode");
CREATE INDEX "Batch_deliveryMode_idx" ON "Batch"("deliveryMode");

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'skill-studio.read', 'skill-studio', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'skill-studio.create', 'skill-studio', 'create', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'skill-studio.update', 'skill-studio', 'update', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'skill-studio.manage', 'skill-studio', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'skill-studio.enroll', 'skill-studio', 'enroll', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'skill-studio.assign', 'skill-studio', 'assign', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'skill-studio.read', 'GLOBAL'), ('Admin', 'skill-studio.create', 'GLOBAL'), ('Admin', 'skill-studio.update', 'GLOBAL'), ('Admin', 'skill-studio.manage', 'GLOBAL'), ('Admin', 'skill-studio.enroll', 'GLOBAL'), ('Admin', 'skill-studio.assign', 'GLOBAL'),
  ('Director', 'skill-studio.read', 'GLOBAL'), ('Director', 'skill-studio.create', 'GLOBAL'), ('Director', 'skill-studio.update', 'GLOBAL'), ('Director', 'skill-studio.manage', 'GLOBAL'), ('Director', 'skill-studio.enroll', 'GLOBAL'), ('Director', 'skill-studio.assign', 'GLOBAL'),
  ('CEO', 'skill-studio.read', 'GLOBAL'), ('CEO', 'skill-studio.create', 'GLOBAL'), ('CEO', 'skill-studio.update', 'GLOBAL'), ('CEO', 'skill-studio.manage', 'GLOBAL'), ('CEO', 'skill-studio.enroll', 'GLOBAL'), ('CEO', 'skill-studio.assign', 'GLOBAL'),
  ('COO', 'skill-studio.read', 'GLOBAL'), ('COO', 'skill-studio.create', 'GLOBAL'), ('COO', 'skill-studio.update', 'GLOBAL'), ('COO', 'skill-studio.manage', 'GLOBAL'), ('COO', 'skill-studio.enroll', 'GLOBAL'), ('COO', 'skill-studio.assign', 'GLOBAL'),
  ('HOD', 'skill-studio.read', 'ORGANIZATION'), ('HOD', 'skill-studio.create', 'ORGANIZATION'), ('HOD', 'skill-studio.update', 'ORGANIZATION'), ('HOD', 'skill-studio.enroll', 'ORGANIZATION'), ('HOD', 'skill-studio.assign', 'ORGANIZATION'),
  ('Trainer', 'skill-studio.read', 'OWN'),
  ('Student', 'skill-studio.read', 'OWN')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

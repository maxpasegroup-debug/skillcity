-- Phase 4A adds one Employee-backed academic advisor assignment record.
CREATE TYPE "AcademicAdvisorAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "AcademicAdvisorAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "advisorId" UUID NOT NULL,
    "studentId" UUID,
    "batchId" UUID,
    "status" "AcademicAdvisorAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicAdvisorAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademicAdvisorAssignment_one_target_check" CHECK (
      (("studentId" IS NOT NULL)::integer + ("batchId" IS NOT NULL)::integer) = 1
    ),
    CONSTRAINT "AcademicAdvisorAssignment_date_order_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt")
);

CREATE INDEX "AcademicAdvisorAssignment_advisorId_status_startsAt_endsAt_idx" ON "AcademicAdvisorAssignment"("advisorId", "status", "startsAt", "endsAt");
CREATE INDEX "AcademicAdvisorAssignment_studentId_status_startsAt_endsAt_idx" ON "AcademicAdvisorAssignment"("studentId", "status", "startsAt", "endsAt");
CREATE INDEX "AcademicAdvisorAssignment_batchId_status_startsAt_endsAt_idx" ON "AcademicAdvisorAssignment"("batchId", "status", "startsAt", "endsAt");
CREATE INDEX "AcademicAdvisorAssignment_createdById_idx" ON "AcademicAdvisorAssignment"("createdById");

ALTER TABLE "AcademicAdvisorAssignment" ADD CONSTRAINT "AcademicAdvisorAssignment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicAdvisorAssignment" ADD CONSTRAINT "AcademicAdvisorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicAdvisorAssignment" ADD CONSTRAINT "AcademicAdvisorAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicAdvisorAssignment" ADD CONSTRAINT "AcademicAdvisorAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Permission and role records are additive and idempotent for databases already seeded.
INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'advisor.read', 'advisor', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'advisor.assign', 'advisor', 'assign', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'advisor.manage', 'advisor', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Role" ("id", "name", "key", "system", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Academic Advisor', 'ACADEMIC_ADVISOR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "key" = 'ACADEMIC_ADVISOR', "system" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'advisor.read', 'GLOBAL'),
  ('Admin', 'advisor.assign', 'GLOBAL'),
  ('Admin', 'advisor.manage', 'GLOBAL'),
  ('Director', 'advisor.read', 'GLOBAL'),
  ('Director', 'advisor.assign', 'GLOBAL'),
  ('Director', 'advisor.manage', 'GLOBAL'),
  ('Academic Advisor', 'advisor.read', 'OWN')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

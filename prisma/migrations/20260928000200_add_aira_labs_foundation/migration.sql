-- Phase 5 adds an authoritative AIRA Labs product registry and Employee responsibility history.
CREATE TYPE "LabsProductType" AS ENUM ('PLATFORM', 'APPLICATION', 'AI_PRODUCT', 'INTERNAL_TOOL', 'AUTOMATION', 'SERVICE');
CREATE TYPE "LabsProductLifecycle" AS ENUM ('IDEA', 'PLANNING', 'BUILDING', 'PILOT', 'LIVE', 'MAINTENANCE', 'ARCHIVED');
CREATE TYPE "LabsProductAssignmentRole" AS ENUM ('OWNER', 'CONTRIBUTOR');
CREATE TYPE "LabsProductAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "LabsProduct" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institutionId" UUID NOT NULL,
    "divisionId" UUID NOT NULL,
    "districtId" UUID,
    "campusId" UUID,
    "departmentId" UUID,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "LabsProductType" NOT NULL,
    "lifecycle" "LabsProductLifecycle" NOT NULL DEFAULT 'IDEA',
    "technicalMetadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LabsProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabsProductAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "role" "LabsProductAssignmentRole" NOT NULL,
    "responsibility" VARCHAR(140),
    "status" "LabsProductAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LabsProductAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabsProductAssignment_date_order_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "LabsProduct_code_key" ON "LabsProduct"("code");
CREATE INDEX "LabsProduct_institutionId_lifecycle_idx" ON "LabsProduct"("institutionId", "lifecycle");
CREATE INDEX "LabsProduct_divisionId_lifecycle_idx" ON "LabsProduct"("divisionId", "lifecycle");
CREATE INDEX "LabsProduct_districtId_idx" ON "LabsProduct"("districtId");
CREATE INDEX "LabsProduct_campusId_idx" ON "LabsProduct"("campusId");
CREATE INDEX "LabsProduct_departmentId_idx" ON "LabsProduct"("departmentId");
CREATE INDEX "LabsProduct_type_lifecycle_idx" ON "LabsProduct"("type", "lifecycle");
CREATE INDEX "LabsProductAssignment_productId_role_status_startsAt_endsAt_idx" ON "LabsProductAssignment"("productId", "role", "status", "startsAt", "endsAt");
CREATE INDEX "LabsProductAssignment_employeeId_status_startsAt_endsAt_idx" ON "LabsProductAssignment"("employeeId", "status", "startsAt", "endsAt");
CREATE INDEX "LabsProductAssignment_createdById_idx" ON "LabsProductAssignment"("createdById");

ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProduct" ADD CONSTRAINT "LabsProduct_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabsProductAssignment" ADD CONSTRAINT "LabsProductAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LabsProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProductAssignment" ADD CONSTRAINT "LabsProductAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabsProductAssignment" ADD CONSTRAINT "LabsProductAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'labs.read', 'labs', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'labs.create', 'labs', 'create', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'labs.update', 'labs', 'update', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'labs.manage', 'labs', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'labs.assign', 'labs', 'assign', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'labs.read', 'GLOBAL'), ('Admin', 'labs.create', 'GLOBAL'), ('Admin', 'labs.update', 'GLOBAL'), ('Admin', 'labs.manage', 'GLOBAL'), ('Admin', 'labs.assign', 'GLOBAL'),
  ('Director', 'labs.read', 'GLOBAL'), ('Director', 'labs.create', 'GLOBAL'), ('Director', 'labs.update', 'GLOBAL'), ('Director', 'labs.manage', 'GLOBAL'), ('Director', 'labs.assign', 'GLOBAL'),
  ('CEO', 'labs.read', 'GLOBAL'), ('CEO', 'labs.create', 'GLOBAL'), ('CEO', 'labs.update', 'GLOBAL'), ('CEO', 'labs.manage', 'GLOBAL'), ('CEO', 'labs.assign', 'GLOBAL'),
  ('COO', 'labs.read', 'GLOBAL'), ('COO', 'labs.create', 'GLOBAL'), ('COO', 'labs.update', 'GLOBAL'), ('COO', 'labs.manage', 'GLOBAL'), ('COO', 'labs.assign', 'GLOBAL'),
  ('HOD', 'labs.read', 'ORGANIZATION'), ('HOD', 'labs.create', 'ORGANIZATION'), ('HOD', 'labs.update', 'ORGANIZATION'), ('HOD', 'labs.assign', 'ORGANIZATION')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

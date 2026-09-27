CREATE TYPE "OrganizationUnitType" AS ENUM ('BRANCH', 'CENTRE', 'CAMPUS', 'CORPORATE_OFFICE');
CREATE TYPE "AccessScopeType" AS ENUM ('GLOBAL', 'ORGANIZATION', 'DIVISION', 'DISTRICT', 'BRANCH', 'DEPARTMENT', 'OWN');

ALTER TABLE "Role"
  ADD COLUMN "key" VARCHAR(100),
  ADD COLUMN "system" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

CREATE TABLE "Division" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "code" VARCHAR(80),
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "District" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "stateName" VARCHAR(160) NOT NULL,
  "stateCode" VARCHAR(40),
  "countryCode" VARCHAR(2) NOT NULL DEFAULT 'IN',
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Campus"
  ADD COLUMN "districtId" UUID,
  ADD COLUMN "type" "OrganizationUnitType" NOT NULL DEFAULT 'CAMPUS';

ALTER TABLE "Department" ADD COLUMN "divisionId" UUID;
ALTER TABLE "Employee" ADD COLUMN "divisionId" UUID, ADD COLUMN "districtId" UUID;
ALTER TABLE "Program" ADD COLUMN "divisionId" UUID;
ALTER TABLE "Lead"
  ADD COLUMN "institutionId" UUID,
  ADD COLUMN "divisionId" UUID,
  ADD COLUMN "districtId" UUID,
  ADD COLUMN "campusId" UUID;

ALTER TABLE "CareerApplication"
  ADD COLUMN "institutionId" UUID,
  ADD COLUMN "divisionId" UUID,
  ADD COLUMN "districtScopeId" UUID,
  ADD COLUMN "campusId" UUID;

CREATE TABLE "Permission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(160) NOT NULL,
  "resource" VARCHAR(100) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "description" VARCHAR(240),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "roleId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  "scope" "AccessScopeType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAccessScope" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "scope" "AccessScopeType" NOT NULL,
  "institutionId" UUID,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserAccessScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Division_institutionId_slug_key" ON "Division"("institutionId", "slug");
CREATE UNIQUE INDEX "Division_institutionId_code_key" ON "Division"("institutionId", "code");
CREATE INDEX "Division_institutionId_status_idx" ON "Division"("institutionId", "status");
CREATE UNIQUE INDEX "District_institutionId_stateName_slug_key" ON "District"("institutionId", "stateName", "slug");
CREATE INDEX "District_institutionId_status_idx" ON "District"("institutionId", "status");
CREATE INDEX "District_countryCode_stateCode_idx" ON "District"("countryCode", "stateCode");
CREATE INDEX "Campus_districtId_idx" ON "Campus"("districtId");
CREATE INDEX "Department_divisionId_idx" ON "Department"("divisionId");
CREATE INDEX "Employee_divisionId_idx" ON "Employee"("divisionId");
CREATE INDEX "Employee_districtId_idx" ON "Employee"("districtId");
CREATE INDEX "Program_divisionId_idx" ON "Program"("divisionId");
CREATE INDEX "Lead_institutionId_idx" ON "Lead"("institutionId");
CREATE INDEX "Lead_divisionId_idx" ON "Lead"("divisionId");
CREATE INDEX "Lead_districtId_idx" ON "Lead"("districtId");
CREATE INDEX "Lead_campusId_idx" ON "Lead"("campusId");
CREATE INDEX "CareerApplication_institutionId_idx" ON "CareerApplication"("institutionId");
CREATE INDEX "CareerApplication_divisionId_idx" ON "CareerApplication"("divisionId");
CREATE INDEX "CareerApplication_districtScopeId_idx" ON "CareerApplication"("districtScopeId");
CREATE INDEX "CareerApplication_campusId_idx" ON "CareerApplication"("campusId");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");
CREATE INDEX "Permission_active_idx" ON "Permission"("active");
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "UserAccessScope_userId_scope_idx" ON "UserAccessScope"("userId", "scope");
CREATE INDEX "UserAccessScope_institutionId_idx" ON "UserAccessScope"("institutionId");
CREATE INDEX "UserAccessScope_divisionId_idx" ON "UserAccessScope"("divisionId");
CREATE INDEX "UserAccessScope_districtId_idx" ON "UserAccessScope"("districtId");
CREATE INDEX "UserAccessScope_campusId_idx" ON "UserAccessScope"("campusId");
CREATE INDEX "UserAccessScope_departmentId_idx" ON "UserAccessScope"("departmentId");
CREATE INDEX "UserAccessScope_expiresAt_idx" ON "UserAccessScope"("expiresAt");

ALTER TABLE "Division" ADD CONSTRAINT "Division_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "District" ADD CONSTRAINT "District_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_districtScopeId_fkey" FOREIGN KEY ("districtScopeId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAccessScope" ADD CONSTRAINT "UserAccessScope_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

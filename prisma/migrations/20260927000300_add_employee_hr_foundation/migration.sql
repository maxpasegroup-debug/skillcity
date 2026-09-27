-- Phase 2 is additive. Legacy title/designation text remains available for normalization.
ALTER TYPE "EmployeeStatus" ADD VALUE IF NOT EXISTS 'PROBATION';
ALTER TYPE "EmployeeStatus" ADD VALUE IF NOT EXISTS 'ON_NOTICE';
ALTER TYPE "EmployeeStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';

CREATE TABLE "Designation" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(240),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Employee" ADD COLUMN "designationId" UUID;
ALTER TABLE "EmployeeOrganizationAssignment" ADD COLUMN "designationId" UUID;

CREATE UNIQUE INDEX "Designation_key_key" ON "Designation"("key");
CREATE UNIQUE INDEX "Designation_name_key" ON "Designation"("name");
CREATE INDEX "Designation_active_name_idx" ON "Designation"("active", "name");
CREATE INDEX "Employee_designationId_idx" ON "Employee"("designationId");
CREATE INDEX "EmployeeOrganizationAssignment_designationId_idx" ON "EmployeeOrganizationAssignment"("designationId");

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

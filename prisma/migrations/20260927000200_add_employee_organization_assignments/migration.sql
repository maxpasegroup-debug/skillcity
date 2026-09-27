ALTER TABLE "Employee" ADD COLUMN "managerId" UUID;

CREATE TABLE "EmployeeOrganizationAssignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employeeId" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "designation" VARCHAR(140),
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeOrganizationAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");
CREATE INDEX "EmployeeOrganizationAssignment_employeeId_endsAt_idx" ON "EmployeeOrganizationAssignment"("employeeId", "endsAt");
CREATE INDEX "EmployeeOrganizationAssignment_institutionId_idx" ON "EmployeeOrganizationAssignment"("institutionId");
CREATE INDEX "EmployeeOrganizationAssignment_divisionId_idx" ON "EmployeeOrganizationAssignment"("divisionId");
CREATE INDEX "EmployeeOrganizationAssignment_districtId_idx" ON "EmployeeOrganizationAssignment"("districtId");
CREATE INDEX "EmployeeOrganizationAssignment_campusId_idx" ON "EmployeeOrganizationAssignment"("campusId");
CREATE INDEX "EmployeeOrganizationAssignment_departmentId_idx" ON "EmployeeOrganizationAssignment"("departmentId");

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeOrganizationAssignment" ADD CONSTRAINT "EmployeeOrganizationAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

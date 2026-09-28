-- Phase 7 adds the Career Hub opportunity layer without changing HR recruitment, CRM, learning, or finance records.
CREATE TYPE "CareerProfileVisibility" AS ENUM ('PRIVATE', 'APPLICATION_ONLY', 'DISCOVERABLE');
CREATE TYPE "CareerAvailability" AS ENUM ('AVAILABLE', 'OPEN_TO_OPPORTUNITIES', 'NOT_AVAILABLE');
CREATE TYPE "CareerEmployerStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "CareerOpportunityType" AS ENUM ('EMPLOYMENT', 'FREELANCE', 'CONTRACT', 'INTERNSHIP', 'APPRENTICESHIP', 'PROJECT', 'SELF_EMPLOYMENT');
CREATE TYPE "CareerWorkMode" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID', 'FLEXIBLE');
CREATE TYPE "CareerOpportunityStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "CareerOpportunityVisibility" AS ENUM ('INTERNAL', 'AUTHENTICATED', 'PUBLIC');
CREATE TYPE "CareerOpportunityApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'SELECTED');
CREATE TYPE "CareerReferralStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "CareerTalentProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "headline" VARCHAR(180),
  "bio" TEXT,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "experienceSummary" TEXT,
  "educationSummary" TEXT,
  "preferredOpportunityTypes" "CareerOpportunityType"[] NOT NULL DEFAULT ARRAY[]::"CareerOpportunityType"[],
  "workPreference" "CareerWorkMode",
  "availability" "CareerAvailability" NOT NULL DEFAULT 'OPEN_TO_OPPORTUNITIES',
  "location" VARCHAR(180),
  "visibility" "CareerProfileVisibility" NOT NULL DEFAULT 'APPLICATION_ONLY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerTalentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerEmployer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "publicDescription" TEXT NOT NULL,
  "websiteUrl" VARCHAR(700),
  "industry" VARCHAR(140),
  "contactName" VARCHAR(160),
  "contactEmail" VARCHAR(255),
  "status" "CareerEmployerStatus" NOT NULL DEFAULT 'PENDING',
  "verificationNote" TEXT,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerEmployer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerOpportunity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "employerId" UUID NOT NULL,
  "ownerEmployeeId" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "publicDescription" TEXT NOT NULL,
  "type" "CareerOpportunityType" NOT NULL,
  "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "workMode" "CareerWorkMode" NOT NULL,
  "location" VARCHAR(180),
  "compensationSummary" VARCHAR(180),
  "applicationDeadline" TIMESTAMP(3),
  "capacity" INTEGER,
  "status" "CareerOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
  "visibility" "CareerOpportunityVisibility" NOT NULL DEFAULT 'INTERNAL',
  "archivedAt" TIMESTAMP(3),
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerOpportunity_capacity_check" CHECK ("capacity" IS NULL OR "capacity" > 0)
);

CREATE TABLE "CareerReferral" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "opportunityId" UUID NOT NULL,
  "referrerId" UUID NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "status" "CareerReferralStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerReferral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerOpportunityApplication" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "opportunityId" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "talentProfileId" UUID NOT NULL,
  "referralId" UUID,
  "status" "CareerOpportunityApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "coverNote" TEXT,
  "reviewNote" TEXT,
  "reviewedById" UUID,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerOpportunityApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerTalentProfile_userId_key" ON "CareerTalentProfile"("userId");
CREATE INDEX "CareerTalentProfile_visibility_availability_idx" ON "CareerTalentProfile"("visibility", "availability");
CREATE UNIQUE INDEX "CareerEmployer_code_key" ON "CareerEmployer"("code");
CREATE INDEX "CareerEmployer_institutionId_status_idx" ON "CareerEmployer"("institutionId", "status");
CREATE INDEX "CareerEmployer_divisionId_idx" ON "CareerEmployer"("divisionId");
CREATE INDEX "CareerEmployer_districtId_idx" ON "CareerEmployer"("districtId");
CREATE INDEX "CareerEmployer_campusId_idx" ON "CareerEmployer"("campusId");
CREATE INDEX "CareerEmployer_departmentId_idx" ON "CareerEmployer"("departmentId");
CREATE UNIQUE INDEX "CareerOpportunity_code_key" ON "CareerOpportunity"("code");
CREATE INDEX "CareerOpportunity_institutionId_status_visibility_idx" ON "CareerOpportunity"("institutionId", "status", "visibility");
CREATE INDEX "CareerOpportunity_divisionId_idx" ON "CareerOpportunity"("divisionId");
CREATE INDEX "CareerOpportunity_districtId_idx" ON "CareerOpportunity"("districtId");
CREATE INDEX "CareerOpportunity_campusId_idx" ON "CareerOpportunity"("campusId");
CREATE INDEX "CareerOpportunity_departmentId_idx" ON "CareerOpportunity"("departmentId");
CREATE INDEX "CareerOpportunity_employerId_status_idx" ON "CareerOpportunity"("employerId", "status");
CREATE INDEX "CareerOpportunity_ownerEmployeeId_status_idx" ON "CareerOpportunity"("ownerEmployeeId", "status");
CREATE INDEX "CareerOpportunity_type_workMode_status_idx" ON "CareerOpportunity"("type", "workMode", "status");
CREATE INDEX "CareerOpportunity_applicationDeadline_idx" ON "CareerOpportunity"("applicationDeadline");
CREATE UNIQUE INDEX "CareerReferral_code_key" ON "CareerReferral"("code");
CREATE UNIQUE INDEX "CareerReferral_opportunityId_referrerId_key" ON "CareerReferral"("opportunityId", "referrerId");
CREATE INDEX "CareerReferral_referrerId_status_idx" ON "CareerReferral"("referrerId", "status");
CREATE INDEX "CareerReferral_opportunityId_status_idx" ON "CareerReferral"("opportunityId", "status");
CREATE UNIQUE INDEX "CareerOpportunityApplication_opportunityId_applicantId_key" ON "CareerOpportunityApplication"("opportunityId", "applicantId");
CREATE INDEX "CareerOpportunityApplication_applicantId_status_idx" ON "CareerOpportunityApplication"("applicantId", "status");
CREATE INDEX "CareerOpportunityApplication_opportunityId_status_idx" ON "CareerOpportunityApplication"("opportunityId", "status");
CREATE INDEX "CareerOpportunityApplication_talentProfileId_idx" ON "CareerOpportunityApplication"("talentProfileId");
CREATE INDEX "CareerOpportunityApplication_referralId_idx" ON "CareerOpportunityApplication"("referralId");
CREATE INDEX "CareerOpportunityApplication_reviewedById_idx" ON "CareerOpportunityApplication"("reviewedById");

ALTER TABLE "CareerTalentProfile" ADD CONSTRAINT "CareerTalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerEmployer" ADD CONSTRAINT "CareerEmployer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "CareerEmployer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerReferral" ADD CONSTRAINT "CareerReferral_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerReferral" ADD CONSTRAINT "CareerReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityApplication" ADD CONSTRAINT "CareerOpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityApplication" ADD CONSTRAINT "CareerOpportunityApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityApplication" ADD CONSTRAINT "CareerOpportunityApplication_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "CareerTalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityApplication" ADD CONSTRAINT "CareerOpportunityApplication_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "CareerReferral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityApplication" ADD CONSTRAINT "CareerOpportunityApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Role" ("id", "name", "key", "system", "description", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Career Hub Manager', 'CAREER_HUB_MANAGER', true, 'Scoped Career Hub operations manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Career Participant', 'CAREER_PARTICIPANT', true, 'Career Hub participant without required academic enrollment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Opportunity Owner', 'OPPORTUNITY_OWNER', true, 'Employee responsible for assigned Career Hub opportunities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "key" = EXCLUDED."key", "system" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'career.read', 'career', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'career.profile.manage', 'career-profile', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'career.apply', 'career-application', 'create', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'career.opportunity.manage', 'career-opportunity', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'career.application.manage', 'career-application', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'career.referral.manage', 'career-referral', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'career.read', 'GLOBAL'), ('Admin', 'career.profile.manage', 'GLOBAL'), ('Admin', 'career.apply', 'GLOBAL'), ('Admin', 'career.opportunity.manage', 'GLOBAL'), ('Admin', 'career.application.manage', 'GLOBAL'), ('Admin', 'career.referral.manage', 'GLOBAL'),
  ('Director', 'career.read', 'GLOBAL'), ('Director', 'career.profile.manage', 'GLOBAL'), ('Director', 'career.apply', 'GLOBAL'), ('Director', 'career.opportunity.manage', 'GLOBAL'), ('Director', 'career.application.manage', 'GLOBAL'), ('Director', 'career.referral.manage', 'GLOBAL'),
  ('CEO', 'career.read', 'GLOBAL'), ('CEO', 'career.profile.manage', 'GLOBAL'), ('CEO', 'career.apply', 'GLOBAL'), ('CEO', 'career.opportunity.manage', 'GLOBAL'), ('CEO', 'career.application.manage', 'GLOBAL'), ('CEO', 'career.referral.manage', 'GLOBAL'),
  ('COO', 'career.read', 'GLOBAL'), ('COO', 'career.profile.manage', 'GLOBAL'), ('COO', 'career.apply', 'GLOBAL'), ('COO', 'career.opportunity.manage', 'GLOBAL'), ('COO', 'career.application.manage', 'GLOBAL'), ('COO', 'career.referral.manage', 'GLOBAL'),
  ('Career Hub Manager', 'career.read', 'ORGANIZATION'), ('Career Hub Manager', 'career.profile.manage', 'ORGANIZATION'), ('Career Hub Manager', 'career.apply', 'ORGANIZATION'), ('Career Hub Manager', 'career.opportunity.manage', 'ORGANIZATION'), ('Career Hub Manager', 'career.application.manage', 'ORGANIZATION'), ('Career Hub Manager', 'career.referral.manage', 'ORGANIZATION'),
  ('Opportunity Owner', 'career.read', 'OWN'), ('Opportunity Owner', 'career.opportunity.manage', 'OWN'), ('Opportunity Owner', 'career.application.manage', 'OWN'),
  ('Career Participant', 'career.read', 'OWN'), ('Career Participant', 'career.profile.manage', 'OWN'), ('Career Participant', 'career.apply', 'OWN'), ('Career Participant', 'career.referral.manage', 'OWN'),
  ('Student', 'career.read', 'OWN'), ('Student', 'career.profile.manage', 'OWN'), ('Student', 'career.apply', 'OWN'), ('Student', 'career.referral.manage', 'OWN')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

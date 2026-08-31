CREATE TYPE "CareerRecruitmentStage" AS ENUM (
  'NEW_APPLICATION',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'JOINED',
  'TRAINING',
  'ACTIVE',
  'REJECTED',
  'ON_HOLD'
);

CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TYPE "RMDevelopmentStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'EVALUATION_PENDING',
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'COMPLETED'
);

CREATE TABLE "CareerApplication" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "candidateName" VARCHAR(160) NOT NULL,
  "mobile" VARCHAR(40) NOT NULL,
  "whatsapp" VARCHAR(40) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "district" VARCHAR(120) NOT NULL,
  "roleSlug" VARCHAR(140) NOT NULL,
  "roleTitle" VARCHAR(160) NOT NULL,
  "categorySlug" VARCHAR(140) NOT NULL,
  "categoryTitle" VARCHAR(160) NOT NULL,
  "education" VARCHAR(180) NOT NULL,
  "experience" TEXT,
  "currentStatus" VARCHAR(180) NOT NULL,
  "relevantSkills" TEXT,
  "resumeUrl" VARCHAR(600),
  "profileUrl" VARCHAR(600),
  "shortIntro" TEXT NOT NULL,
  "availability" VARCHAR(120) NOT NULL,
  "preferredLocation" VARCHAR(120) NOT NULL,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "stage" "CareerRecruitmentStage" NOT NULL DEFAULT 'NEW_APPLICATION',
  "reviewedById" UUID,
  "assignedHrId" UUID,
  "employeeId" UUID,
  "offerStatus" VARCHAR(120),
  "joiningStatus" VARCHAR(120),
  "source" VARCHAR(120) NOT NULL DEFAULT 'PUBLIC_CAREERS',
  "metadata" JSONB,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerInterview" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicationId" UUID NOT NULL,
  "interviewerId" UUID,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "mode" VARCHAR(80) NOT NULL,
  "meetingLink" VARCHAR(600),
  "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
  "result" VARCHAR(80),
  "feedback" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerInterview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerApplicationActivity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicationId" UUID NOT NULL,
  "actorId" UUID,
  "action" VARCHAR(120) NOT NULL,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerApplicationActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RelationshipManagerDevelopment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicationId" UUID NOT NULL,
  "employeeId" UUID,
  "targetAdmissions" INTEGER NOT NULL DEFAULT 120,
  "admissionsGenerated" INTEGER NOT NULL DEFAULT 0,
  "developmentStart" TIMESTAMP(3),
  "developmentEnd" TIMESTAMP(3),
  "status" "RMDevelopmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "evaluationNotes" TEXT,
  "franchiseEligibleAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RelationshipManagerDevelopment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerApplication_email_roleSlug_key" ON "CareerApplication"("email", "roleSlug");
CREATE INDEX "CareerApplication_stage_submittedAt_idx" ON "CareerApplication"("stage", "submittedAt");
CREATE INDEX "CareerApplication_roleSlug_stage_idx" ON "CareerApplication"("roleSlug", "stage");
CREATE INDEX "CareerApplication_categorySlug_stage_idx" ON "CareerApplication"("categorySlug", "stage");
CREATE INDEX "CareerApplication_district_idx" ON "CareerApplication"("district");
CREATE INDEX "CareerApplication_mobile_idx" ON "CareerApplication"("mobile");
CREATE INDEX "CareerApplication_whatsapp_idx" ON "CareerApplication"("whatsapp");
CREATE INDEX "CareerApplication_email_idx" ON "CareerApplication"("email");
CREATE INDEX "CareerInterview_applicationId_idx" ON "CareerInterview"("applicationId");
CREATE INDEX "CareerInterview_interviewerId_scheduledAt_idx" ON "CareerInterview"("interviewerId", "scheduledAt");
CREATE INDEX "CareerInterview_status_scheduledAt_idx" ON "CareerInterview"("status", "scheduledAt");
CREATE INDEX "CareerApplicationActivity_applicationId_createdAt_idx" ON "CareerApplicationActivity"("applicationId", "createdAt");
CREATE INDEX "CareerApplicationActivity_actorId_idx" ON "CareerApplicationActivity"("actorId");
CREATE INDEX "CareerApplicationActivity_action_idx" ON "CareerApplicationActivity"("action");
CREATE UNIQUE INDEX "RelationshipManagerDevelopment_applicationId_key" ON "RelationshipManagerDevelopment"("applicationId");
CREATE INDEX "RelationshipManagerDevelopment_employeeId_idx" ON "RelationshipManagerDevelopment"("employeeId");
CREATE INDEX "RelationshipManagerDevelopment_status_idx" ON "RelationshipManagerDevelopment"("status");

ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_assignedHrId_fkey" FOREIGN KEY ("assignedHrId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerInterview" ADD CONSTRAINT "CareerInterview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CareerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterview" ADD CONSTRAINT "CareerInterview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerApplicationActivity" ADD CONSTRAINT "CareerApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CareerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerApplicationActivity" ADD CONSTRAINT "CareerApplicationActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelationshipManagerDevelopment" ADD CONSTRAINT "RelationshipManagerDevelopment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CareerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipManagerDevelopment" ADD CONSTRAINT "RelationshipManagerDevelopment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

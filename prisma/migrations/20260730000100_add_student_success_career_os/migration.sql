CREATE TYPE "PortfolioVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'UNLISTED');
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL');
CREATE TYPE "SkillEvidenceType" AS ENUM ('PROJECT', 'SUBMISSION', 'ASSESSMENT', 'CERTIFICATE', 'URL', 'TRAINER_FEEDBACK');
CREATE TYPE "CertificateType" AS ENUM ('COURSE', 'SKILL', 'ACHIEVEMENT', 'COMPLETION', 'INSTRUCTOR');
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'ISSUED', 'REVOKED');
CREATE TYPE "AchievementType" AS ENUM ('BADGE', 'MILESTONE', 'STREAK', 'HACKATHON', 'TOP_PERFORMER', 'COMMUNITY_AWARD', 'FOUNDER_ACHIEVEMENT');
CREATE TYPE "ResumeType" AS ENUM ('PROFESSIONAL', 'FOUNDER', 'DEVELOPER');
CREATE TYPE "PlacementStatus" AS ENUM ('NOT_READY', 'PREPARING', 'READY', 'INTERVIEWING', 'OFFERED', 'PLACED');
CREATE TYPE "PlacementApplicationStatus" AS ENUM ('DRAFT', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'ACCEPTED');
CREATE TYPE "InternshipStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RevenueStage" AS ENUM ('IDEA', 'VALIDATION', 'PRE_REVENUE', 'REVENUE', 'GROWTH');

CREATE TABLE "StudentPortfolio" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "bio" TEXT,
  "headline" VARCHAR(180),
  "githubUrl" VARCHAR(700),
  "linkedinUrl" VARCHAR(700),
  "websiteUrl" VARCHAR(700),
  "publicSlug" VARCHAR(180) NOT NULL,
  "visibility" "PortfolioVisibility" NOT NULL DEFAULT 'PRIVATE',
  "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentPortfolio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentPortfolioProgram" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "portfolioId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentPortfolioProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioProject" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "portfolioId" UUID NOT NULL,
  "submissionId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "screenshots" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "demoUrl" VARCHAR(700),
  "githubUrl" VARCHAR(700),
  "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "completedAt" TIMESTAMP(3),
  "mentorApproved" BOOLEAN NOT NULL DEFAULT false,
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerifiedSkill" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "portfolioId" UUID,
  "name" VARCHAR(140) NOT NULL,
  "level" "SkillLevel" NOT NULL,
  "verificationSource" VARCHAR(180) NOT NULL,
  "verifiedById" UUID,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerifiedSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkillEvidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "skillId" UUID NOT NULL,
  "projectId" UUID,
  "submissionId" UUID,
  "assessmentId" UUID,
  "feedbackId" UUID,
  "type" "SkillEvidenceType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "url" VARCHAR(700),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certificate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "portfolioId" UUID,
  "programId" UUID,
  "skillId" UUID,
  "type" "CertificateType" NOT NULL,
  "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
  "title" VARCHAR(180) NOT NULL,
  "certificateId" VARCHAR(120) NOT NULL,
  "qrPayload" VARCHAR(700),
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CertificateVerification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "certificateId" UUID NOT NULL,
  "verificationCode" VARCHAR(140) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificateVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Achievement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "portfolioId" UUID,
  "publishedById" UUID,
  "type" "AchievementType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "badgeIcon" VARCHAR(120),
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResumeProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "type" "ResumeType" NOT NULL,
  "headline" VARCHAR(180),
  "summary" TEXT,
  "experience" JSONB,
  "education" JSONB,
  "skillsSnapshot" JSONB,
  "projectsSnapshot" JSONB,
  "aiSummary" TEXT,
  "exportPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResumeProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlacementProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "status" "PlacementStatus" NOT NULL DEFAULT 'NOT_READY',
  "readinessScore" INTEGER NOT NULL DEFAULT 0,
  "preferredRole" VARCHAR(180),
  "preferredLocation" VARCHAR(180),
  "salaryExpectation" VARCHAR(120),
  "mentorNotes" TEXT,
  "companyNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlacementProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlacementApplication" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL,
  "company" VARCHAR(180) NOT NULL,
  "role" VARCHAR(180) NOT NULL,
  "status" "PlacementApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "appliedAt" TIMESTAMP(3),
  "interviewAt" TIMESTAMP(3),
  "offerAmount" VARCHAR(120),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlacementApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Internship" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "mentorId" UUID,
  "company" VARCHAR(180) NOT NULL,
  "role" VARCHAR(180) NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "status" "InternshipStatus" NOT NULL DEFAULT 'PLANNED',
  "feedback" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FounderProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "businessName" VARCHAR(180),
  "industry" VARCHAR(180),
  "revenueStage" "RevenueStage" NOT NULL DEFAULT 'IDEA',
  "products" JSONB,
  "websiteUrl" VARCHAR(700),
  "pitchDeckUrl" VARCHAR(700),
  "traction" TEXT,
  "customers" TEXT,
  "mentorFeedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerMilestone" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerMilestone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentPortfolio_studentId_key" ON "StudentPortfolio"("studentId");
CREATE UNIQUE INDEX "StudentPortfolio_publicSlug_key" ON "StudentPortfolio"("publicSlug");
CREATE INDEX "StudentPortfolio_visibility_approvalStatus_idx" ON "StudentPortfolio"("visibility", "approvalStatus");
CREATE UNIQUE INDEX "StudentPortfolioProgram_portfolioId_programId_key" ON "StudentPortfolioProgram"("portfolioId", "programId");
CREATE INDEX "StudentPortfolioProgram_programId_idx" ON "StudentPortfolioProgram"("programId");
CREATE INDEX "PortfolioProject_studentId_status_idx" ON "PortfolioProject"("studentId", "status");
CREATE INDEX "PortfolioProject_portfolioId_featured_idx" ON "PortfolioProject"("portfolioId", "featured");
CREATE INDEX "PortfolioProject_submissionId_idx" ON "PortfolioProject"("submissionId");
CREATE INDEX "VerifiedSkill_studentId_name_idx" ON "VerifiedSkill"("studentId", "name");
CREATE INDEX "VerifiedSkill_verifiedById_idx" ON "VerifiedSkill"("verifiedById");
CREATE INDEX "SkillEvidence_skillId_idx" ON "SkillEvidence"("skillId");
CREATE INDEX "SkillEvidence_type_idx" ON "SkillEvidence"("type");
CREATE UNIQUE INDEX "Certificate_certificateId_key" ON "Certificate"("certificateId");
CREATE INDEX "Certificate_studentId_status_idx" ON "Certificate"("studentId", "status");
CREATE INDEX "Certificate_programId_idx" ON "Certificate"("programId");
CREATE INDEX "Certificate_skillId_idx" ON "Certificate"("skillId");
CREATE UNIQUE INDEX "CertificateVerification_verificationCode_key" ON "CertificateVerification"("verificationCode");
CREATE INDEX "CertificateVerification_certificateId_idx" ON "CertificateVerification"("certificateId");
CREATE INDEX "Achievement_studentId_status_idx" ON "Achievement"("studentId", "status");
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");
CREATE UNIQUE INDEX "ResumeProfile_studentId_type_key" ON "ResumeProfile"("studentId", "type");
CREATE INDEX "ResumeProfile_studentId_idx" ON "ResumeProfile"("studentId");
CREATE UNIQUE INDEX "PlacementProfile_studentId_key" ON "PlacementProfile"("studentId");
CREATE INDEX "PlacementApplication_profileId_status_idx" ON "PlacementApplication"("profileId", "status");
CREATE INDEX "Internship_studentId_status_idx" ON "Internship"("studentId", "status");
CREATE INDEX "Internship_mentorId_idx" ON "Internship"("mentorId");
CREATE UNIQUE INDEX "FounderProfile_studentId_key" ON "FounderProfile"("studentId");
CREATE INDEX "CareerMilestone_studentId_achievedAt_idx" ON "CareerMilestone"("studentId", "achievedAt");

ALTER TABLE "StudentPortfolio" ADD CONSTRAINT "StudentPortfolio_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPortfolioProgram" ADD CONSTRAINT "StudentPortfolioProgram_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "StudentPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPortfolioProgram" ADD CONSTRAINT "StudentPortfolioProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "StudentPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VerifiedSkill" ADD CONSTRAINT "VerifiedSkill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerifiedSkill" ADD CONSTRAINT "VerifiedSkill_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "StudentPortfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VerifiedSkill" ADD CONSTRAINT "VerifiedSkill_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "VerifiedSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "TrainerFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "StudentPortfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "VerifiedSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CertificateVerification" ADD CONSTRAINT "CertificateVerification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "StudentPortfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResumeProfile" ADD CONSTRAINT "ResumeProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementProfile" ADD CONSTRAINT "PlacementProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PlacementProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FounderProfile" ADD CONSTRAINT "FounderProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerMilestone" ADD CONSTRAINT "CareerMilestone_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

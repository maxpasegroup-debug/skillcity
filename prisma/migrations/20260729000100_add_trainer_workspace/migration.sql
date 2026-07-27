CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "TrainerFeedbackType" AS ENUM ('SUBMISSION', 'REFLECTION', 'ASSESSMENT', 'GENERAL');
CREATE TYPE "TrainerFeedbackStatus" AS ENUM ('DRAFT', 'SENT', 'ARCHIVED');
CREATE TYPE "ReviewQueueStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'ESCALATED');
CREATE TYPE "StudentConcernStatus" AS ENUM ('OPEN', 'FOLLOW_UP', 'RESOLVED');
CREATE TYPE "ResourceType" AS ENUM ('VIDEO', 'PDF', 'CODE_SAMPLE', 'TEMPLATE', 'REFERENCE_LINK', 'VOICE_NOTE');

CREATE TABLE "AttendanceSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "trainerId" UUID,
  "calendarEventId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "sessionDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendanceRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "batchId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainerFeedback" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "studentId" UUID NOT NULL,
  "submissionId" UUID,
  "reflectionId" UUID,
  "assessmentId" UUID,
  "type" "TrainerFeedbackType" NOT NULL,
  "status" "TrainerFeedbackStatus" NOT NULL DEFAULT 'SENT',
  "score" INTEGER,
  "comment" TEXT NOT NULL,
  "aiDraft" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainerFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewRubric" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "criteria" JSONB NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReviewRubric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewComment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "submissionId" UUID,
  "reflectionId" UUID,
  "assessmentId" UUID,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Resource" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "batchId" UUID,
  "categoryId" UUID,
  "type" "ResourceType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "url" VARCHAR(700) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainerAnnouncement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "batchId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "CommunicationStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainerAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentConcern" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "studentId" UUID NOT NULL,
  "batchId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "notes" TEXT NOT NULL,
  "status" "StudentConcernStatus" NOT NULL DEFAULT 'OPEN',
  "taraFollowUpRecommended" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentConcern_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewQueue" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID,
  "batchId" UUID,
  "studentId" UUID NOT NULL,
  "submissionId" UUID,
  "reflectionId" UUID,
  "assessmentId" UUID,
  "status" "ReviewQueueStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");

CREATE INDEX "AttendanceSession_batchId_sessionDate_idx" ON "AttendanceSession"("batchId", "sessionDate");
CREATE INDEX "AttendanceSession_trainerId_idx" ON "AttendanceSession"("trainerId");
CREATE INDEX "AttendanceSession_calendarEventId_idx" ON "AttendanceSession"("calendarEventId");
CREATE INDEX "AttendanceRecord_batchId_status_idx" ON "AttendanceRecord"("batchId", "status");
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE INDEX "TrainerFeedback_trainerId_idx" ON "TrainerFeedback"("trainerId");
CREATE INDEX "TrainerFeedback_studentId_idx" ON "TrainerFeedback"("studentId");
CREATE INDEX "TrainerFeedback_type_status_idx" ON "TrainerFeedback"("type", "status");
CREATE INDEX "ReviewRubric_status_idx" ON "ReviewRubric"("status");
CREATE INDEX "ReviewComment_trainerId_idx" ON "ReviewComment"("trainerId");
CREATE INDEX "ReviewComment_submissionId_idx" ON "ReviewComment"("submissionId");
CREATE INDEX "ReviewComment_reflectionId_idx" ON "ReviewComment"("reflectionId");
CREATE INDEX "ReviewComment_assessmentId_idx" ON "ReviewComment"("assessmentId");
CREATE INDEX "ResourceCategory_status_idx" ON "ResourceCategory"("status");
CREATE INDEX "Resource_trainerId_idx" ON "Resource"("trainerId");
CREATE INDEX "Resource_batchId_idx" ON "Resource"("batchId");
CREATE INDEX "Resource_categoryId_idx" ON "Resource"("categoryId");
CREATE INDEX "Resource_type_idx" ON "Resource"("type");
CREATE INDEX "TrainerAnnouncement_trainerId_idx" ON "TrainerAnnouncement"("trainerId");
CREATE INDEX "TrainerAnnouncement_batchId_idx" ON "TrainerAnnouncement"("batchId");
CREATE INDEX "TrainerAnnouncement_status_idx" ON "TrainerAnnouncement"("status");
CREATE INDEX "StudentConcern_trainerId_status_idx" ON "StudentConcern"("trainerId", "status");
CREATE INDEX "StudentConcern_studentId_idx" ON "StudentConcern"("studentId");
CREATE INDEX "StudentConcern_batchId_idx" ON "StudentConcern"("batchId");
CREATE INDEX "ReviewQueue_trainerId_status_idx" ON "ReviewQueue"("trainerId", "status");
CREATE INDEX "ReviewQueue_batchId_idx" ON "ReviewQueue"("batchId");
CREATE INDEX "ReviewQueue_studentId_idx" ON "ReviewQueue"("studentId");
CREATE INDEX "ReviewQueue_submissionId_idx" ON "ReviewQueue"("submissionId");

ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "StudentReflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "StudentReflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerAnnouncement" ADD CONSTRAINT "TrainerAnnouncement_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerAnnouncement" ADD CONSTRAINT "TrainerAnnouncement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentConcern" ADD CONSTRAINT "StudentConcern_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentConcern" ADD CONSTRAINT "StudentConcern_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentConcern" ADD CONSTRAINT "StudentConcern_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "StudentReflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

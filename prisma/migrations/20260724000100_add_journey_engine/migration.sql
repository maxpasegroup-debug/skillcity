CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "JourneyDayUnlockType" AS ENUM ('SEQUENTIAL', 'DATE_BASED', 'MANUAL');
CREATE TYPE "ActivityType" AS ENUM ('VIDEO', 'LIVE', 'ARTICLE', 'PDF', 'TASK', 'QUIZ', 'PROJECT', 'AI_CHAT', 'REFLECTION', 'MEETING', 'OFFLINE', 'VOICE_NOTE', 'ASSESSMENT', 'LINK');
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'PROGRAM', 'BATCH');
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'ACTIVITY', 'JOURNEY', 'SYSTEM');
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

CREATE TABLE "Program" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "thumbnail" VARCHAR(500),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Journey" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JourneyPhase" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "journeyId" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "order" INTEGER NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JourneyPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JourneyWeek" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "phaseId" UUID NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JourneyWeek_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JourneyDay" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "weekId" UUID NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "summary" TEXT,
  "unlockType" "JourneyDayUnlockType" NOT NULL DEFAULT 'SEQUENTIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JourneyDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dayId" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "type" "ActivityType" NOT NULL,
  "description" TEXT,
  "duration" INTEGER,
  "sortOrder" INTEGER NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "points" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Batch" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentEnrollment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "journeyId" UUID NOT NULL,
  "batchId" UUID,
  "currentDay" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentProgress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "completedAt" TIMESTAMP(3),
  "score" INTEGER,
  "reflection" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "authorId" UUID,
  "programId" UUID,
  "journeyId" UUID,
  "batchId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "message" TEXT NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "actionUrl" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");
CREATE INDEX "Program_slug_idx" ON "Program"("slug");
CREATE INDEX "Program_status_idx" ON "Program"("status");
CREATE UNIQUE INDEX "Journey_programId_version_key" ON "Journey"("programId", "version");
CREATE INDEX "Journey_programId_status_idx" ON "Journey"("programId", "status");
CREATE UNIQUE INDEX "JourneyPhase_journeyId_order_key" ON "JourneyPhase"("journeyId", "order");
CREATE INDEX "JourneyPhase_journeyId_idx" ON "JourneyPhase"("journeyId");
CREATE UNIQUE INDEX "JourneyWeek_phaseId_weekNumber_key" ON "JourneyWeek"("phaseId", "weekNumber");
CREATE INDEX "JourneyWeek_phaseId_idx" ON "JourneyWeek"("phaseId");
CREATE UNIQUE INDEX "JourneyDay_weekId_dayNumber_key" ON "JourneyDay"("weekId", "dayNumber");
CREATE INDEX "JourneyDay_weekId_idx" ON "JourneyDay"("weekId");
CREATE INDEX "JourneyDay_dayNumber_idx" ON "JourneyDay"("dayNumber");
CREATE UNIQUE INDEX "Activity_dayId_sortOrder_key" ON "Activity"("dayId", "sortOrder");
CREATE INDEX "Activity_dayId_idx" ON "Activity"("dayId");
CREATE INDEX "Activity_type_idx" ON "Activity"("type");
CREATE INDEX "Batch_programId_idx" ON "Batch"("programId");
CREATE INDEX "Batch_status_idx" ON "Batch"("status");
CREATE UNIQUE INDEX "StudentEnrollment_studentId_programId_journeyId_key" ON "StudentEnrollment"("studentId", "programId", "journeyId");
CREATE INDEX "StudentEnrollment_studentId_status_idx" ON "StudentEnrollment"("studentId", "status");
CREATE INDEX "StudentEnrollment_programId_idx" ON "StudentEnrollment"("programId");
CREATE INDEX "StudentEnrollment_journeyId_idx" ON "StudentEnrollment"("journeyId");
CREATE INDEX "StudentEnrollment_batchId_idx" ON "StudentEnrollment"("batchId");
CREATE UNIQUE INDEX "StudentProgress_studentId_activityId_key" ON "StudentProgress"("studentId", "activityId");
CREATE INDEX "StudentProgress_studentId_status_idx" ON "StudentProgress"("studentId", "status");
CREATE INDEX "StudentProgress_activityId_idx" ON "StudentProgress"("activityId");
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");
CREATE INDEX "Announcement_programId_idx" ON "Announcement"("programId");
CREATE INDEX "Announcement_batchId_idx" ON "Announcement"("batchId");
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Journey" ADD CONSTRAINT "Journey_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneyPhase" ADD CONSTRAINT "JourneyPhase_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneyWeek" ADD CONSTRAINT "JourneyWeek_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JourneyPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneyDay" ADD CONSTRAINT "JourneyDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "JourneyWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

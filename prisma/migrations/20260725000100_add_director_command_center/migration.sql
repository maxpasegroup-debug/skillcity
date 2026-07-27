CREATE TYPE "BlueprintStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ContentLibraryType" AS ENUM ('VIDEO', 'PDF', 'ARTICLE', 'VOICE_NOTE', 'EXTERNAL_LINK');
CREATE TYPE "TrainerAssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "CalendarEventType" AS ENUM ('LIVE_CLASS', 'OFFLINE_WORKSHOP', 'HOLIDAY', 'RESCHEDULED_EVENT', 'ASSESSMENT', 'MEETING');
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "DirectorAnnouncementType" AS ENUM ('GENERAL', 'EMERGENCY', 'MOTIVATION', 'ASSIGNMENT', 'HOLIDAY', 'PLACEMENT', 'FEE_REMINDER', 'OFFLINE_EVENT');
CREATE TYPE "CommunicationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "CommunicationRecipientType" AS ENUM ('PLATFORM', 'PROGRAM', 'BATCH', 'STUDENTS');

ALTER TABLE "Batch" ADD COLUMN "journeyId" UUID;
ALTER TABLE "Batch" ADD COLUMN "enrollmentLimit" INTEGER;

CREATE TABLE "Blueprint" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL,
  "journeyId" UUID,
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "status" "BlueprintStatus" NOT NULL DEFAULT 'DRAFT',
  "activeVersion" INTEGER NOT NULL DEFAULT 1,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlueprintVersion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "blueprintId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "notes" TEXT,
  "status" "BlueprintStatus" NOT NULL DEFAULT 'DRAFT',
  "sourceVersionId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlueprintVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentLibrary" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID,
  "uploadedById" UUID,
  "title" VARCHAR(180) NOT NULL,
  "type" "ContentLibraryType" NOT NULL,
  "url" VARCHAR(600) NOT NULL,
  "description" TEXT,
  "checksum" VARCHAR(160),
  "duration" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ContentLibrary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainerAssignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trainerId" UUID NOT NULL,
  "batchId" UUID NOT NULL,
  "role" VARCHAR(100) NOT NULL DEFAULT 'Trainer',
  "status" "TrainerAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectorAnnouncement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "authorId" UUID,
  "programId" UUID,
  "batchId" UUID,
  "type" "DirectorAnnouncementType" NOT NULL,
  "recipientType" "CommunicationRecipientType" NOT NULL DEFAULT 'PLATFORM',
  "title" VARCHAR(180) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "CommunicationStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DirectorAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID,
  "journeyId" UUID,
  "batchId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "type" "CalendarEventType" NOT NULL,
  "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "location" VARCHAR(240),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectorActivityLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorId" UUID,
  "action" VARCHAR(140) NOT NULL,
  "entity" VARCHAR(120),
  "entityId" VARCHAR(120),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectorActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Batch_journeyId_idx" ON "Batch"("journeyId");
CREATE INDEX "Blueprint_programId_status_idx" ON "Blueprint"("programId", "status");
CREATE INDEX "Blueprint_journeyId_idx" ON "Blueprint"("journeyId");
CREATE UNIQUE INDEX "BlueprintVersion_blueprintId_version_key" ON "BlueprintVersion"("blueprintId", "version");
CREATE INDEX "BlueprintVersion_blueprintId_status_idx" ON "BlueprintVersion"("blueprintId", "status");
CREATE INDEX "ContentLibrary_programId_idx" ON "ContentLibrary"("programId");
CREATE INDEX "ContentLibrary_type_idx" ON "ContentLibrary"("type");
CREATE INDEX "ContentLibrary_checksum_idx" ON "ContentLibrary"("checksum");
CREATE UNIQUE INDEX "TrainerAssignment_trainerId_batchId_role_key" ON "TrainerAssignment"("trainerId", "batchId", "role");
CREATE INDEX "TrainerAssignment_trainerId_status_idx" ON "TrainerAssignment"("trainerId", "status");
CREATE INDEX "TrainerAssignment_batchId_status_idx" ON "TrainerAssignment"("batchId", "status");
CREATE INDEX "DirectorAnnouncement_status_idx" ON "DirectorAnnouncement"("status");
CREATE INDEX "DirectorAnnouncement_recipientType_idx" ON "DirectorAnnouncement"("recipientType");
CREATE INDEX "DirectorAnnouncement_programId_idx" ON "DirectorAnnouncement"("programId");
CREATE INDEX "DirectorAnnouncement_batchId_idx" ON "DirectorAnnouncement"("batchId");
CREATE INDEX "DirectorAnnouncement_scheduledAt_idx" ON "DirectorAnnouncement"("scheduledAt");
CREATE INDEX "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");
CREATE INDEX "CalendarEvent_type_status_idx" ON "CalendarEvent"("type", "status");
CREATE INDEX "CalendarEvent_programId_idx" ON "CalendarEvent"("programId");
CREATE INDEX "CalendarEvent_batchId_idx" ON "CalendarEvent"("batchId");
CREATE INDEX "DirectorActivityLog_actorId_idx" ON "DirectorActivityLog"("actorId");
CREATE INDEX "DirectorActivityLog_action_idx" ON "DirectorActivityLog"("action");
CREATE INDEX "DirectorActivityLog_createdAt_idx" ON "DirectorActivityLog"("createdAt");

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Blueprint" ADD CONSTRAINT "Blueprint_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Blueprint" ADD CONSTRAINT "Blueprint_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Blueprint" ADD CONSTRAINT "Blueprint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlueprintVersion" ADD CONSTRAINT "BlueprintVersion_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "Blueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentLibrary" ADD CONSTRAINT "ContentLibrary_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentLibrary" ADD CONSTRAINT "ContentLibrary_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerAssignment" ADD CONSTRAINT "TrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerAssignment" ADD CONSTRAINT "TrainerAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorAnnouncement" ADD CONSTRAINT "DirectorAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorAnnouncement" ADD CONSTRAINT "DirectorAnnouncement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorAnnouncement" ADD CONSTRAINT "DirectorAnnouncement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorActivityLog" ADD CONSTRAINT "DirectorActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

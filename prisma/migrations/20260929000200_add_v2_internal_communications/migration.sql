-- Additive V2 internal communications foundation. Existing communication data is untouched.
CREATE TYPE "InternalChannelType" AS ENUM ('TEAM', 'ANNOUNCEMENT');
CREATE TYPE "InternalChannelMemberRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');
CREATE TYPE "InternalChannelMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "InternalChannel" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "name" VARCHAR(160) NOT NULL,
  "description" VARCHAR(500),
  "type" "InternalChannelType" NOT NULL DEFAULT 'TEAM',
  "createdById" UUID NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalChannelMember" (
  "id" UUID NOT NULL,
  "channelId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "InternalChannelMemberRole" NOT NULL DEFAULT 'MEMBER',
  "status" "InternalChannelMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastReadAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalChannelMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalMessage" (
  "id" UUID NOT NULL,
  "channelId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalChannel_institutionId_archivedAt_idx" ON "InternalChannel"("institutionId", "archivedAt");
CREATE INDEX "InternalChannel_divisionId_idx" ON "InternalChannel"("divisionId");
CREATE INDEX "InternalChannel_districtId_idx" ON "InternalChannel"("districtId");
CREATE INDEX "InternalChannel_campusId_idx" ON "InternalChannel"("campusId");
CREATE INDEX "InternalChannel_departmentId_idx" ON "InternalChannel"("departmentId");
CREATE INDEX "InternalChannel_type_archivedAt_idx" ON "InternalChannel"("type", "archivedAt");
CREATE INDEX "InternalChannel_createdById_idx" ON "InternalChannel"("createdById");
CREATE UNIQUE INDEX "InternalChannelMember_channelId_userId_key" ON "InternalChannelMember"("channelId", "userId");
CREATE INDEX "InternalChannelMember_userId_status_idx" ON "InternalChannelMember"("userId", "status");
CREATE INDEX "InternalChannelMember_channelId_status_idx" ON "InternalChannelMember"("channelId", "status");
CREATE INDEX "InternalMessage_channelId_createdAt_idx" ON "InternalMessage"("channelId", "createdAt");
CREATE INDEX "InternalMessage_authorId_createdAt_idx" ON "InternalMessage"("authorId", "createdAt");

ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalChannel" ADD CONSTRAINT "InternalChannel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalChannelMember" ADD CONSTRAINT "InternalChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "InternalChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalChannelMember" ADD CONSTRAINT "InternalChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "InternalChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

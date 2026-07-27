CREATE TYPE "CommunityGroupType" AS ENUM ('BATCH', 'PROGRAM', 'INTEREST', 'FOUNDER_CLUB', 'CODING_CLUB', 'AI_CLUB', 'PLACEMENT_CLUB');
CREATE TYPE "CommunityPostType" AS ENUM ('UPDATE', 'PROJECT_MILESTONE', 'ACHIEVEMENT', 'QUESTION', 'RESOURCE');
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'CELEBRATE', 'INSIGHTFUL', 'SUPPORT');
CREATE TYPE "CommunityEventType" AS ENUM ('WORKSHOP', 'LIVE_SESSION', 'HACKATHON', 'MEETUP', 'BOOTCAMP', 'CAREER_FAIR', 'GUEST_LECTURE');
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'ATTENDED', 'CANCELLED');
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ChallengeParticipationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');
CREATE TYPE "WalletTransactionType" AS ENUM ('EARNED', 'BONUS', 'REWARD', 'REDEMPTION', 'ADJUSTMENT');
CREATE TYPE "MarketplaceListingType" AS ENUM ('TEMPLATE', 'PROJECT', 'PROMPT_PACK', 'DESIGN_ASSET', 'LEARNING_RESOURCE', 'SERVICE');
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "MissionType" AS ENUM ('DAILY', 'WEEKLY');

CREATE TABLE "CommunityGroup" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creatorId" UUID,
  "programId" UUID,
  "batchId" UUID,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "type" "CommunityGroupType" NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityMembership" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" VARCHAR(80) NOT NULL DEFAULT 'Member',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityPost" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "authorId" UUID NOT NULL,
  "groupId" UUID,
  "programId" UUID,
  "batchId" UUID,
  "type" "CommunityPostType" NOT NULL DEFAULT 'UPDATE',
  "title" VARCHAR(180) NOT NULL,
  "content" TEXT NOT NULL,
  "resourceUrl" VARCHAR(700),
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "hiddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityComment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "hiddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityReaction" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "groupId" UUID,
  "programId" UUID,
  "batchId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "type" "CommunityEventType" NOT NULL,
  "capacity" INTEGER,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "location" VARCHAR(240),
  "meetingLink" VARCHAR(700),
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRegistration" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Challenge" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "groupId" UUID,
  "programId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "rewardXp" INTEGER NOT NULL DEFAULT 0,
  "rewardCoins" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChallengeParticipation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "challengeId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" "ChallengeParticipationStatus" NOT NULL DEFAULT 'ACTIVE',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChallengeParticipation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "skillCoins" INTEGER NOT NULL DEFAULT 0,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL,
  "actorId" UUID,
  "type" "WalletTransactionType" NOT NULL,
  "coins" INTEGER NOT NULL DEFAULT 0,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "reason" VARCHAR(180) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceListing" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sellerId" UUID NOT NULL,
  "categoryId" UUID,
  "type" "MarketplaceListingType" NOT NULL,
  "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "url" VARCHAR(700),
  "priceCoins" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceApproval" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "listingId" UUID NOT NULL,
  "approverId" UUID,
  "status" "MarketplaceListingStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlumniProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "employment" VARCHAR(180),
  "business" VARCHAR(180),
  "mentorship" BOOLEAN NOT NULL DEFAULT false,
  "speaking" BOOLEAN NOT NULL DEFAULT false,
  "contributions" INTEGER NOT NULL DEFAULT 0,
  "networkingBio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(140) NOT NULL,
  "description" TEXT,
  "icon" VARCHAR(120),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaderboardSnapshot" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" VARCHAR(120) NOT NULL,
  "period" VARCHAR(80) NOT NULL,
  "entries" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Mission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "type" "MissionType" NOT NULL,
  "rewardXp" INTEGER NOT NULL DEFAULT 0,
  "rewardCoins" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionCompletion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "missionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MissionCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityGroup_slug_key" ON "CommunityGroup"("slug");
CREATE UNIQUE INDEX "CommunityMembership_groupId_userId_key" ON "CommunityMembership"("groupId", "userId");
CREATE UNIQUE INDEX "CommunityReaction_postId_userId_type_key" ON "CommunityReaction"("postId", "userId", "type");
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");
CREATE UNIQUE INDEX "ChallengeParticipation_challengeId_userId_key" ON "ChallengeParticipation"("challengeId", "userId");
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE UNIQUE INDEX "MarketplaceCategory_name_key" ON "MarketplaceCategory"("name");
CREATE UNIQUE INDEX "AlumniProfile_userId_key" ON "AlumniProfile"("userId");
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");
CREATE UNIQUE INDEX "MissionCompletion_missionId_userId_key" ON "MissionCompletion"("missionId", "userId");

CREATE INDEX "CommunityGroup_type_status_idx" ON "CommunityGroup"("type", "status");
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");
CREATE INDEX "CommunityPost_groupId_idx" ON "CommunityPost"("groupId");
CREATE INDEX "Event_type_startsAt_idx" ON "Event"("type", "startsAt");
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX "MarketplaceListing_type_status_idx" ON "MarketplaceListing"("type", "status");
CREATE INDEX "LeaderboardSnapshot_scope_period_idx" ON "LeaderboardSnapshot"("scope", "period");
CREATE INDEX "Mission_programId_type_idx" ON "Mission"("programId", "type");

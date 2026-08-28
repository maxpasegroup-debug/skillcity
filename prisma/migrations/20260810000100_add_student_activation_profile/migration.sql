CREATE TABLE "StudentActivationProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "whatsapp" VARCHAR(40),
  "city" VARCHAR(120),
  "state" VARCHAR(120),
  "educationOrWork" VARCHAR(180),
  "learningGoal" TEXT,
  "preferredLanguage" VARCHAR(80),
  "availability" VARCHAR(160),
  "guardianName" VARCHAR(160),
  "guardianPhone" VARCHAR(40),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StudentActivationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentActivationProfile_studentId_key" ON "StudentActivationProfile"("studentId");
CREATE INDEX "StudentActivationProfile_completedAt_idx" ON "StudentActivationProfile"("completedAt");

ALTER TABLE "StudentActivationProfile" ADD CONSTRAINT "StudentActivationProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

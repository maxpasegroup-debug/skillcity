CREATE TYPE "LearningStepType" AS ENUM ('VIDEO', 'ARTICLE', 'PDF', 'INTERACTIVE_READING', 'QUIZ', 'CODING_PRACTICE', 'PROJECT_TASK', 'REFLECTION', 'AI_DISCUSSION', 'VOICE_INSTRUCTION', 'CHECKLIST', 'EXTERNAL_LINK', 'FILE_UPLOAD', 'ASSESSMENT', 'OFFLINE_ACTIVITY');
CREATE TYPE "LearningSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "SubmissionType" AS ENUM ('TEXT', 'URL', 'GITHUB_REPOSITORY', 'FILE', 'IMAGE', 'DOCUMENT', 'VIDEO_LINK');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RETURNED', 'APPROVED', 'REJECTED');
CREATE TYPE "QuizQuestionType" AS ENUM ('MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODING');
CREATE TYPE "AssessmentType" AS ENUM ('DAILY', 'WEEKLY', 'FINAL');

ALTER TABLE "JourneyDay" ADD COLUMN "learningFlowId" UUID;

CREATE TABLE "LearningFlow" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningStep" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "learningFlowId" UUID NOT NULL,
  "activityId" UUID,
  "title" VARCHAR(180) NOT NULL,
  "type" "LearningStepType" NOT NULL,
  "instructions" TEXT,
  "sortOrder" INTEGER NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "points" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reflection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dayId" UUID NOT NULL,
  "stepId" UUID,
  "question" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentReflection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "reflectionId" UUID NOT NULL,
  "answer" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentReflection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "dayId" UUID NOT NULL,
  "activityId" UUID,
  "stepId" UUID,
  "type" "SubmissionType" NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "title" VARCHAR(180) NOT NULL,
  "content" TEXT,
  "url" VARCHAR(700),
  "metadata" JSONB,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionReview" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "submissionId" UUID NOT NULL,
  "reviewerId" UUID,
  "status" "SubmissionStatus" NOT NULL,
  "score" INTEGER,
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizQuestion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "activityId" UUID,
  "stepId" UUID,
  "question" TEXT NOT NULL,
  "type" "QuizQuestionType" NOT NULL,
  "options" JSONB,
  "correctAnswer" JSONB,
  "explanation" TEXT,
  "points" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "dayId" UUID NOT NULL,
  "activityId" UUID,
  "stepId" UUID,
  "questionOrder" JSONB NOT NULL,
  "answers" JSONB NOT NULL,
  "score" INTEGER,
  "maxScore" INTEGER,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "dayId" UUID NOT NULL,
  "activityId" UUID,
  "stepId" UUID,
  "type" "AssessmentType" NOT NULL,
  "score" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "feedback" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyLearningSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "dayId" UUID NOT NULL,
  "currentStepId" UUID,
  "status" "LearningSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "completedStepIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyLearningSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JourneyDay_learningFlowId_idx" ON "JourneyDay"("learningFlowId");
CREATE INDEX "LearningFlow_status_idx" ON "LearningFlow"("status");
CREATE INDEX "LearningFlow_version_idx" ON "LearningFlow"("version");
CREATE UNIQUE INDEX "LearningStep_learningFlowId_sortOrder_key" ON "LearningStep"("learningFlowId", "sortOrder");
CREATE INDEX "LearningStep_learningFlowId_idx" ON "LearningStep"("learningFlowId");
CREATE INDEX "LearningStep_activityId_idx" ON "LearningStep"("activityId");
CREATE INDEX "LearningStep_type_idx" ON "LearningStep"("type");
CREATE UNIQUE INDEX "Reflection_dayId_sortOrder_key" ON "Reflection"("dayId", "sortOrder");
CREATE INDEX "Reflection_dayId_idx" ON "Reflection"("dayId");
CREATE INDEX "Reflection_stepId_idx" ON "Reflection"("stepId");
CREATE UNIQUE INDEX "StudentReflection_studentId_reflectionId_key" ON "StudentReflection"("studentId", "reflectionId");
CREATE INDEX "StudentReflection_studentId_idx" ON "StudentReflection"("studentId");
CREATE INDEX "StudentReflection_reflectionId_idx" ON "StudentReflection"("reflectionId");
CREATE INDEX "Submission_studentId_status_idx" ON "Submission"("studentId", "status");
CREATE INDEX "Submission_dayId_idx" ON "Submission"("dayId");
CREATE INDEX "Submission_activityId_idx" ON "Submission"("activityId");
CREATE INDEX "Submission_stepId_idx" ON "Submission"("stepId");
CREATE INDEX "SubmissionReview_submissionId_idx" ON "SubmissionReview"("submissionId");
CREATE INDEX "SubmissionReview_reviewerId_idx" ON "SubmissionReview"("reviewerId");
CREATE INDEX "QuizQuestion_activityId_idx" ON "QuizQuestion"("activityId");
CREATE INDEX "QuizQuestion_stepId_idx" ON "QuizQuestion"("stepId");
CREATE INDEX "QuizQuestion_type_idx" ON "QuizQuestion"("type");
CREATE INDEX "QuizAttempt_studentId_dayId_idx" ON "QuizAttempt"("studentId", "dayId");
CREATE INDEX "QuizAttempt_activityId_idx" ON "QuizAttempt"("activityId");
CREATE INDEX "QuizAttempt_stepId_idx" ON "QuizAttempt"("stepId");
CREATE INDEX "AssessmentResult_studentId_type_idx" ON "AssessmentResult"("studentId", "type");
CREATE INDEX "AssessmentResult_dayId_idx" ON "AssessmentResult"("dayId");
CREATE INDEX "AssessmentResult_activityId_idx" ON "AssessmentResult"("activityId");
CREATE UNIQUE INDEX "DailyLearningSession_studentId_dayId_key" ON "DailyLearningSession"("studentId", "dayId");
CREATE INDEX "DailyLearningSession_studentId_status_idx" ON "DailyLearningSession"("studentId", "status");
CREATE INDEX "DailyLearningSession_dayId_idx" ON "DailyLearningSession"("dayId");
CREATE INDEX "DailyLearningSession_currentStepId_idx" ON "DailyLearningSession"("currentStepId");

ALTER TABLE "JourneyDay" ADD CONSTRAINT "JourneyDay_learningFlowId_fkey" FOREIGN KEY ("learningFlowId") REFERENCES "LearningFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningStep" ADD CONSTRAINT "LearningStep_learningFlowId_fkey" FOREIGN KEY ("learningFlowId") REFERENCES "LearningFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStep" ADD CONSTRAINT "LearningStep_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "LearningStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentReflection" ADD CONSTRAINT "StudentReflection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentReflection" ADD CONSTRAINT "StudentReflection_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "LearningStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "LearningStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "LearningStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "LearningStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DailyLearningSession" ADD CONSTRAINT "DailyLearningSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLearningSession" ADD CONSTRAINT "DailyLearningSession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLearningSession" ADD CONSTRAINT "DailyLearningSession_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "LearningStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

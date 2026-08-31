ALTER TABLE "RelationshipManagerDevelopment"
  ADD COLUMN "evaluationById" UUID,
  ADD COLUMN "finalEvaluationAt" TIMESTAMP(3),
  ADD COLUMN "finalDecision" VARCHAR(180),
  ADD COLUMN "checkpointNotes" JSONB;

CREATE INDEX "RelationshipManagerDevelopment_evaluationById_idx" ON "RelationshipManagerDevelopment"("evaluationById");

ALTER TABLE "RelationshipManagerDevelopment"
  ADD CONSTRAINT "RelationshipManagerDevelopment_evaluationById_fkey"
  FOREIGN KEY ("evaluationById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

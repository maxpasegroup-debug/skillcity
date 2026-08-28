-- Phase 7: allow existing journey activities to act as batch-scoped trainer tasks.
ALTER TABLE "Activity"
ADD COLUMN "batchId" UUID,
ADD COLUMN "dueAt" TIMESTAMP(3),
ADD COLUMN "resourceUrl" VARCHAR(700);

CREATE INDEX "Activity_batchId_idx" ON "Activity"("batchId");
CREATE INDEX "Activity_dueAt_idx" ON "Activity"("dueAt");

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

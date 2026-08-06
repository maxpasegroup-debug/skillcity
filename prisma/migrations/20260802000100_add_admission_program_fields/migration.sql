CREATE TYPE "ProgramFeeType" AS ENUM ('PAID', 'FREE');
CREATE TYPE "ProgramAdmissionStatus" AS ENUM ('OPEN', 'CLOSED', 'WAITLIST');

ALTER TABLE "Program"
  ADD COLUMN "category" VARCHAR(120),
  ADD COLUMN "feeType" "ProgramFeeType" NOT NULL DEFAULT 'PAID',
  ADD COLUMN "admissionStatus" "ProgramAdmissionStatus" NOT NULL DEFAULT 'CLOSED',
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Program_admissionStatus_publicVisible_idx" ON "Program"("admissionStatus", "publicVisible");
CREATE INDEX "Program_displayOrder_idx" ON "Program"("displayOrder");

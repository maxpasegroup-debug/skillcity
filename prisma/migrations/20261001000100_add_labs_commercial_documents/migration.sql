CREATE TYPE "LabsCommercialDocumentType" AS ENUM ('QUOTATION', 'INVOICE');
CREATE TYPE "LabsCommercialService" AS ENUM ('AI_POWERED_SIGNATURE_OS', 'TALKIN_LABS', 'CUSTOM');
CREATE TYPE "LabsCommercialDocumentStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOID');

CREATE TABLE "LabsCommercialDocument" (
  "id" UUID NOT NULL,
  "number" VARCHAR(80) NOT NULL,
  "type" "LabsCommercialDocumentType" NOT NULL,
  "service" "LabsCommercialService" NOT NULL,
  "status" "LabsCommercialDocumentStatus" NOT NULL DEFAULT 'ISSUED',
  "issuerName" VARCHAR(200) NOT NULL DEFAULT 'AIRASKILLCITY PRIVATE LIMITED',
  "issuerAddress" TEXT,
  "issuerGstin" VARCHAR(30),
  "customerName" VARCHAR(180) NOT NULL,
  "customerPhone" VARCHAR(40),
  "customerEmail" VARCHAR(255),
  "customerAddress" TEXT,
  "customerGstin" VARCHAR(30),
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
  "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
  "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "validUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LabsCommercialDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LabsCommercialDocument_number_key" ON "LabsCommercialDocument"("number");
CREATE INDEX "LabsCommercialDocument_type_status_createdAt_idx" ON "LabsCommercialDocument"("type", "status", "createdAt");
CREATE INDEX "LabsCommercialDocument_service_createdAt_idx" ON "LabsCommercialDocument"("service", "createdAt");
CREATE INDEX "LabsCommercialDocument_createdById_idx" ON "LabsCommercialDocument"("createdById");
ALTER TABLE "LabsCommercialDocument" ADD CONSTRAINT "LabsCommercialDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "key", "resource", "action", "description", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'labs.commercial.manage', 'labs.commercial', 'manage', 'Create and download AIRA Labs quotations and invoices.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "description" = EXCLUDED."description", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", 'GLOBAL'::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" role_record CROSS JOIN "Permission" permission_record
WHERE role_record."key" = 'CEO' AND permission_record."key" = 'labs.commercial.manage'
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

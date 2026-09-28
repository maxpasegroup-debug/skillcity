-- Phase 8 adds shared Core Documents, Compliance, and Finance metadata without rewriting legacy records.
CREATE TYPE "CoreDocumentCategory" AS ENUM ('IDENTITY', 'CONTRACT', 'AGREEMENT', 'CERTIFICATE', 'INVOICE', 'RECEIPT', 'APPLICATION_RECORD', 'PORTFOLIO', 'COMPLIANCE', 'POLICY', 'OTHER');
CREATE TYPE "CoreDocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'QUARANTINED');
CREATE TYPE "DocumentAccessPolicy" AS ENUM ('PRIVATE', 'OWNER', 'ORGANIZATION', 'AUTHORIZED_CONTEXT');
CREATE TYPE "DocumentContextType" AS ENUM ('EMPLOYEE', 'STUDENT', 'APPLICATION', 'INVOICE', 'COMPLIANCE', 'ORGANIZATION', 'CAREER_OPPORTUNITY', 'LABS_PRODUCT', 'PROGRAM', 'OTHER');
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'WAIVED', 'ARCHIVED');
CREATE TYPE "ComplianceSubjectType" AS ENUM ('ORGANIZATION', 'EMPLOYEE', 'STUDENT', 'EMPLOYER', 'PROGRAM', 'DOCUMENT', 'OTHER');

ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'OVERDUE';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'VOID';

CREATE TABLE "CoreDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(100) NOT NULL,
  "displayName" VARCHAR(220) NOT NULL,
  "category" "CoreDocumentCategory" NOT NULL,
  "status" "CoreDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  "accessPolicy" "DocumentAccessPolicy" NOT NULL DEFAULT 'PRIVATE',
  "ownerUserId" UUID,
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "createdById" UUID NOT NULL,
  "retentionUntil" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CoreDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoreDocumentVersion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "originalFilename" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(160) NOT NULL,
  "sizeBytes" INTEGER,
  "storageProvider" VARCHAR(80) NOT NULL,
  "storageKey" VARCHAR(700) NOT NULL,
  "checksum" VARCHAR(160),
  "uploadedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoreDocumentVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CoreDocumentVersion_version_check" CHECK ("version" > 0),
  CONSTRAINT "CoreDocumentVersion_sizeBytes_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" > 0)
);

CREATE TABLE "CoreDocumentContextLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "contextType" "DocumentContextType" NOT NULL,
  "contextId" VARCHAR(140) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoreDocumentContextLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComplianceRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(100) NOT NULL,
  "title" VARCHAR(220) NOT NULL,
  "description" TEXT,
  "subjectType" "ComplianceSubjectType" NOT NULL,
  "subjectId" VARCHAR(140),
  "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
  "institutionId" UUID NOT NULL,
  "divisionId" UUID,
  "districtId" UUID,
  "campusId" UUID,
  "departmentId" UUID,
  "responsibleEmployeeId" UUID,
  "reviewerEmployeeId" UUID,
  "effectiveAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "reviewAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "createdById" UUID NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceRecord_date_check" CHECK ("effectiveAt" IS NULL OR "expiresAt" IS NULL OR "expiresAt" > "effectiveAt")
);

CREATE TABLE "ComplianceDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "complianceRecordId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FeeInvoice"
  ADD COLUMN "institutionId" UUID,
  ADD COLUMN "divisionId" UUID,
  ADD COLUMN "districtId" UUID,
  ADD COLUMN "campusId" UUID,
  ADD COLUMN "departmentId" UUID,
  ADD COLUMN "createdById" UUID,
  ADD COLUMN "currency" VARCHAR(3),
  ADD COLUMN "reference" VARCHAR(180),
  ADD COLUMN "issuedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "PaymentTransaction"
  ADD COLUMN "recordedById" UUID,
  ADD COLUMN "verifiedById" UUID,
  ADD COLUMN "verifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CoreDocument_code_key" ON "CoreDocument"("code");
CREATE INDEX "CoreDocument_institutionId_status_idx" ON "CoreDocument"("institutionId", "status");
CREATE INDEX "CoreDocument_divisionId_idx" ON "CoreDocument"("divisionId");
CREATE INDEX "CoreDocument_districtId_idx" ON "CoreDocument"("districtId");
CREATE INDEX "CoreDocument_campusId_idx" ON "CoreDocument"("campusId");
CREATE INDEX "CoreDocument_departmentId_idx" ON "CoreDocument"("departmentId");
CREATE INDEX "CoreDocument_ownerUserId_status_idx" ON "CoreDocument"("ownerUserId", "status");
CREATE INDEX "CoreDocument_category_status_idx" ON "CoreDocument"("category", "status");
CREATE UNIQUE INDEX "CoreDocumentVersion_documentId_version_key" ON "CoreDocumentVersion"("documentId", "version");
CREATE INDEX "CoreDocumentVersion_documentId_createdAt_idx" ON "CoreDocumentVersion"("documentId", "createdAt");
CREATE INDEX "CoreDocumentVersion_storageProvider_idx" ON "CoreDocumentVersion"("storageProvider");
CREATE UNIQUE INDEX "CoreDocumentContextLink_documentId_contextType_contextId_key" ON "CoreDocumentContextLink"("documentId", "contextType", "contextId");
CREATE INDEX "CoreDocumentContextLink_contextType_contextId_idx" ON "CoreDocumentContextLink"("contextType", "contextId");
CREATE UNIQUE INDEX "ComplianceRecord_code_key" ON "ComplianceRecord"("code");
CREATE INDEX "ComplianceRecord_institutionId_status_idx" ON "ComplianceRecord"("institutionId", "status");
CREATE INDEX "ComplianceRecord_divisionId_idx" ON "ComplianceRecord"("divisionId");
CREATE INDEX "ComplianceRecord_districtId_idx" ON "ComplianceRecord"("districtId");
CREATE INDEX "ComplianceRecord_campusId_idx" ON "ComplianceRecord"("campusId");
CREATE INDEX "ComplianceRecord_departmentId_idx" ON "ComplianceRecord"("departmentId");
CREATE INDEX "ComplianceRecord_subjectType_subjectId_idx" ON "ComplianceRecord"("subjectType", "subjectId");
CREATE INDEX "ComplianceRecord_responsibleEmployeeId_status_idx" ON "ComplianceRecord"("responsibleEmployeeId", "status");
CREATE INDEX "ComplianceRecord_reviewerEmployeeId_status_idx" ON "ComplianceRecord"("reviewerEmployeeId", "status");
CREATE INDEX "ComplianceRecord_expiresAt_idx" ON "ComplianceRecord"("expiresAt");
CREATE INDEX "ComplianceRecord_reviewAt_idx" ON "ComplianceRecord"("reviewAt");
CREATE UNIQUE INDEX "ComplianceDocument_complianceRecordId_documentId_key" ON "ComplianceDocument"("complianceRecordId", "documentId");
CREATE INDEX "ComplianceDocument_documentId_idx" ON "ComplianceDocument"("documentId");
CREATE INDEX "FeeInvoice_institutionId_status_idx" ON "FeeInvoice"("institutionId", "status");
CREATE INDEX "FeeInvoice_divisionId_idx" ON "FeeInvoice"("divisionId");
CREATE INDEX "FeeInvoice_districtId_idx" ON "FeeInvoice"("districtId");
CREATE INDEX "FeeInvoice_campusId_idx" ON "FeeInvoice"("campusId");
CREATE INDEX "FeeInvoice_departmentId_idx" ON "FeeInvoice"("departmentId");
CREATE INDEX "FeeInvoice_currency_status_idx" ON "FeeInvoice"("currency", "status");
CREATE INDEX "PaymentTransaction_recordedById_idx" ON "PaymentTransaction"("recordedById");
CREATE INDEX "PaymentTransaction_verifiedById_idx" ON "PaymentTransaction"("verifiedById");

ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoreDocument" ADD CONSTRAINT "CoreDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoreDocumentVersion" ADD CONSTRAINT "CoreDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CoreDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoreDocumentVersion" ADD CONSTRAINT "CoreDocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoreDocumentContextLink" ADD CONSTRAINT "CoreDocumentContextLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CoreDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_reviewerEmployeeId_fkey" FOREIGN KEY ("reviewerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "ComplianceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CoreDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Role" ("id", "name", "key", "system", "description", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Records Manager', 'RECORDS_MANAGER', true, 'Scoped Core Documents manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Compliance Manager', 'COMPLIANCE_MANAGER', true, 'Scoped compliance operations manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Finance Manager', 'FINANCE_MANAGER', true, 'Scoped finance operations manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "key" = EXCLUDED."key", "system" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Permission" ("id", "key", "resource", "action", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'documents.read', 'documents', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'documents.manage', 'documents', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'compliance.read', 'compliance', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'compliance.manage', 'compliance', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'finance.read', 'finance', 'read', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'finance.invoice.manage', 'finance-invoice', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'finance.payment.manage', 'finance-payment', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", grant_record."scope"::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Admin', 'documents.read', 'GLOBAL'), ('Admin', 'documents.manage', 'GLOBAL'), ('Admin', 'compliance.read', 'GLOBAL'), ('Admin', 'compliance.manage', 'GLOBAL'), ('Admin', 'finance.read', 'GLOBAL'), ('Admin', 'finance.invoice.manage', 'GLOBAL'), ('Admin', 'finance.payment.manage', 'GLOBAL'),
  ('Director', 'documents.read', 'GLOBAL'), ('Director', 'documents.manage', 'GLOBAL'), ('Director', 'compliance.read', 'GLOBAL'), ('Director', 'compliance.manage', 'GLOBAL'), ('Director', 'finance.read', 'GLOBAL'), ('Director', 'finance.invoice.manage', 'GLOBAL'), ('Director', 'finance.payment.manage', 'GLOBAL'),
  ('CEO', 'documents.read', 'GLOBAL'), ('CEO', 'documents.manage', 'GLOBAL'), ('CEO', 'compliance.read', 'GLOBAL'), ('CEO', 'compliance.manage', 'GLOBAL'), ('CEO', 'finance.read', 'GLOBAL'), ('CEO', 'finance.invoice.manage', 'GLOBAL'), ('CEO', 'finance.payment.manage', 'GLOBAL'),
  ('COO', 'documents.read', 'GLOBAL'), ('COO', 'documents.manage', 'GLOBAL'), ('COO', 'compliance.read', 'GLOBAL'), ('COO', 'compliance.manage', 'GLOBAL'), ('COO', 'finance.read', 'GLOBAL'), ('COO', 'finance.invoice.manage', 'GLOBAL'), ('COO', 'finance.payment.manage', 'GLOBAL'),
  ('Records Manager', 'documents.read', 'ORGANIZATION'), ('Records Manager', 'documents.manage', 'ORGANIZATION'),
  ('Compliance Manager', 'documents.read', 'ORGANIZATION'), ('Compliance Manager', 'compliance.read', 'ORGANIZATION'), ('Compliance Manager', 'compliance.manage', 'ORGANIZATION'),
  ('Finance Manager', 'documents.read', 'ORGANIZATION'), ('Finance Manager', 'finance.read', 'ORGANIZATION'), ('Finance Manager', 'finance.invoice.manage', 'ORGANIZATION'), ('Finance Manager', 'finance.payment.manage', 'ORGANIZATION')
) AS grant_record("roleName", "permissionKey", "scope")
JOIN "Role" role_record ON role_record."name" = grant_record."roleName"
JOIN "Permission" permission_record ON permission_record."key" = grant_record."permissionKey"
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "scope" = EXCLUDED."scope", "updatedAt" = CURRENT_TIMESTAMP;

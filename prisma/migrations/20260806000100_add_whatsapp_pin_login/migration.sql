CREATE TYPE "StudentCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

CREATE TABLE "StudentLoginCredential" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "applicationId" UUID,
    "whatsapp" VARCHAR(40) NOT NULL,
    "pinHash" TEXT NOT NULL,
    "status" "StudentCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "temporary" BOOLEAN NOT NULL DEFAULT true,
    "mustResetPin" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "generatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLoginCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppMessageLog" (
    "id" UUID NOT NULL,
    "to" VARCHAR(40) NOT NULL,
    "template" VARCHAR(120) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" VARCHAR(80),
    "providerRef" VARCHAR(160),
    "applicationId" UUID,
    "userId" UUID,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessageLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentLoginCredential_whatsapp_key" ON "StudentLoginCredential"("whatsapp");
CREATE INDEX "StudentLoginCredential_userId_idx" ON "StudentLoginCredential"("userId");
CREATE INDEX "StudentLoginCredential_applicationId_idx" ON "StudentLoginCredential"("applicationId");
CREATE INDEX "StudentLoginCredential_status_expiresAt_idx" ON "StudentLoginCredential"("status", "expiresAt");
CREATE INDEX "StudentLoginCredential_generatedById_idx" ON "StudentLoginCredential"("generatedById");
CREATE INDEX "WhatsAppMessageLog_to_idx" ON "WhatsAppMessageLog"("to");
CREATE INDEX "WhatsAppMessageLog_status_idx" ON "WhatsAppMessageLog"("status");
CREATE INDEX "WhatsAppMessageLog_applicationId_idx" ON "WhatsAppMessageLog"("applicationId");
CREATE INDEX "WhatsAppMessageLog_userId_idx" ON "WhatsAppMessageLog"("userId");

ALTER TABLE "StudentLoginCredential" ADD CONSTRAINT "StudentLoginCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentLoginCredential" ADD CONSTRAINT "StudentLoginCredential_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentLoginCredential" ADD CONSTRAINT "StudentLoginCredential_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

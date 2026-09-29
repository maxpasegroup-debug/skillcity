-- Add an opaque public lookup credential without changing existing application rows.
ALTER TABLE "AdmissionApplication"
ADD COLUMN "publicLookupTokenHash" VARCHAR(64);

CREATE UNIQUE INDEX "AdmissionApplication_publicLookupTokenHash_key"
ON "AdmissionApplication"("publicLookupTokenHash");

-- Shared database-backed rate limiting for horizontally scaled deployments.
CREATE TABLE "RateLimitBucket" (
    "keyHash" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("keyHash")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- Refuse to add the financial uniqueness guarantee until existing conflicts are reviewed.
-- Run `npm run audit:payment-references` before deployment. This block never changes data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PaymentTransaction"
    WHERE "providerRef" IS NOT NULL
    GROUP BY "provider", "providerRef"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate payment provider references exist. Run audit:payment-references and resolve them before migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "PaymentTransaction_provider_providerRef_key"
ON "PaymentTransaction"("provider", "providerRef");

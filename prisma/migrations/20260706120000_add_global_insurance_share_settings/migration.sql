CREATE TABLE "InsuranceShareSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "allowedEmails" JSONB,
  "fieldPaths" JSONB,
  "expiresAt" TIMESTAMP(3),
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InsuranceShareSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "InsuranceShareSettings" (
  "id",
  "enabled",
  "allowedEmails",
  "fieldPaths",
  "updatedAt"
) VALUES (
  'default',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

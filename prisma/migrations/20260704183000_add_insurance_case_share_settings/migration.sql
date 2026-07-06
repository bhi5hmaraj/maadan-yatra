ALTER TABLE "InsuranceCase"
ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shareAllowedEmails" JSONB,
ADD COLUMN "shareFieldPaths" JSONB,
ADD COLUMN "shareUpdatedAt" TIMESTAMP(3),
ADD COLUMN "shareUpdatedByUserId" TEXT;

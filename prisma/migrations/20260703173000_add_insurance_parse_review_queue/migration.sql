CREATE TYPE "InsuranceParseJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

ALTER TABLE "InsuranceCase"
  ADD COLUMN "aiExtraction" JSONB,
  ADD COLUMN "confirmedExtraction" JSONB,
  ADD COLUMN "parseError" TEXT,
  ADD COLUMN "parsedAt" TIMESTAMP(3),
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "confirmedByUserId" TEXT;

CREATE TABLE "InsuranceParseJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "caseId" UUID NOT NULL,
  "status" "InsuranceParseJobStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InsuranceParseJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InsuranceParseJob_status_createdAt_idx" ON "InsuranceParseJob"("status", "createdAt");
CREATE INDEX "InsuranceParseJob_caseId_createdAt_idx" ON "InsuranceParseJob"("caseId", "createdAt");

ALTER TABLE "InsuranceParseJob"
  ADD CONSTRAINT "InsuranceParseJob_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "InsuranceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

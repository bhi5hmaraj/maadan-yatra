-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InsuranceCaseStatus" AS ENUM ('UPLOADED', 'PARSING', 'NEEDS_REVIEW', 'PARSE_FAILED', 'VERIFIED', 'FINALIZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InsuranceDocumentType" AS ENUM ('AADHAAR_FRONT', 'AADHAAR_BACK', 'PURCHASE_SLIP', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('EMPLOYEE', 'ADMIN', 'PROVIDER_LINK', 'SYSTEM');

-- CreateTable
CREATE TABLE "InsuranceCase" (
    "id" UUID NOT NULL,
    "status" "InsuranceCaseStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdByUserId" TEXT,
    "customerName" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceDocument" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "type" "InsuranceDocumentType" NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobDownloadUrl" TEXT,
    "blobPathname" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "etag" TEXT,
    "shareExternally" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "actorUserId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsuranceCase_status_updatedAt_idx" ON "InsuranceCase"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "InsuranceDocument_caseId_type_idx" ON "InsuranceDocument"("caseId", "type");

-- CreateIndex
CREATE INDEX "AuditEvent_caseId_createdAt_idx" ON "AuditEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "InsuranceDocument" ADD CONSTRAINT "InsuranceDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InsuranceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InsuranceCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

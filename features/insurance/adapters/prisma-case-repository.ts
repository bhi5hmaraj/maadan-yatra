import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma/client';
import type { CreateInsuranceUploadInput } from '../domain';
import type { InsuranceExtraction } from '../parser';
import type { InsuranceShareSettings } from '../share-view';

function documentCreateData(input: CreateInsuranceUploadInput['document']) {
  return {
    id: input.id,
    type: input.type,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    blobUrl: input.blob.url,
    blobDownloadUrl: input.blob.downloadUrl,
    blobPathname: input.blob.pathname,
    etag: input.blob.etag,
  };
}

function auditCreateData(
  input: CreateInsuranceUploadInput,
  action: 'insurance.case_uploaded' | 'insurance.document_uploaded'
) {
  return {
    actorType: 'EMPLOYEE' as const,
    actorUserId: input.createdByUserId,
    action,
    metadata: {
      documentType: input.document.type,
      fileName: input.document.fileName,
      mimeType: input.document.mimeType,
      sizeBytes: input.document.sizeBytes,
    },
  };
}

export async function insuranceCaseExists(caseId: string) {
  const existingCase = await prisma.insuranceCase.findUnique({
    where: { id: caseId },
    select: { id: true },
  });

  return Boolean(existingCase);
}

export async function createUploadedCase(input: CreateInsuranceUploadInput) {
  const createdCase = await prisma.insuranceCase.create({
    data: {
      id: input.caseId,
      customerName: input.customerName,
      notes: input.notes,
      createdByUserId: input.createdByUserId,
      documents: {
        create: documentCreateData(input.document),
      },
      auditEvents: {
        create: auditCreateData(input, 'insurance.case_uploaded'),
      },
    },
  });

  return {
    caseId: createdCase.id,
    documentId: input.document.id,
  };
}

export async function addUploadedDocumentToCase(input: CreateInsuranceUploadInput) {
  await prisma.insuranceCase.update({
    where: { id: input.caseId },
    data: {
      customerName: input.customerName,
      notes: input.notes,
      documents: {
        create: documentCreateData(input.document),
      },
      auditEvents: {
        create: auditCreateData(input, 'insurance.document_uploaded'),
      },
    },
  });

  return {
    caseId: input.caseId,
    documentId: input.document.id,
  };
}

export async function listInsuranceCases() {
  return prisma.insuranceCase.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
    take: 50,
    include: {
      parseJobs: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          id: true,
          status: true,
          attempts: true,
          error: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
      _count: {
        select: {
          auditEvents: true,
          documents: true,
          parseJobs: true,
        },
      },
    },
  });
}

export async function getInsuranceCaseForAdmin(caseId: string) {
  return prisma.insuranceCase.findUnique({
    where: {
      id: caseId,
    },
    include: {
      documents: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          type: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          blobDownloadUrl: true,
          blobPathname: true,
          createdAt: true,
        },
      },
      parseJobs: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          status: true,
          attempts: true,
          error: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
      auditEvents: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
        select: {
          id: true,
          actorType: true,
          actorUserId: true,
          action: true,
          metadata: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          auditEvents: true,
        },
      },
    },
  });
}

export async function getInsuranceCaseForShare(caseId: string) {
  return prisma.insuranceCase.findUnique({
    where: {
      id: caseId,
    },
    select: {
      id: true,
      status: true,
      customerName: true,
      confirmedExtraction: true,
      confirmedAt: true,
      shareEnabled: true,
      shareAllowedEmails: true,
      shareFieldPaths: true,
      updatedAt: true,
    },
  });
}

export async function updateInsuranceCaseShareSettings(input: {
  caseId: string;
  settings: InsuranceShareSettings;
  actorUserId?: string;
}) {
  return prisma.insuranceCase.update({
    where: {
      id: input.caseId,
    },
    data: {
      shareEnabled: input.settings.enabled,
      shareAllowedEmails: input.settings.allowedEmails as Prisma.InputJsonValue,
      shareFieldPaths: input.settings.fieldPaths as Prisma.InputJsonValue,
      shareUpdatedAt: new Date(),
      shareUpdatedByUserId: input.actorUserId,
      auditEvents: {
        create: {
          actorType: 'ADMIN',
          actorUserId: input.actorUserId,
          action: 'insurance.case_share_settings_updated',
          metadata: {
            enabled: input.settings.enabled,
            allowedEmailCount: input.settings.allowedEmails.length,
            fieldCount: input.settings.fieldPaths.length,
          },
        },
      },
    },
  });
}

export async function listInsuranceQueueItems() {
  return prisma.insuranceParseJob.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    include: {
      case: {
        select: {
          id: true,
          customerName: true,
          updatedAt: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      },
    },
  });
}

export async function enqueueInsuranceParseJob(caseId: string) {
  const existingCase = await prisma.insuranceCase.findUnique({
    where: {
      id: caseId,
    },
    select: {
      id: true,
    },
  });

  if (!existingCase) {
    return null;
  }

  const existingJob = await prisma.insuranceParseJob.findFirst({
    where: {
      caseId,
      status: {
        in: ['QUEUED', 'RUNNING'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existingJob) {
    return existingJob;
  }

  return prisma.insuranceParseJob.create({
    data: {
      caseId,
    },
  });
}

export async function claimNextInsuranceParseJob(jobId?: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.insuranceParseJob.findFirst({
      where: {
        ...(jobId ? { id: jobId } : {}),
        status: 'QUEUED',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!job) {
      return null;
    }

    const claimed = await tx.insuranceParseJob.updateMany({
      where: {
        id: job.id,
        status: 'QUEUED',
      },
      data: {
        status: 'RUNNING',
        attempts: {
          increment: 1,
        },
        startedAt: new Date(),
        error: null,
      },
    });

    if (claimed.count !== 1) {
      return null;
    }

    await tx.insuranceCase.update({
      where: {
        id: job.caseId,
      },
      data: {
        status: 'PARSING',
        parseError: null,
      },
    });

    return tx.insuranceParseJob.findUnique({
      where: {
        id: job.id,
      },
    });
  });
}

export async function completeInsuranceParseJob(input: {
  jobId: string;
  caseId: string;
  extraction: InsuranceExtraction;
}) {
  const now = new Date();

  const updatedCase = await prisma.insuranceCase.update({
    where: {
      id: input.caseId,
    },
    data: {
      status: 'NEEDS_REVIEW',
      aiExtraction: input.extraction as Prisma.InputJsonValue,
      parseError: null,
      parsedAt: now,
      auditEvents: {
        create: {
          actorType: 'SYSTEM',
          action: 'insurance.case_parsed',
          metadata: {
            jobId: input.jobId,
            missingFieldCount: input.extraction.missingFields.length,
          },
        },
      },
    },
  });

  await prisma.insuranceParseJob.update({
    where: {
      id: input.jobId,
    },
    data: {
      status: 'COMPLETE',
      completedAt: now,
      error: null,
    },
  });

  return updatedCase;
}

export async function failInsuranceParseJob(input: {
  jobId: string;
  caseId: string;
  error: string;
}) {
  const now = new Date();

  const updatedCase = await prisma.insuranceCase.update({
    where: {
      id: input.caseId,
    },
    data: {
      status: 'PARSE_FAILED',
      parseError: input.error,
      auditEvents: {
        create: {
          actorType: 'SYSTEM',
          action: 'insurance.case_parse_failed',
          metadata: {
            jobId: input.jobId,
            error: input.error,
          },
        },
      },
    },
  });

  await prisma.insuranceParseJob.update({
    where: {
      id: input.jobId,
    },
    data: {
      status: 'FAILED',
      completedAt: now,
      error: input.error,
    },
  });

  return updatedCase;
}

export async function confirmInsuranceCaseExtraction(input: {
  caseId: string;
  extraction: InsuranceExtraction;
  actorUserId?: string;
}) {
  return prisma.insuranceCase.update({
    where: {
      id: input.caseId,
    },
    data: {
      status: 'VERIFIED',
      confirmedExtraction: input.extraction as Prisma.InputJsonValue,
      confirmedAt: new Date(),
      confirmedByUserId: input.actorUserId,
      verifiedAt: new Date(),
      verifiedByUserId: input.actorUserId,
      auditEvents: {
        create: {
          actorType: 'ADMIN',
          actorUserId: input.actorUserId,
          action: 'insurance.case_confirmed',
          metadata: {
            missingFieldCount: input.extraction.missingFields.length,
          },
        },
      },
    },
  });
}

export async function getInsuranceCaseForParsing(caseId: string) {
  return prisma.insuranceCase.findUnique({
    where: {
      id: caseId,
    },
    include: {
      documents: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          type: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          blobDownloadUrl: true,
          blobPathname: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getInsuranceDocumentForDownload(documentId: string) {
  return prisma.insuranceDocument.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      caseId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      blobPathname: true,
      etag: true,
    },
  });
}

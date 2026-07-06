import type { Prisma } from '@/app/generated/prisma/client';

type InsuranceCaseListItem = Prisma.InsuranceCaseGetPayload<{
  include: {
    parseJobs: {
      select: {
        id: true;
        status: true;
        attempts: true;
        error: true;
        createdAt: true;
        startedAt: true;
        completedAt: true;
      };
    };
    _count: {
      select: {
        auditEvents: true;
        documents: true;
        parseJobs: true;
      };
    };
  };
}>;

type InsuranceCaseDetail = Prisma.InsuranceCaseGetPayload<{
  include: {
    documents: {
      select: {
        id: true;
        type: true;
        fileName: true;
        mimeType: true;
        sizeBytes: true;
        blobPathname: true;
        createdAt: true;
      };
    };
    parseJobs: {
      select: {
        id: true;
        status: true;
        attempts: true;
        error: true;
        createdAt: true;
        startedAt: true;
        completedAt: true;
      };
    };
    auditEvents: {
      select: {
        id: true;
        actorType: true;
        actorUserId: true;
        action: true;
        metadata: true;
        createdAt: true;
      };
    };
    _count: {
      select: {
        auditEvents: true;
      };
    };
  };
}>;

type InsuranceQueueItem = Prisma.InsuranceParseJobGetPayload<{
  include: {
    case: {
      select: {
        id: true;
        customerName: true;
        updatedAt: true;
        _count: {
          select: {
            documents: true;
          };
        };
      };
    };
  };
}>;

function serializeJob(job: {
  id: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}) {
  return {
    id: job.id,
    status: job.status,
    attempts: job.attempts,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function serializeCaseListItem(insuranceCase: InsuranceCaseListItem) {
  return {
    id: insuranceCase.id,
    status: insuranceCase.status,
    customerName: insuranceCase.customerName,
    notes: insuranceCase.notes,
    parseError: insuranceCase.parseError,
    parsedAt: insuranceCase.parsedAt?.toISOString() ?? null,
    confirmedAt: insuranceCase.confirmedAt?.toISOString() ?? null,
    shareEnabled: insuranceCase.shareEnabled,
    shareAllowedEmails: stringArray(insuranceCase.shareAllowedEmails),
    shareFieldPaths: stringArray(insuranceCase.shareFieldPaths),
    shareUpdatedAt: insuranceCase.shareUpdatedAt?.toISOString() ?? null,
    createdAt: insuranceCase.createdAt.toISOString(),
    updatedAt: insuranceCase.updatedAt.toISOString(),
    documentCount: insuranceCase._count.documents,
    auditEventCount: insuranceCase._count.auditEvents,
    parseJobCount: insuranceCase._count.parseJobs,
    latestParseJob: insuranceCase.parseJobs[0]
      ? serializeJob(insuranceCase.parseJobs[0])
      : null,
  };
}

export function serializeCaseDetail(insuranceCase: InsuranceCaseDetail) {
  return {
    ...serializeCaseListItem({
      ...insuranceCase,
      parseJobs: insuranceCase.parseJobs.slice(0, 1),
      _count: {
        ...insuranceCase._count,
        documents: insuranceCase.documents.length,
        parseJobs: insuranceCase.parseJobs.length,
      },
    }),
    aiExtraction: insuranceCase.aiExtraction,
    confirmedExtraction: insuranceCase.confirmedExtraction,
    parseJobs: insuranceCase.parseJobs.map(serializeJob),
    documents: insuranceCase.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      downloadUrl: `/api/insurance/documents/${document.id}/download`,
      blobPathname: document.blobPathname,
      createdAt: document.createdAt.toISOString(),
    })),
    auditEvents: insuranceCase.auditEvents.map((event) => ({
      id: event.id,
      actorType: event.actorType,
      actorUserId: event.actorUserId,
      action: event.action,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export function serializeQueueItem(item: InsuranceQueueItem) {
  return {
    ...serializeJob(item),
    case: {
      id: item.case.id,
      customerName: item.case.customerName,
      updatedAt: item.case.updatedAt.toISOString(),
      documentCount: item.case._count.documents,
    },
  };
}

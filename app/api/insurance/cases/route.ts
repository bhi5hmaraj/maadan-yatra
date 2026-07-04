import { NextResponse } from 'next/server';
import { listInsuranceCases } from '@/features/insurance/adapters/prisma-case-repository';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const traceId = getRequestTraceId(request);

  try {
    const cases = await listInsuranceCases();

    logger.info(
      {
        traceId,
        caseCount: cases.length,
      },
      'insurance_admin_cases_listed'
    );

    return NextResponse.json(
      {
        traceId,
        cases: cases.map((insuranceCase) => ({
          id: insuranceCase.id,
          status: insuranceCase.status,
          customerName: insuranceCase.customerName,
          notes: insuranceCase.notes,
          aiExtraction: insuranceCase.aiExtraction,
          confirmedExtraction: insuranceCase.confirmedExtraction,
          parseError: insuranceCase.parseError,
          parsedAt: insuranceCase.parsedAt?.toISOString() ?? null,
          confirmedAt: insuranceCase.confirmedAt?.toISOString() ?? null,
          createdAt: insuranceCase.createdAt.toISOString(),
          updatedAt: insuranceCase.updatedAt.toISOString(),
          documentCount: insuranceCase.documents.length,
          auditEventCount: insuranceCase._count.auditEvents,
          parseJobs: insuranceCase.parseJobs.map((job) => ({
            id: job.id,
            status: job.status,
            attempts: job.attempts,
            error: job.error,
            createdAt: job.createdAt.toISOString(),
            startedAt: job.startedAt?.toISOString() ?? null,
            completedAt: job.completedAt?.toISOString() ?? null,
          })),
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
        })),
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list insurance cases.';

    logger.error(
      {
        traceId,
        error: message,
      },
      'insurance_admin_cases_list_failed'
    );

    return NextResponse.json(
      {
        error: message,
        traceId,
      },
      {
        status: 500,
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  }
}

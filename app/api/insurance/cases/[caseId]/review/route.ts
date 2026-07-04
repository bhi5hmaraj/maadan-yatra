import { NextResponse } from 'next/server';
import { confirmInsuranceCaseExtraction } from '@/features/insurance/adapters/prisma-case-repository';
import { insuranceExtractionSchema } from '@/features/insurance/parser';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

function jsonError(message: string, status: number, traceId: string) {
  return NextResponse.json(
    {
      error: message,
      traceId,
    },
    {
      status,
      headers: {
        'x-trace-id': traceId,
      },
    }
  );
}

export async function PUT(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  const traceId = getRequestTraceId(request);

  try {
    const body = await request.json();
    const extraction = insuranceExtractionSchema.parse(body.extraction);

    const updatedCase = await confirmInsuranceCaseExtraction({
      caseId: params.caseId,
      extraction,
    });

    logger.info(
      {
        traceId,
        caseId: params.caseId,
        missingFieldCount: extraction.missingFields.length,
      },
      'insurance_case_review_confirmed'
    );

    return NextResponse.json(
      {
        traceId,
        caseId: updatedCase.id,
        status: updatedCase.status,
        confirmedAt: updatedCase.confirmedAt?.toISOString() ?? null,
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to confirm insurance case.';

    logger.error(
      {
        traceId,
        caseId: params.caseId,
        error: message,
      },
      'insurance_case_review_confirm_failed'
    );

    return jsonError(message, 400, traceId);
  }
}

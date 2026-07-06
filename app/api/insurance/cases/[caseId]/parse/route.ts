import { NextResponse } from 'next/server';
import { enqueueInsuranceParseJob } from '@/features/insurance/adapters/prisma-case-repository';
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const traceId = getRequestTraceId(request);
  const { caseId } = await params;

  try {
    const job = await enqueueInsuranceParseJob(caseId);

    if (!job) {
      logger.warn({ traceId, caseId }, 'insurance_parse_enqueue_case_not_found');
      return jsonError('Insurance case was not found.', 404, traceId);
    }

    logger.info(
      {
        traceId,
        caseId,
        jobId: job.id,
        jobStatus: job.status,
      },
      'insurance_parse_enqueued'
    );

    return NextResponse.json(
      {
        traceId,
        caseId,
        job: {
          id: job.id,
          status: job.status,
          attempts: job.attempts,
          error: job.error,
        },
      },
      {
        status: 202,
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to parse insurance case.';

    logger.error(
      {
        traceId,
        caseId,
        error: message,
      },
      'insurance_parse_enqueue_failed'
    );

    return jsonError(message, 500, traceId);
  }
}

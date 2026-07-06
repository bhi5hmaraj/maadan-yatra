import { NextResponse } from 'next/server';
import { processNextInsuranceParseJob } from '@/features/insurance/parse-job-runner';
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

export async function POST(request: Request) {
  const traceId = getRequestTraceId(request);
  const startedAt = Date.now();

  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.error({ traceId }, 'insurance_parse_job_missing_gemini_key');
      return jsonError('Missing GEMINI_API_KEY on the server.', 503, traceId);
    }

    const body = await request.json().catch(() => ({}));
    const jobId = typeof body.jobId === 'string' ? body.jobId : undefined;

    logger.info({ traceId, jobId }, 'insurance_parse_job_process_started');

    const result = await processNextInsuranceParseJob({
      jobId,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      onTiming: (event) => {
        logger.info(
          {
            traceId,
            ...event,
          },
          'insurance_parse_job_phase_timing'
        );
      },
    });

    logger.info(
      {
        traceId,
        jobId: result.job?.id ?? jobId,
        caseId: result.job?.caseId,
        processed: result.processed,
        durationMs: Date.now() - startedAt,
      },
      'insurance_parse_job_process_completed'
    );

    return NextResponse.json(
      {
        traceId,
        ...result,
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to process parse job.';

    logger.error(
      {
        traceId,
        durationMs: Date.now() - startedAt,
        error: message,
      },
      'insurance_parse_job_process_failed'
    );

    return jsonError(message, 500, traceId);
  }
}

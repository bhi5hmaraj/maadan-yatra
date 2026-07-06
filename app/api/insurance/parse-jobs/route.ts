import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/features/auth/admin';
import { listInsuranceQueueItems } from '@/features/insurance/adapters/prisma-case-repository';
import { serializeQueueItem } from '@/features/insurance/admin-api';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const traceId = getRequestTraceId(request);
  const startedAt = Date.now();
  const admin = await requireAdminApiUser(traceId);

  if (admin.response) {
    return admin.response;
  }

  try {
    const jobs = await listInsuranceQueueItems();

    logger.info(
      {
        traceId,
        jobCount: jobs.length,
        durationMs: Date.now() - startedAt,
      },
      'insurance_parse_jobs_listed'
    );

    return NextResponse.json(
      {
        traceId,
        jobs: jobs.map(serializeQueueItem),
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list insurance parse jobs.';

    logger.error(
      {
        traceId,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_parse_jobs_list_failed'
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

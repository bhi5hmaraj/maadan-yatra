import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/features/auth/admin';
import { getInsuranceCaseForAdmin } from '@/features/insurance/adapters/prisma-case-repository';
import { serializeCaseDetail } from '@/features/insurance/admin-api';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const traceId = getRequestTraceId(request);
  const startedAt = Date.now();
  const { caseId } = await params;
  const admin = await requireAdminApiUser(traceId);

  if (admin.response) {
    return admin.response;
  }

  try {
    const insuranceCase = await getInsuranceCaseForAdmin(caseId);

    if (!insuranceCase) {
      logger.warn(
        { traceId, caseId, durationMs: Date.now() - startedAt },
        'insurance_admin_case_not_found'
      );
      return NextResponse.json(
        {
          error: 'Insurance case was not found.',
          traceId,
        },
        {
          status: 404,
          headers: {
            'x-trace-id': traceId,
          },
        }
      );
    }

    logger.info(
      {
        traceId,
        caseId,
        durationMs: Date.now() - startedAt,
      },
      'insurance_admin_case_loaded'
    );

    return NextResponse.json(
      {
        traceId,
        case: serializeCaseDetail(insuranceCase),
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load insurance case.';

    logger.error(
      {
        traceId,
        caseId,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_admin_case_load_failed'
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

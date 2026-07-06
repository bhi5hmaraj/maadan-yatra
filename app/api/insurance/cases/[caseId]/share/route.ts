import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiUser } from '@/features/auth/admin';
import { updateInsuranceCaseShareEnabled } from '@/features/insurance/adapters/prisma-case-repository';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

const shareToggleSchema = z.object({
  enabled: z.boolean(),
});

function jsonError(message: string, status: number, traceId: string) {
  return NextResponse.json(
    { error: message, traceId },
    { status, headers: { 'x-trace-id': traceId } }
  );
}

export async function PUT(
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
    const body = await request.json();
    const { enabled } = shareToggleSchema.parse(body);
    const updatedCase = await updateInsuranceCaseShareEnabled({
      caseId,
      enabled,
      actorUserId: admin.user?.userId,
    });

    logger.info(
      {
        traceId,
        caseId,
        enabled,
        durationMs: Date.now() - startedAt,
      },
      'insurance_case_share_toggle_updated'
    );

    return NextResponse.json(
      {
        traceId,
        caseId: updatedCase.id,
        shareEnabled: updatedCase.shareEnabled,
        shareUpdatedAt: updatedCase.shareUpdatedAt?.toISOString() ?? null,
      },
      {
        headers: {
          'x-trace-id': traceId,
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update case sharing.';

    logger.error(
      {
        traceId,
        caseId,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_case_share_toggle_update_failed'
    );

    return jsonError(message, 400, traceId);
  }
}

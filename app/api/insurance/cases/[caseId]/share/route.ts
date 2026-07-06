import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/features/auth/admin';
import { updateInsuranceCaseShareSettings } from '@/features/insurance/adapters/prisma-case-repository';
import {
  insuranceShareSettingsSchema,
  normalizeInsuranceShareSettings,
} from '@/features/insurance/share-view';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

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
    const settings = normalizeInsuranceShareSettings(
      insuranceShareSettingsSchema.parse(body)
    );

    const updatedCase = await updateInsuranceCaseShareSettings({
      caseId,
      settings,
      actorUserId: admin.user?.userId,
    });

    logger.info(
      {
        traceId,
        caseId,
        enabled: settings.enabled,
        allowedEmailCount: settings.allowedEmails.length,
        fieldCount: settings.fieldPaths.length,
        durationMs: Date.now() - startedAt,
      },
      'insurance_case_share_settings_updated'
    );

    return NextResponse.json(
      {
        traceId,
        caseId: updatedCase.id,
        shareEnabled: updatedCase.shareEnabled,
        shareAllowedEmails: settings.allowedEmails,
        shareFieldPaths: settings.fieldPaths,
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
      error instanceof Error ? error.message : 'Failed to update share settings.';

    logger.error(
      {
        traceId,
        caseId,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_case_share_settings_update_failed'
    );

    return jsonError(message, 400, traceId);
  }
}

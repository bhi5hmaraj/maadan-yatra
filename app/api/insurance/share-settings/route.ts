import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/features/auth/admin';
import {
  getInsuranceShareSettings,
  listInsuranceCasesForShare,
  updateInsuranceShareSettings,
} from '@/features/insurance/adapters/prisma-case-repository';
import {
  getInsuranceShareRows,
  insuranceShareSettingsSchema,
  normalizeInsuranceShareSettings,
  parseConfirmedInsuranceExtraction,
} from '@/features/insurance/share-view';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

function jsonError(message: string, status: number, traceId: string) {
  return NextResponse.json(
    { error: message, traceId },
    { status, headers: { 'x-trace-id': traceId } }
  );
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function serializeShareSettings(settings: Awaited<ReturnType<typeof getInsuranceShareSettings>>) {
  return {
    enabled: settings.enabled,
    allowedEmails: stringArray(settings.allowedEmails),
    fieldPaths: stringArray(settings.fieldPaths),
    expiresAt: settings.expiresAt?.toISOString() ?? null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

async function getSharePreview(fieldPaths: string[]) {
  const sharedCases = await listInsuranceCasesForShare();

  return sharedCases
    .map((insuranceCase) => {
      const confirmed = parseConfirmedInsuranceExtraction(
        insuranceCase.confirmedExtraction
      );

      if (!confirmed.success) return null;

      return {
        id: insuranceCase.id,
        customerName: insuranceCase.customerName,
        status: insuranceCase.status,
        confirmedAt: insuranceCase.confirmedAt?.toISOString() ?? null,
        updatedAt: insuranceCase.updatedAt.toISOString(),
        rows: getInsuranceShareRows(confirmed.data, fieldPaths),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function GET(request: Request) {
  const traceId = getRequestTraceId(request);
  const admin = await requireAdminApiUser(traceId);

  if (admin.response) {
    return admin.response;
  }

  const settings = await getInsuranceShareSettings();
  const serializedSettings = serializeShareSettings(settings);
  const sharedCases = await getSharePreview(serializedSettings.fieldPaths);

  return NextResponse.json(
    {
      traceId,
      settings: serializedSettings,
      preview: {
        sharedCases,
      },
    },
    {
      headers: {
        'x-trace-id': traceId,
      },
    }
  );
}

export async function PUT(request: Request) {
  const traceId = getRequestTraceId(request);
  const startedAt = Date.now();
  const admin = await requireAdminApiUser(traceId);

  if (admin.response) {
    return admin.response;
  }

  try {
    const body = await request.json();
    const settings = normalizeInsuranceShareSettings(
      insuranceShareSettingsSchema.parse(body)
    );
    const updatedSettings = await updateInsuranceShareSettings({
      settings,
      actorUserId: admin.user?.userId,
    });
    const serializedSettings = serializeShareSettings(updatedSettings);
    const sharedCases = await getSharePreview(serializedSettings.fieldPaths);

    logger.info(
      {
        traceId,
        enabled: settings.enabled,
        allowedEmailCount: settings.allowedEmails.length,
        fieldCount: settings.fieldPaths.length,
        expiresAt: settings.expiresAt,
        durationMs: Date.now() - startedAt,
      },
      'insurance_share_settings_updated'
    );

    return NextResponse.json(
      {
        traceId,
        settings: serializedSettings,
        preview: {
          sharedCases,
        },
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
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_share_settings_update_failed'
    );

    return jsonError(message, 400, traceId);
  }
}

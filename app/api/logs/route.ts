import { NextResponse } from 'next/server';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

const logLevels = new Set(['debug', 'info', 'warn', 'error']);

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const traceId = getRequestTraceId(request);

  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);

    if (contentLength > 16_384) {
      logger.warn({ traceId, source: 'frontend', contentLength }, 'frontend_log_rejected');
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const body = asRecord(await request.json());
    const level = typeof body.level === 'string' && logLevels.has(body.level)
      ? body.level
      : 'info';
    const event = typeof body.event === 'string' ? body.event.slice(0, 120) : 'frontend_event';

    logger[level as 'debug' | 'info' | 'warn' | 'error'](
      {
        traceId,
        source: 'frontend',
        page: typeof body.page === 'string' ? body.page : undefined,
        data: asRecord(body.data),
      },
      event
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.warn(
      {
        traceId,
        source: 'frontend',
        error: error instanceof Error ? error.message : 'Invalid frontend log payload',
      },
      'frontend_log_failed'
    );

    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

'use client';

type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

const traceStorageKey = 'maadan-yatra.insurance.traceId';

export function getClientTraceId() {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  const existingTraceId = window.sessionStorage.getItem(traceStorageKey);

  if (existingTraceId) {
    return existingTraceId;
  }

  const traceId = crypto.randomUUID();
  window.sessionStorage.setItem(traceStorageKey, traceId);
  return traceId;
}

export function resetClientTraceId() {
  const traceId = crypto.randomUUID();
  window.sessionStorage.setItem(traceStorageKey, traceId);
  return traceId;
}

export function logClientEvent(
  event: string,
  data: Record<string, unknown> = {},
  level: ClientLogLevel = 'info'
) {
  const payload = {
    source: 'frontend',
    level,
    event,
    traceId: getClientTraceId(),
    page: window.location.pathname,
    data,
  };

  if (process.env.NODE_ENV !== 'production') {
    console[level === 'debug' ? 'debug' : level]('[trace]', payload);
  }

  void fetch('/api/logs', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-trace-id': payload.traceId,
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Logging should never block the intake flow.
  });
}


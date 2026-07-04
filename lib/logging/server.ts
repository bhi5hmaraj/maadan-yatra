import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';

type LoggerGlobal = typeof globalThis & {
  __maadanYatraLogger?: pino.Logger;
};

function createLogger() {
  const level =
    process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  const options: pino.LoggerOptions = {
    level,
    base: {
      service: 'maadan-yatra',
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'headers.authorization',
        'authorization',
        '*.authorization',
        '*.token',
        '*.secret',
        '*.password',
        'DATABASE_URL',
        'BLOB_READ_WRITE_TOKEN',
      ],
      censor: '[redacted]',
    },
  };

  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'false') {
    return pino(options);
  }

  const logDir = path.join(process.cwd(), '.logs');
  fs.mkdirSync(logDir, { recursive: true });

  return pino(
    options,
    pino.multistream([
      { stream: process.stdout },
      { stream: pino.destination({ dest: path.join(logDir, 'app.ndjson'), sync: false }) },
    ])
  );
}

const globalForLogger = globalThis as LoggerGlobal;

export const logger = globalForLogger.__maadanYatraLogger ?? createLogger();

if (process.env.NODE_ENV !== 'production') {
  globalForLogger.__maadanYatraLogger = logger;
}

export function getRequestTraceId(request: Request) {
  return request.headers.get('x-trace-id') || crypto.randomUUID();
}


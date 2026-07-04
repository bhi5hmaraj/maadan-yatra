import { get, put } from '@vercel/blob';
import type { StoredInsuranceObject } from '../domain';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableBlobReadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause instanceof Error
    ? error.cause.message
    : '';

  return /ECONNRESET|terminated|fetch failed|network|timeout/i.test(`${message} ${cause}`);
}

async function streamToBytes(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    byteLength += value.byteLength;
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

export async function putPrivateInsuranceObject(input: {
  pathname: string;
  body: File;
  contentType: string;
  maximumSizeInBytes: number;
}): Promise<StoredInsuranceObject> {
  const blob = await put(input.pathname, input.body, {
    access: 'private',
    addRandomSuffix: true,
    contentType: input.contentType,
    maximumSizeInBytes: input.maximumSizeInBytes,
  });

  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    pathname: blob.pathname,
    etag: blob.etag,
    contentType: blob.contentType,
  };
}

export async function readPrivateInsuranceObject(input: {
  pathname: string;
  maxAttempts?: number;
}): Promise<{
  bytes: Uint8Array;
  contentType?: string | null;
  size?: number | null;
}> {
  const maxAttempts = input.maxAttempts ?? 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const blob = await get(input.pathname, {
        access: 'private',
      });

      if (!blob?.stream) {
        throw new Error(`Stored blob not found: ${input.pathname}`);
      }

      return {
        bytes: await streamToBytes(blob.stream),
        contentType: blob.blob.contentType,
        size: blob.blob.size,
      };
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryableBlobReadError(error)) {
        break;
      }

      await sleep(250 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to read private insurance object.');
}

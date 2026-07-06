import { requireAdminApiUser } from '@/features/auth/admin';
import { getInsuranceDocumentForDownload } from '@/features/insurance/adapters/prisma-case-repository';
import { readPrivateInsuranceObject } from '@/features/insurance/adapters/vercel-blob-storage';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

function encodeRfc5987(value: string) {
  return encodeURIComponent(value)
    .replace(/['()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

function contentDisposition(fileName: string) {
  const fallbackFileName = fileName
    .replace(/[\r\n"]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
    .trim() || 'document';

  return `inline; filename="${fallbackFileName}"; filename*=UTF-8''${encodeRfc5987(fileName)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const traceId = getRequestTraceId(request);
  const startedAt = Date.now();
  const { documentId } = await params;
  const admin = await requireAdminApiUser(traceId);

  if (admin.response) {
    return admin.response;
  }

  try {
    const document = await getInsuranceDocumentForDownload(documentId);

    if (!document) {
      logger.warn(
        { traceId, documentId },
        'insurance_document_download_not_found'
      );

      return Response.json(
        { error: 'Insurance document was not found.', traceId },
        { status: 404, headers: { 'x-trace-id': traceId } }
      );
    }

    const blobReadStartedAt = Date.now();
    const blob = await readPrivateInsuranceObject({
      pathname: document.blobPathname,
    });
    const blobReadDurationMs = Date.now() - blobReadStartedAt;

    if (blob.bytes.byteLength === 0) {
      logger.warn(
        {
          traceId,
          caseId: document.caseId,
          documentId: document.id,
          blobPathname: document.blobPathname,
          durationMs: Date.now() - startedAt,
          blobReadDurationMs,
        },
        'insurance_document_blob_not_found'
      );

      return Response.json(
        { error: 'Stored document was not found.', traceId },
        { status: 404, headers: { 'x-trace-id': traceId } }
      );
    }

    logger.info(
      {
        traceId,
        caseId: document.caseId,
        documentId: document.id,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        bytesRead: blob.bytes.byteLength,
        durationMs: Date.now() - startedAt,
        blobReadDurationMs,
      },
      'insurance_document_downloaded'
    );

    const responseBody = blob.bytes.buffer.slice(
      blob.bytes.byteOffset,
      blob.bytes.byteOffset + blob.bytes.byteLength
    ) as ArrayBuffer;

    return new Response(responseBody, {
      headers: {
        'content-type': document.mimeType,
        'content-length': String(blob.bytes.byteLength),
        'content-disposition': contentDisposition(document.fileName),
        'cache-control': 'private, max-age=60',
        'x-trace-id': traceId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to download insurance document.';

    logger.error(
      {
        traceId,
        documentId,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      'insurance_document_download_failed'
    );

    return Response.json(
      { error: message, traceId },
      { status: 500, headers: { 'x-trace-id': traceId } }
    );
  }
}

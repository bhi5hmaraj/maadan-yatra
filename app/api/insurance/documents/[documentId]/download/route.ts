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
  { params }: { params: { documentId: string } }
) {
  const traceId = getRequestTraceId(request);

  try {
    const document = await getInsuranceDocumentForDownload(params.documentId);

    if (!document) {
      logger.warn(
        { traceId, documentId: params.documentId },
        'insurance_document_download_not_found'
      );

      return Response.json(
        { error: 'Insurance document was not found.', traceId },
        { status: 404, headers: { 'x-trace-id': traceId } }
      );
    }

    const blob = await readPrivateInsuranceObject({
      pathname: document.blobPathname,
    });

    if (blob.bytes.byteLength === 0) {
      logger.warn(
        {
          traceId,
          caseId: document.caseId,
          documentId: document.id,
          blobPathname: document.blobPathname,
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
        documentId: params.documentId,
        error: message,
      },
      'insurance_document_download_failed'
    );

    return Response.json(
      { error: message, traceId },
      { status: 500, headers: { 'x-trace-id': traceId } }
    );
  }
}

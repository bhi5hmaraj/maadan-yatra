import { NextResponse } from 'next/server';
import {
  allowedInsuranceUploadMimeTypes,
  buildInsuranceBlobPath,
  isInsuranceDocumentType,
  maxServerUploadBytes,
  sanitizeFileName,
} from '@/features/insurance/domain';
import {
  addUploadedDocumentToCase,
  createUploadedCase,
  insuranceCaseExists,
} from '@/features/insurance/adapters/prisma-case-repository';
import { putPrivateInsuranceObject } from '@/features/insurance/adapters/vercel-blob-storage';
import { getRequestTraceId, logger } from '@/lib/logging/server';

export const runtime = 'nodejs';

function optionalFormString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function hasBlobCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );
}

function jsonError(message: string, status: number, traceId: string) {
  return NextResponse.json({ error: message, traceId }, { status, headers: { 'x-trace-id': traceId } });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const traceId = getRequestTraceId(request);
  const requestStartedAt = Date.now();

  try {
    if (!process.env.DATABASE_URL) {
      logger.error({ traceId }, 'insurance_upload_missing_database_url');
      return jsonError('Missing DATABASE_URL on the server.', 503, traceId);
    }

    if (!hasBlobCredentials()) {
      logger.error({ traceId }, 'insurance_upload_missing_blob_credentials');
      return jsonError(
        'Missing Vercel Blob credentials on the server.',
        503,
        traceId
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const requestedCaseId = optionalFormString(formData.get('caseId'));
    const rawDocumentType = optionalFormString(formData.get('documentType'));

    if (!(file instanceof File)) {
      logger.warn({ traceId }, 'insurance_upload_missing_file');
      return jsonError('Document file is required.', 400, traceId);
    }

    if (!rawDocumentType || !isInsuranceDocumentType(rawDocumentType)) {
      logger.warn({ traceId, documentType: rawDocumentType }, 'insurance_upload_invalid_document_type');
      return jsonError('Valid document type is required.', 400, traceId);
    }

    const documentType = rawDocumentType;

    if (!allowedInsuranceUploadMimeTypes.includes(file.type)) {
      logger.warn({ traceId, mimeType: file.type }, 'insurance_upload_unsupported_mime_type');
      return jsonError('Only PDF, JPEG, PNG, WebP, HEIC, and HEIF files are supported.', 400, traceId);
    }

    if (file.size > maxServerUploadBytes) {
      logger.warn({ traceId, sizeBytes: file.size }, 'insurance_upload_file_too_large');
      return jsonError('Document must be 10 MB or smaller for this upload path.', 413, traceId);
    }

    if (requestedCaseId && !isUuid(requestedCaseId)) {
      logger.warn({ traceId }, 'insurance_upload_invalid_case_id');
      return jsonError('Valid case ID is required.', 400, traceId);
    }

    if (requestedCaseId && !(await insuranceCaseExists(requestedCaseId))) {
      logger.warn({ traceId, caseId: requestedCaseId }, 'insurance_upload_case_not_found');
      return jsonError('Insurance case was not found.', 404, traceId);
    }

    const caseId = requestedCaseId ?? crypto.randomUUID();
    const documentId = crypto.randomUUID();
    const fileName = sanitizeFileName(file.name);
    const pathname = buildInsuranceBlobPath({
      caseId,
      documentType,
      fileName,
    });

    logger.info(
      {
        traceId,
        caseId,
        documentId,
        documentType,
        mimeType: file.type,
        sizeBytes: file.size,
        isNewCase: !requestedCaseId,
      },
      'insurance_upload_started'
    );

    const blob = await putPrivateInsuranceObject({
      pathname,
      body: file,
      contentType: file.type,
      maximumSizeInBytes: maxServerUploadBytes,
    });

    logger.info(
      {
        traceId,
        caseId,
        documentId,
        blobPathname: blob.pathname,
        blobContentType: blob.contentType,
      },
      'insurance_blob_uploaded'
    );

    const uploadInput = {
      caseId,
      customerName: optionalFormString(formData.get('customerName')),
      notes: optionalFormString(formData.get('notes')),
      document: {
        id: documentId,
        type: documentType,
        fileName,
        mimeType: file.type,
        sizeBytes: file.size,
        blob,
      },
    };
    const result = requestedCaseId
      ? await addUploadedDocumentToCase(uploadInput)
      : await createUploadedCase(uploadInput);

    logger.info(
      {
        traceId,
        caseId: result.caseId,
        documentId: result.documentId,
        durationMs: Date.now() - requestStartedAt,
      },
      'insurance_upload_completed'
    );

    return NextResponse.json({
      caseId: result.caseId,
      documentId: result.documentId,
      traceId,
      createdCase: !requestedCaseId,
      status: 'UPLOADED',
      document: {
        type: documentType,
        fileName,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    }, { headers: { 'x-trace-id': traceId } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload insurance document.';

    logger.error(
      {
        traceId,
        durationMs: Date.now() - requestStartedAt,
        error: message,
      },
      'insurance_upload_failed'
    );

    return jsonError(message, 500, traceId);
  }
}

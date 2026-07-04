export const insuranceDocumentTypes = [
  'AADHAAR_FRONT',
  'AADHAAR_BACK',
  'PURCHASE_SLIP',
  'OTHER',
] as const;

export type InsuranceDocumentType = (typeof insuranceDocumentTypes)[number];

export const insurancePhotoUploadMimeTypes: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const allowedInsuranceUploadMimeTypes: readonly string[] = [
  ...insurancePhotoUploadMimeTypes,
  'application/pdf',
] as const;

export const maxServerUploadBytes = 10 * 1024 * 1024;

export function isInsuranceDocumentType(
  value: string | null
): value is InsuranceDocumentType {
  return insuranceDocumentTypes.includes(value as InsuranceDocumentType);
}

export function sanitizeFileName(fileName: string): string {
  const safeName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ');

  return safeName || 'document';
}

export interface StoredInsuranceObject {
  url: string;
  downloadUrl?: string;
  pathname: string;
  etag?: string;
  contentType?: string;
}

export interface CreateInsuranceUploadInput {
  caseId: string;
  customerName?: string;
  notes?: string;
  createdByUserId?: string;
  document: {
    id: string;
    type: InsuranceDocumentType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    blob: StoredInsuranceObject;
  };
}

export function buildInsuranceBlobPath(input: {
  caseId: string;
  documentType: InsuranceDocumentType;
  fileName: string;
}): string {
  return [
    'insurance',
    input.caseId,
    input.documentType.toLowerCase().replaceAll('_', '-'),
    sanitizeFileName(input.fileName),
  ].join('/');
}

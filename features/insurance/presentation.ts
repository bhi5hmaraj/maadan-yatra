import type { InsuranceDocumentType } from './domain';

export const insuranceDocumentLabels: Record<InsuranceDocumentType, string> = {
  AADHAAR_FRONT: 'Aadhaar front',
  AADHAAR_BACK: 'Aadhaar back',
  PURCHASE_SLIP: 'Purchase slip',
  OTHER: 'Other',
};

export const insuranceCaseStatusColors: Record<string, string> = {
  UPLOADED: 'blue',
  PARSING: 'gold',
  NEEDS_REVIEW: 'purple',
  PARSE_FAILED: 'red',
  VERIFIED: 'green',
  FINALIZED: 'cyan',
  REJECTED: 'default',
};

export const insuranceParseJobStatusColors: Record<string, string> = {
  QUEUED: 'blue',
  RUNNING: 'gold',
  COMPLETE: 'green',
  FAILED: 'red',
};

export function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

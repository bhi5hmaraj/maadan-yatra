import type { InsuranceDocumentType } from '@/features/insurance/domain';

export interface UploadResult {
  caseId: string;
  documentId: string;
  createdCase: boolean;
  document: {
    type: InsuranceDocumentType;
    fileName: string;
    sizeBytes: number;
  };
}

export interface UploadedDocument {
  documentId: string;
  type: InsuranceDocumentType;
  fileName: string;
  sizeBytes: number;
}

export interface DraftDocument {
  id: string;
  file: File;
  type: InsuranceDocumentType;
}

export interface UploadProgressState {
  current: number;
  total: number;
  fileName: string;
  percent: number;
}

export interface UploadFormValues {
  customerName?: string;
  notes?: string;
}

export type Language = 'en' | 'ta';
export type UploadMode = 'camera' | 'library';

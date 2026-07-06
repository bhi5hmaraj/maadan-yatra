import type { InsuranceDocumentType } from '@/features/insurance/domain';
import type { InsuranceExtraction } from '@/features/insurance/parser';

export interface AdminDocument {
  id: string;
  type: InsuranceDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl?: string | null;
  blobPathname: string;
  createdAt: string;
}

export interface AdminParseJob {
  id: string;
  status: string;
  attempts: number;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface AdminAuditEvent {
  id: string;
  actorType: string;
  actorUserId?: string | null;
  action: string;
  metadata?: unknown;
  createdAt: string;
}

export interface AdminCaseListItem {
  id: string;
  status: string;
  customerName?: string | null;
  notes?: string | null;
  parseError?: string | null;
  parsedAt?: string | null;
  confirmedAt?: string | null;
  shareEnabled: boolean;
  shareUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  auditEventCount: number;
  parseJobCount: number;
  latestParseJob?: AdminParseJob | null;
}

export interface AdminCase extends AdminCaseListItem {
  aiExtraction?: InsuranceExtraction | null;
  confirmedExtraction?: InsuranceExtraction | null;
  parseJobs: AdminParseJob[];
  documents: AdminDocument[];
  auditEvents: AdminAuditEvent[];
}

export interface AdminQueueItem extends AdminParseJob {
  case: {
    id: string;
    customerName?: string | null;
    updatedAt: string;
    documentCount: number;
  };
}

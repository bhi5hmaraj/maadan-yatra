import { z } from 'zod';
import { partyRefSchema, sourceTypeSchema } from '@/schemas/common';

export const vendorDocumentSchema = z.object({
  id: z.string(),
  vendor: partyRefSchema.optional(),
  sourceType: sourceTypeSchema.default('pdf'),
  fileName: z.string(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  checksum: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  rawText: z.string().optional(),
  uploadedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type VendorDocument = z.infer<typeof vendorDocumentSchema>;

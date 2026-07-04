import { z } from 'zod';
import type { InsuranceDocumentType } from './domain';

export const insuranceExtractionSchema = z.object({
  applicant: z.object({
    fullName: z.string().nullable(),
    aadhaarNumber: z.string().nullable(),
    aadhaarLast4: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    address: z.string().nullable(),
  }),
  purchase: z.object({
    merchantName: z.string().nullable(),
    merchantGstin: z.string().nullable(),
    invoiceNumber: z.string().nullable(),
    invoiceDate: z.string().nullable(),
    itemDescription: z.string().nullable(),
    itemCategory: z.string().nullable(),
    serialNumberOrImei: z.string().nullable(),
    purchaseAmount: z.number().nullable(),
    currency: z.string().nullable(),
  }),
  missingFields: z.array(z.string()),
  confidenceSummary: z.record(z.string(), z.string()),
  notes: z.string().nullable(),
});

export type InsuranceExtraction = z.infer<typeof insuranceExtractionSchema>;

export const insuranceExtractionFormGroups = [
  {
    key: 'applicant',
    label: 'Applicant',
    fields: [
      ['fullName', 'Full name', 'text'],
      ['aadhaarNumber', 'Aadhaar number', 'text'],
      ['aadhaarLast4', 'Aadhaar last 4', 'text'],
      ['dateOfBirth', 'Date of birth', 'text'],
      ['phoneNumber', 'Phone number', 'text'],
      ['address', 'Address', 'text'],
    ],
  },
  {
    key: 'purchase',
    label: 'Purchase',
    fields: [
      ['merchantName', 'Merchant name', 'text'],
      ['merchantGstin', 'Merchant GSTIN', 'text'],
      ['invoiceNumber', 'Invoice number', 'text'],
      ['invoiceDate', 'Invoice date', 'text'],
      ['itemDescription', 'Item description', 'text'],
      ['itemCategory', 'Item category', 'text'],
      ['serialNumberOrImei', 'Serial / IMEI', 'text'],
      ['purchaseAmount', 'Purchase amount', 'number'],
      ['currency', 'Currency', 'text'],
    ],
  },
] as const;

export function insuranceExtractionToFormValues(
  extraction?: InsuranceExtraction | null
) {
  return {
    ...(extraction ?? {}),
    missingFieldsText: extraction?.missingFields.join(', ') ?? '',
  };
}

function nullableText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function insuranceExtractionFromFormValues(
  values: Record<string, any>,
  previousExtraction?: InsuranceExtraction | null
): InsuranceExtraction {
  const extraction: Record<string, any> = {
    missingFields:
      typeof values.missingFieldsText === 'string'
        ? values.missingFieldsText
            .split(',')
            .map((field: string) => field.trim())
            .filter(Boolean)
        : [],
    confidenceSummary: previousExtraction?.confidenceSummary ?? {},
    notes: nullableText(values.notes),
  };

  for (const group of insuranceExtractionFormGroups) {
    extraction[group.key] = {};

    for (const [fieldKey, , inputType] of group.fields) {
      const value = values[group.key]?.[fieldKey];
      extraction[group.key][fieldKey] =
        inputType === 'number' && typeof value === 'number'
          ? value
          : inputType === 'number'
            ? null
            : nullableText(value);
    }
  }

  return insuranceExtractionSchema.parse(extraction);
}

export interface InsuranceParserDocument {
  id: string;
  type: InsuranceDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobPathname: string;
}

export interface InsuranceParserInput {
  caseId: string;
  documents: InsuranceParserDocument[];
}

export interface DocumentParser {
  parseInsuranceDocuments(input: InsuranceParserInput): Promise<InsuranceExtraction>;
}

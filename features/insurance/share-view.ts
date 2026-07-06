import {
  insuranceExtractionFormGroups,
  insuranceExtractionSchema,
  type InsuranceExtraction,
} from './parser';
import { z } from 'zod';

const defaultShareFieldPaths = [
  'applicant.fullName',
  'applicant.aadhaarLast4',
  'purchase.invoiceNumber',
  'purchase.invoiceDate',
  'purchase.itemDescription',
  'purchase.itemCategory',
  'purchase.serialNumberOrImei',
  'purchase.purchaseAmount',
  'purchase.currency',
];

const fieldCatalog = insuranceExtractionFormGroups.flatMap((group) =>
  group.fields.map(([fieldKey, label]) => ({
    path: `${group.key}.${fieldKey}`,
    groupKey: group.key,
    groupLabel: group.label,
    label,
  }))
);

export const insuranceShareSettingsSchema = z.object({
  enabled: z.boolean(),
  allowedEmails: z.array(z.string().email()).max(50),
  fieldPaths: z.array(z.string()).max(50),
});

export type InsuranceShareSettings = z.infer<typeof insuranceShareSettingsSchema>;

export const insuranceShareFieldCatalog = fieldCatalog;

export const defaultInsuranceShareFieldPaths = defaultShareFieldPaths;

function configuredShareFieldPaths() {
  return (
    process.env.INSURANCE_SHARE_FIELDS?.split(',').map((field) => field.trim()) ??
    defaultShareFieldPaths
  ).filter(Boolean);
}

function formatShareValue(value: unknown) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function getExtractionValue(extraction: InsuranceExtraction, path: string) {
  const [groupKey, fieldKey] = path.split('.');
  const group = extraction[groupKey as keyof InsuranceExtraction];

  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    return null;
  }

  return (group as Record<string, unknown>)[fieldKey];
}

export function parseConfirmedInsuranceExtraction(value: unknown) {
  return insuranceExtractionSchema.safeParse(value);
}

export function normalizeInsuranceShareSettings(input: InsuranceShareSettings) {
  const knownFieldPaths = new Set(fieldCatalog.map((field) => field.path));

  return {
    enabled: input.enabled,
    allowedEmails: Array.from(
      new Set(input.allowedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean))
    ),
    fieldPaths: Array.from(
      new Set(input.fieldPaths.filter((fieldPath) => knownFieldPaths.has(fieldPath)))
    ),
  };
}

export function getInsuranceShareRows(
  extraction: InsuranceExtraction,
  fieldPaths = configuredShareFieldPaths()
) {
  const catalogByPath = new Map(fieldCatalog.map((field) => [field.path, field]));

  return fieldPaths
    .map((path) => catalogByPath.get(path))
    .filter((field): field is NonNullable<typeof field> => Boolean(field))
    .map((field) => ({
      ...field,
      value: formatShareValue(getExtractionValue(extraction, field.path)),
    }))
    .filter((field) => field.value !== null);
}

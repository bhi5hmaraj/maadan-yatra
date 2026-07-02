import type { Quotation } from '@/types/quotation';
import { generateQuotationNumber } from '@/utils/formatting';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function createQuotationDuplicate(
  quotation: Quotation,
  existingNumbers: string[]
): Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(today.getDate() + 14);

  return {
    ...quotation,
    number: generateQuotationNumber(existingNumbers),
    date: formatDate(today),
    validUntil: formatDate(validUntil),
    status: 'draft',
    customer: { ...quotation.customer },
    trip: {
      ...quotation.trip,
      batchDates: [...(quotation.trip.batchDates ?? [])],
    },
    lineItems: quotation.lineItems.map((item) => ({ ...item })),
    hotels: quotation.hotels.map((hotel) => ({ ...hotel })),
    inclusions: [...quotation.inclusions],
    exclusions: [...quotation.exclusions],
    itinerary: quotation.itinerary.map((day) => ({ ...day })),
    payment: { ...quotation.payment },
    notes: [...quotation.notes],
    terms: [...quotation.terms],
    sourceIr: quotation.sourceIr
      ? JSON.parse(JSON.stringify(quotation.sourceIr))
      : undefined,
    sourceVendorDocument: quotation.sourceVendorDocument
      ? JSON.parse(JSON.stringify(quotation.sourceVendorDocument))
      : undefined,
  };
}

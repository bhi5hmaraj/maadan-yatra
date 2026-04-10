import {
  type QuoteTemplateSpec,
  type QuotationIR,
  quoteTemplateSpecSchema,
  quotationIRExtractionSchema,
  quotationIRSchema,
} from '@/schemas';
import {
  type Quotation,
  createDefaultQuotation,
} from '@/types/quotation';
import {
  calculateTotal,
  normalizeStringList,
} from '@/utils/formatting';

function formatDateOnly(value?: string): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function deriveQuotationStatus(
  status: QuotationIR['status']
): Quotation['status'] {
  switch (status) {
    case 'sent':
      return 'sent';
    case 'confirmed':
      return 'confirmed';
    case 'lost':
      return 'lost';
    case 'draft':
    case 'parsed':
    case 'reviewed':
    default:
      return 'draft';
  }
}

function deriveIRStatus(status: Quotation['status']): QuotationIR['status'] {
  switch (status) {
    case 'sent':
      return 'sent';
    case 'confirmed':
      return 'confirmed';
    case 'lost':
      return 'lost';
    case 'draft':
    default:
      return 'draft';
  }
}

export function createEmptyQuotationIR(
  overrides: Partial<QuotationIR> = {}
): QuotationIR {
  const now = new Date().toISOString();

  return quotationIRSchema.parse({
    id: overrides.id ?? crypto.randomUUID(),
    irVersion: '1.0',
    status: 'draft',
    customer: {
      name: '',
      email: '',
      phone: '',
    },
    trip: {
      destination: '',
      batchDates: [],
    },
    pricing: {
      currency: 'INR',
      lineItems: [],
    },
    stays: [],
    transport: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    notes: [],
    terms: [],
    cancellationPolicy: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function normalizeNullableString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeNullableNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function normalizeExtractedQuotationIR(
  extractedInput: unknown,
  overrides: Partial<QuotationIR> = {}
): QuotationIR {
  const extracted = quotationIRExtractionSchema.parse(extractedInput);
  const now = new Date().toISOString();

  return quotationIRSchema.parse({
    id: overrides.id ?? crypto.randomUUID(),
    irVersion: '1.0',
    status: overrides.status ?? 'parsed',
    vendorDocumentId: overrides.vendorDocumentId,
    quotationNumber: overrides.quotationNumber,
    customer: {
      name: normalizeNullableString(extracted.customer.name) ?? '',
      email: normalizeNullableString(extracted.customer.email),
      phone: normalizeNullableString(extracted.customer.phone),
    },
    consultant: normalizeNullableString(extracted.consultant),
    trip: {
      title: normalizeNullableString(extracted.trip.title),
      tripId: normalizeNullableString(extracted.trip.tripId),
      destination: normalizeNullableString(extracted.trip.destination) ?? '',
      packageName: normalizeNullableString(extracted.trip.packageName),
      packageType: normalizeNullableString(extracted.trip.packageType),
      dateRange: {
        startDate: normalizeNullableString(extracted.trip.dateRange.startDate),
        endDate: normalizeNullableString(extracted.trip.dateRange.endDate),
        nights: normalizeNullableNumber(extracted.trip.dateRange.nights),
        days: normalizeNullableNumber(extracted.trip.dateRange.days),
      },
      batchDates: extracted.trip.batchDates.filter(Boolean),
      pax: {
        adults: normalizeNullableNumber(extracted.trip.pax.adults) ?? 0,
        children: normalizeNullableNumber(extracted.trip.pax.children),
        infants: normalizeNullableNumber(extracted.trip.pax.infants),
        total: normalizeNullableNumber(extracted.trip.pax.total),
      },
    },
    pricing: {
      currency: normalizeNullableString(extracted.pricing.currency) ?? 'INR',
      lineItems: extracted.pricing.lineItems.map((item) => ({
        label: item.label,
        unit: normalizeNullableString(item.unit),
        amount: {
          currency: normalizeNullableString(extracted.pricing.currency) ?? 'INR',
          amount: normalizeNullableNumber(item.amount) ?? 0,
        },
        quantity: normalizeNullableNumber(item.quantity),
        gstIncluded: item.gstIncluded ?? undefined,
        notes: normalizeNullableString(item.notes),
      })),
      total: normalizeNullableNumber(extracted.pricing.totalAmount) !== undefined
        ? {
            currency: normalizeNullableString(extracted.pricing.currency) ?? 'INR',
            amount: normalizeNullableNumber(extracted.pricing.totalAmount) ?? 0,
          }
        : undefined,
      advance: normalizeNullableNumber(extracted.pricing.advanceAmount) !== undefined
        ? {
            currency: normalizeNullableString(extracted.pricing.currency) ?? 'INR',
            amount: normalizeNullableNumber(extracted.pricing.advanceAmount) ?? 0,
          }
        : undefined,
      balanceDueDate: normalizeNullableString(extracted.pricing.balanceDueDate),
    },
    stays: extracted.stays.map((item) => ({
      city: normalizeNullableString(item.city),
      hotelName: normalizeNullableString(item.hotelName),
      roomType: normalizeNullableString(item.roomType),
      mealPlan: normalizeNullableString(item.mealPlan),
      accommodationType: normalizeNullableString(item.accommodationType),
      nightLabel: normalizeNullableString(item.nightLabel),
      date: normalizeNullableString(item.date),
      quantity: normalizeNullableNumber(item.quantity),
    })),
    transport: extracted.transport.map((item) => ({
      dayLabel: normalizeNullableString(item.dayLabel),
      date: normalizeNullableString(item.date),
      route: normalizeNullableString(item.route),
      service: normalizeNullableString(item.service),
      vehicleType: normalizeNullableString(item.vehicleType),
      quantity: normalizeNullableNumber(item.quantity),
    })),
    inclusions: extracted.inclusions.map((text) => ({ text })),
    exclusions: extracted.exclusions.map((text) => ({ text })),
    itinerary: extracted.itinerary.map((item) => ({
      dayNumber: normalizeNullableNumber(item.dayNumber),
      title: item.title,
      description: normalizeNullableString(item.description),
      route: normalizeNullableString(item.route),
      distanceKm: normalizeNullableNumber(item.distanceKm),
      durationText: normalizeNullableString(item.durationText),
    })),
    notes: extracted.notes.map((text) => ({ text })),
    terms: extracted.terms.map((text) => ({ text })),
    cancellationPolicy: extracted.cancellationPolicy.map((item) => ({
      fromDaysBefore: normalizeNullableNumber(item.fromDaysBefore),
      toDaysBefore: normalizeNullableNumber(item.toDaysBefore),
      penaltyPercent: normalizeNullableNumber(item.penaltyPercent),
      text: normalizeNullableString(item.text),
    })),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  });
}

export function mapQuotationToIR(quotation: Quotation): QuotationIR {
  const total = calculateTotal(quotation.lineItems);
  const normalizedInclusions = normalizeStringList(quotation.inclusions);
  const normalizedExclusions = normalizeStringList(quotation.exclusions);
  const normalizedNotes = normalizeStringList(quotation.notes);
  const normalizedTerms = normalizeStringList(quotation.terms);

  return quotationIRSchema.parse({
    id: quotation.id,
    irVersion: '1.0',
    status: deriveIRStatus(quotation.status),
    quotationNumber: quotation.number,
    customer: {
      name: quotation.customer.name,
      email: quotation.customer.email || undefined,
      phone: quotation.customer.phone || undefined,
    },
    consultant: quotation.consultant || undefined,
    trip: {
      title: quotation.trip.destination || undefined,
      destination: quotation.trip.destination,
      packageType: quotation.trip.packageType || undefined,
      dateRange: {
        startDate: quotation.trip.departureDate || undefined,
        endDate: quotation.trip.returnDate || undefined,
        nights: quotation.trip.nights,
        days: quotation.trip.nights > 0 ? quotation.trip.nights + 1 : undefined,
      },
      pax: {
        adults: quotation.trip.adults,
        children: quotation.trip.children,
        total: quotation.trip.adults + quotation.trip.children,
      },
      batchDates: quotation.trip.batchDates ?? [],
    },
    pricing: {
      currency: 'INR',
      lineItems: quotation.lineItems.map((item) => ({
        label: item.desc || 'Untitled item',
        amount: {
          currency: 'INR',
          amount:
            typeof item.amt === 'number' ? item.amt : parseFloat(item.amt) || 0,
        },
        quantity:
          typeof item.qty === 'number'
            ? item.qty
            : typeof item.qty === 'string'
              ? parseFloat(item.qty) || undefined
              : undefined,
        selectionMode: item.mode || 'and',
        optionGroup: item.orGroup || undefined,
        selected: item.mode === 'or' ? item.selected !== false : true,
        notes: item.detail || undefined,
      })),
      total: {
        currency: 'INR',
        amount: total,
      },
      advance: quotation.payment.nonRefundable
        ? {
            currency: 'INR',
            amount: quotation.payment.nonRefundable,
          }
        : undefined,
      balanceDueDate: quotation.payment.balanceDueDate || undefined,
    },
    stays: quotation.hotels.map((hotel) => ({
      city: hotel.location || undefined,
      hotelName: hotel.name || undefined,
      roomType: hotel.roomType || undefined,
      nightLabel:
        typeof hotel.nights === 'number' && hotel.nights > 0
          ? `${hotel.nights} nights`
          : undefined,
      quantity:
        typeof hotel.nights === 'number'
          ? hotel.nights
          : typeof hotel.nights === 'string'
            ? parseFloat(hotel.nights) || undefined
            : undefined,
    })),
    transport: [],
    inclusions: normalizedInclusions.map((text) => ({ text })),
    exclusions: normalizedExclusions.map((text) => ({ text })),
    itinerary: quotation.itinerary.map((day, index) => ({
      dayNumber: index + 1,
      title: day.title || `Day ${index + 1}`,
      description: day.desc || undefined,
    })),
    notes: normalizedNotes.map((text) => ({ text })),
    terms: normalizedTerms.map((text) => ({ text })),
    cancellationPolicy: [],
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
  });
}

export function mapIRToQuotation(ir: QuotationIR): Quotation {
  const fallback = createDefaultQuotation();
  const startDate = formatDateOnly(ir.trip.dateRange?.startDate);
  const endDate = formatDateOnly(ir.trip.dateRange?.endDate);
  const createdAt = ir.createdAt || new Date().toISOString();
  const updatedAt = ir.updatedAt || createdAt;
  const quoteDate = formatDateOnly(createdAt);
  const validUntil = fallback.validUntil;

  return {
    id: ir.id,
    number: ir.quotationNumber || fallback.number,
    date: quoteDate || fallback.date,
    validUntil,
    documentFontScale: fallback.documentFontScale,
    customer: {
      name: ir.customer.name || '',
      email: ir.customer.email || '',
      phone: ir.customer.phone || '',
    },
    trip: {
      destination: ir.trip.destination || '',
      departureDate: startDate || fallback.trip.departureDate,
      returnDate: endDate || fallback.trip.returnDate,
      batchDates: ir.trip.batchDates ?? [],
      adults: ir.trip.pax?.adults ?? fallback.trip.adults,
      children: ir.trip.pax?.children ?? fallback.trip.children,
      nights: ir.trip.dateRange?.nights ?? fallback.trip.nights,
      packageType: ir.trip.packageType || '',
    },
    consultant: ir.consultant || '',
    lineItems: ir.pricing.lineItems.map((item) => ({
      desc: item.label,
      detail: item.notes || '',
      qty: item.quantity ?? 1,
      amt: item.amount.amount,
      mode: item.selectionMode ?? 'and',
      orGroup: item.optionGroup || '',
      selected: item.selectionMode === 'or' ? item.selected !== false : true,
    })),
    hotels: ir.stays.map((stay) => ({
      name: stay.hotelName || '',
      location: stay.city || '',
      roomType: stay.roomType || '',
      nights: stay.quantity ?? '',
    })),
    inclusions: ir.inclusions.map((item) => item.text),
    exclusions: ir.exclusions.map((item) => item.text),
    itinerary: ir.itinerary.map((item, index) => ({
      title: item.title || `Day ${index + 1}`,
      desc: item.description || '',
    })),
    payment: {
      nonRefundable: ir.pricing.advance?.amount ?? 0,
      balanceDueDate:
        formatDateOnly(ir.pricing.balanceDueDate) ||
        fallback.payment.balanceDueDate,
    },
    notes: ir.notes.map((item) => item.text),
    terms: ir.terms.map((item) => item.text),
    status: deriveQuotationStatus(ir.status),
    createdAt,
    updatedAt,
  };
}

export function createDefaultQuoteTemplateSpec(): QuoteTemplateSpec {
  return quoteTemplateSpecSchema.parse({
    id: 'default-tour-proposal',
    templateKey: 'tour-proposal-v1',
    version: '1.0',
    channel: 'pdf',
    brand: {
      companyName: 'Sri Maadan Yatra',
      logoUrl: '/logo.png',
      primaryColor: '#1B3A4B',
      accentColor: '#C4622D',
      contactEmail: 'srimaadanyatra@gmail.com',
      contactPhone: '+91 96007 77266',
      website: 'srimaadanyatra.com',
    },
    sections: [
      { key: 'overview', visible: true },
      { key: 'pricing', visible: true },
      { key: 'inclusions', visible: true },
      { key: 'exclusions', visible: true },
      { key: 'itinerary', visible: true },
      { key: 'notes', visible: true },
      { key: 'terms', visible: true },
      { key: 'cancellation', visible: true },
    ],
    options: {
      showCustomerContact: true,
      showFooter: true,
      showValidityBanner: true,
      showTerms: true,
    },
  });
}

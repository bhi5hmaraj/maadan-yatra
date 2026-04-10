import { createEmptyQuotationIR, createDefaultQuoteTemplateSpec } from '@/utils/quotation-ir';

export const sampleQuotationIR = createEmptyQuotationIR({
  id: 'sample-ir',
  quotationNumber: 'QT-2026-001',
  customer: {
    name: 'Sample Traveller',
    email: 'traveller@example.com',
    phone: '+91 99999 99999',
  },
  trip: {
    title: 'Leh to Leh Bike Tour 2026',
    destination: 'Ladakh',
    packageType: 'Bike Tour',
    dateRange: {
      startDate: '2026-05-23',
      endDate: '2026-05-30',
      nights: 7,
      days: 8,
    },
    pax: {
      adults: 10,
      total: 10,
    },
    batchDates: ['2026-05-23', '2026-05-30'],
  },
});

export const sampleQuoteTemplateSpec = createDefaultQuoteTemplateSpec();

import type { QuotationIR, VendorDocument } from '@/schemas';

export type LineItemMode = 'and' | 'or';

export interface LineItem {
  desc: string;
  detail: string;
  qty?: number | '';
  amt: number | '';
  mode?: LineItemMode;
  orGroup?: string;
  selected?: boolean;
}

export interface ItineraryDay {
  title: string;
  desc: string;
}

export interface HotelStay {
  name: string;
  location: string;
  roomType: string;
  nights: number | '';
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface Trip {
  destination: string;
  departureDate: string;
  returnDate: string;
  batchDates: string[];
  adults: number;
  children: number;
  nights: number;
  packageType: string;
}

export interface Payment {
  nonRefundable: number;
  balanceDueDate: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'lost';

export interface Quotation {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  documentFontScale: number;
  customer: Customer;
  trip: Trip;
  consultant: string;
  lineItems: LineItem[];
  hotels: HotelStay[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  payment: Payment;
  notes: string[];
  terms: string[];
  status: QuotationStatus;
  sourceIr?: QuotationIR;
  sourceVendorDocument?: VendorDocument;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_INCLUSIONS = [
  'Return flights',
  'Hotel and breakfast',
  'All transfers',
  'Travel insurance',
  '24/7 support',
  'Airport assistance',
  'Guided tours',
  'Visa assistance',
];

export const DEFAULT_EXCLUSIONS = [
  'Visa fees',
  'Personal meals',
  'Tips and porterage',
];

export const DEFAULT_LINE_ITEMS: LineItem[] = [
  { desc: 'International flights', detail: 'Return, Economy', qty: 1, amt: '', mode: 'and', selected: true },
  { desc: 'Hotel accommodation', detail: 'Nights + Breakfast', qty: 1, amt: '', mode: 'and', selected: true },
  { desc: 'All transfers', detail: 'Airport and inter-city', qty: 1, amt: '', mode: 'and', selected: true },
  { desc: 'Service fee', detail: 'Itinerary and 24/7 support', qty: 1, amt: '', mode: 'and', selected: true },
];

export const DEFAULT_ITINERARY: ItineraryDay[] = [
  { title: 'Day 1: Arrival and check-in', desc: '' },
  { title: 'Day 2: Exploration', desc: '' },
];

export const DEFAULT_HOTELS: HotelStay[] = [
  { name: '', location: '', roomType: '', nights: '' },
];

export function createDefaultQuotation(): Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(today.getDate() + 14);

  const departure = new Date(today);
  departure.setMonth(today.getMonth() + 2);

  const returnDate = new Date(departure);
  returnDate.setDate(departure.getDate() + 8);

  const balanceDue = new Date(departure);
  balanceDue.setDate(departure.getDate() - 30);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    number: `QT-${today.getFullYear()}-001`,
    date: formatDate(today),
    validUntil: formatDate(validUntil),
    documentFontScale: 1.08,
    customer: {
      name: '',
      email: '',
      phone: '',
    },
    trip: {
      destination: '',
      departureDate: formatDate(departure),
      returnDate: formatDate(returnDate),
      batchDates: [],
      adults: 2,
      children: 0,
      nights: 7,
      packageType: '',
    },
    consultant: '',
    lineItems: [...DEFAULT_LINE_ITEMS],
    hotels: [...DEFAULT_HOTELS],
    inclusions: [
      'Return flights',
      'Hotel and breakfast',
      'All transfers',
      'Travel insurance',
      '24/7 support',
    ],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [...DEFAULT_ITINERARY],
    payment: {
      nonRefundable: 0,
      balanceDueDate: formatDate(balanceDue),
    },
    notes: [],
    terms: [],
    status: 'draft',
  };
}

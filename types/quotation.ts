export interface LineItem {
  desc: string;
  detail: string;
  amt: number | '';
}

export interface ItineraryDay {
  title: string;
  desc: string;
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
  customer: Customer;
  trip: Trip;
  consultant: string;
  lineItems: LineItem[];
  inclusions: string[];
  exclusions: string;
  itinerary: ItineraryDay[];
  payment: Payment;
  notes: string;
  status: QuotationStatus;
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

export const DEFAULT_LINE_ITEMS: LineItem[] = [
  { desc: 'International flights', detail: 'Return, Economy', amt: '' },
  { desc: 'Hotel accommodation', detail: 'Nights + Breakfast', amt: '' },
  { desc: 'All transfers', detail: 'Airport and inter-city', amt: '' },
  { desc: 'Service fee', detail: 'Itinerary and 24/7 support', amt: '' },
];

export const DEFAULT_ITINERARY: ItineraryDay[] = [
  { title: 'Day 1: Arrival and check-in', desc: '' },
  { title: 'Day 2: Exploration', desc: '' },
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
    customer: {
      name: '',
      email: '',
      phone: '',
    },
    trip: {
      destination: '',
      departureDate: formatDate(departure),
      returnDate: formatDate(returnDate),
      adults: 2,
      children: 0,
      nights: 7,
      packageType: '',
    },
    consultant: '',
    lineItems: [...DEFAULT_LINE_ITEMS],
    inclusions: ['Return flights', 'Hotel and breakfast', 'All transfers', 'Travel insurance', '24/7 support'],
    exclusions: '',
    itinerary: [...DEFAULT_ITINERARY],
    payment: {
      nonRefundable: 0,
      balanceDueDate: formatDate(balanceDue),
    },
    notes: '',
    status: 'draft',
  };
}

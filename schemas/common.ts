import { z } from 'zod';

export const sourceTypeSchema = z.enum([
  'pdf',
  'docx',
  'email',
  'image',
  'manual',
]);

export const currencyCodeSchema = z.enum([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
]);

export const quoteStatusSchema = z.enum([
  'draft',
  'parsed',
  'reviewed',
  'sent',
  'confirmed',
  'lost',
]);

export const quotationSectionKeySchema = z.enum([
  'overview',
  'pricing',
  'stays',
  'transport',
  'inclusions',
  'exclusions',
  'itinerary',
  'notes',
  'terms',
  'cancellation',
]);

export const sourceRefSchema = z.object({
  sourceId: z.string(),
  page: z.number().int().positive().optional(),
  blockId: z.string().optional(),
  text: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const moneySchema = z.object({
  currency: currencyCodeSchema.default('INR'),
  amount: z.number().finite(),
  display: z.string().optional(),
});

export const paxSchema = z.object({
  adults: z.number().int().min(0).default(0),
  children: z.number().int().min(0).optional(),
  infants: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  nights: z.number().int().min(0).optional(),
  days: z.number().int().min(0).optional(),
});

export const partyRefSchema = z.object({
  name: z.string(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const extractedListItemSchema = z.object({
  text: z.string(),
  source: sourceRefSchema.optional(),
});

export const stayItemSchema = z.object({
  city: z.string().optional(),
  hotelName: z.string().optional(),
  roomType: z.string().optional(),
  mealPlan: z.string().optional(),
  accommodationType: z.string().optional(),
  nightLabel: z.string().optional(),
  date: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  source: sourceRefSchema.optional(),
});

export const transportItemSchema = z.object({
  dayLabel: z.string().optional(),
  date: z.string().optional(),
  route: z.string().optional(),
  service: z.string().optional(),
  vehicleType: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  source: sourceRefSchema.optional(),
});

export const pricingBlockSchema = z.object({
  label: z.string(),
  unit: z.string().optional(),
  amount: moneySchema,
  quantity: z.number().positive().optional(),
  selectionMode: z.enum(['and', 'or']).optional(),
  optionGroup: z.string().optional(),
  selected: z.boolean().optional(),
  gstIncluded: z.boolean().optional(),
  notes: z.string().optional(),
  source: sourceRefSchema.optional(),
});

export const itineraryItemSchema = z.object({
  dayNumber: z.number().int().positive().optional(),
  title: z.string(),
  description: z.string().optional(),
  route: z.string().optional(),
  distanceKm: z.number().nonnegative().optional(),
  durationText: z.string().optional(),
  source: sourceRefSchema.optional(),
});

export const cancellationRuleSchema = z.object({
  fromDaysBefore: z.number().int().min(0).optional(),
  toDaysBefore: z.number().int().min(0).optional(),
  penaltyPercent: z.number().min(0).max(100).optional(),
  penaltyAmount: moneySchema.optional(),
  text: z.string().optional(),
  source: sourceRefSchema.optional(),
});

export type SourceType = z.infer<typeof sourceTypeSchema>;
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;
export type QuotationSectionKey = z.infer<typeof quotationSectionKeySchema>;
export type SourceRef = z.infer<typeof sourceRefSchema>;
export type Money = z.infer<typeof moneySchema>;
export type Pax = z.infer<typeof paxSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type PartyRef = z.infer<typeof partyRefSchema>;
export type ExtractedListItem = z.infer<typeof extractedListItemSchema>;
export type StayItem = z.infer<typeof stayItemSchema>;
export type TransportItem = z.infer<typeof transportItemSchema>;
export type PricingBlock = z.infer<typeof pricingBlockSchema>;
export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type CancellationRule = z.infer<typeof cancellationRuleSchema>;

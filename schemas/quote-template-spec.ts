import { z } from 'zod';
import { currencyCodeSchema, quotationSectionKeySchema } from '@/schemas/common';

export const quoteTemplateSpecSchema = z.object({
  id: z.string(),
  templateKey: z.string(),
  version: z.string().default('1.0'),
  channel: z.enum(['pdf', 'web', 'mobile']).default('pdf'),
  brand: z.object({
    companyName: z.string(),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    website: z.string().optional(),
  }),
  locale: z.object({
    currency: currencyCodeSchema.default('INR'),
    dateFormat: z.string().default('DD MMM YYYY'),
  }).default({
    currency: 'INR',
    dateFormat: 'DD MMM YYYY',
  }),
  sections: z.array(z.object({
    key: quotationSectionKeySchema,
    title: z.string().optional(),
    visible: z.boolean().default(true),
    variant: z.string().optional(),
  })).default([]),
  options: z.object({
    showCustomerContact: z.boolean().default(true),
    showFooter: z.boolean().default(true),
    showValidityBanner: z.boolean().default(true),
    showTerms: z.boolean().default(true),
  }).default({}),
});

export type QuoteTemplateSpec = z.infer<typeof quoteTemplateSpecSchema>;

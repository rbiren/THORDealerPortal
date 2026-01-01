import { z } from 'zod'

export const dealerFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'pending', 'suspended', 'inactive']).optional(),
  tier: z.enum(['all', 'platinum', 'gold', 'silver', 'bronze']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['code', 'name', 'status', 'tier', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type DealerFilterInput = z.infer<typeof dealerFilterSchema>

export const createDealerSchema = z.object({
  code: z.string()
    .min(1, 'Dealer code is required')
    .max(20, 'Dealer code must be 20 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Dealer code must be uppercase letters and numbers only'),
  name: z.string()
    .min(1, 'Dealer name is required')
    .max(100, 'Dealer name must be 100 characters or less'),
  status: z.enum(['active', 'pending', 'suspended', 'inactive']).default('pending'),
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze']).default('bronze'),
  ein: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  insurancePolicy: z.string().optional().nullable(),
  parentDealerId: z.string().optional().nullable(),
})

export type CreateDealerInput = z.infer<typeof createDealerSchema>

export const updateDealerSchema = z.object({
  id: z.string().min(1),
  code: z.string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9]+$/)
    .optional(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'pending', 'suspended', 'inactive']).optional(),
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze']).optional(),
  ein: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  insurancePolicy: z.string().optional().nullable(),
  parentDealerId: z.string().optional().nullable(),
})

export type UpdateDealerInput = z.infer<typeof updateDealerSchema>

export const bulkDealerActionSchema = z.object({
  dealerIds: z.array(z.string()).min(1, 'Select at least one dealer'),
  action: z.enum(['activate', 'suspend', 'deactivate']),
})

export type BulkDealerActionInput = z.infer<typeof bulkDealerActionSchema>

// Onboarding Wizard Step Schemas

export const onboardingStep1Schema = z.object({
  code: z.string()
    .min(1, 'Dealer code is required')
    .max(20, 'Dealer code must be 20 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Dealer code must be uppercase letters and numbers only'),
  name: z.string()
    .min(1, 'Dealer name is required')
    .max(100, 'Dealer name must be 100 characters or less'),
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze']).default('bronze'),
  parentDealerId: z.string().optional().nullable(),
})

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>

export const onboardingStep2Schema = z.object({
  ein: z.string()
    .regex(/^\d{2}-\d{7}$/, 'EIN must be in format XX-XXXXXXX')
    .optional()
    .or(z.literal('')),
  licenseNumber: z.string().max(50, 'License number must be 50 characters or less').optional(),
  insurancePolicy: z.string().max(50, 'Insurance policy must be 50 characters or less').optional(),
})

export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>

export const onboardingContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  type: z.enum(['primary', 'billing', 'sales', 'support', 'technical']),
  isPrimary: z.boolean().default(false),
})

export type OnboardingContactInput = z.infer<typeof onboardingContactSchema>

export const onboardingAddressSchema = z.object({
  type: z.enum(['billing', 'shipping', 'both']),
  street: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'Use 2-letter state code'),
  zipCode: z.string().min(5, 'ZIP code is required').max(10, 'ZIP code must be 10 characters or less'),
  country: z.string().default('USA'),
  isPrimary: z.boolean().default(false),
})

export type OnboardingAddressInput = z.infer<typeof onboardingAddressSchema>

export const onboardingStep3Schema = z.object({
  contacts: z.array(onboardingContactSchema).min(1, 'At least one contact is required'),
  addresses: z.array(onboardingAddressSchema).min(1, 'At least one address is required'),
})

export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>

export const fullOnboardingSchema = z.object({
  // Step 1: Basic Info
  code: onboardingStep1Schema.shape.code,
  name: onboardingStep1Schema.shape.name,
  tier: onboardingStep1Schema.shape.tier,
  parentDealerId: onboardingStep1Schema.shape.parentDealerId,
  // Step 2: Business Details
  ein: onboardingStep2Schema.shape.ein,
  licenseNumber: onboardingStep2Schema.shape.licenseNumber,
  insurancePolicy: onboardingStep2Schema.shape.insurancePolicy,
  // Step 3: Contacts & Addresses
  contacts: onboardingStep3Schema.shape.contacts,
  addresses: onboardingStep3Schema.shape.addresses,
})

export type FullOnboardingInput = z.infer<typeof fullOnboardingSchema>

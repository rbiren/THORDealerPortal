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

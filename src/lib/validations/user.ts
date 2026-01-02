import { z } from 'zod'

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['all', 'super_admin', 'admin', 'dealer_admin', 'dealer_user', 'readonly']).optional(),
  status: z.enum(['all', 'active', 'inactive', 'pending', 'suspended']).optional(),
  dealerId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['email', 'firstName', 'lastName', 'role', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type UserFilterInput = z.infer<typeof userFilterSchema>

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['super_admin', 'admin', 'dealer_admin', 'dealer_user', 'readonly']),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('active'),
  dealerId: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['super_admin', 'admin', 'dealer_admin', 'dealer_user', 'readonly']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  dealerId: z.string().optional().nullable(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  action: z.enum(['activate', 'deactivate', 'suspend', 'delete']),
})

export type BulkActionInput = z.infer<typeof bulkActionSchema>

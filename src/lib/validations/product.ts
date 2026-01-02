import { z } from 'zod'

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['all', 'active', 'discontinued', 'draft']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['all', 'yes', 'no']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(12),
  sortBy: z.enum(['name', 'price', 'sku', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  viewMode: z.enum(['grid', 'list']).default('grid'),
})

export type ProductFilterInput = z.infer<typeof productFilterSchema>

export const createProductSchema = z.object({
  sku: z.string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase letters, numbers, and hyphens only'),
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be 200 characters or less'),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['active', 'discontinued', 'draft']).default('draft'),
  specifications: z.record(z.unknown()).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = z.object({
  id: z.string().min(1),
  sku: z.string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/)
    .optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['active', 'discontinued', 'draft']).optional(),
  specifications: z.record(z.unknown()).optional(),
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
})

export type CategoryInput = z.infer<typeof categorySchema>

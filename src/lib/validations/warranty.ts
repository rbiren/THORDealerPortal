import { z } from 'zod'

// Warranty claim statuses
export const warrantyStatusOptions = [
  'draft',
  'submitted',
  'under_review',
  'info_requested',
  'approved',
  'partial',
  'denied',
  'closed',
] as const

export type WarrantyStatus = (typeof warrantyStatusOptions)[number]

// Claim types
export const warrantyClaimTypes = [
  'product_defect',
  'shipping_damage',
  'missing_parts',
  'installation_issue',
  'other',
] as const

export type WarrantyClaimType = (typeof warrantyClaimTypes)[number]

// Resolution types
export const warrantyResolutionTypes = [
  'replacement',
  'repair',
  'credit',
  'partial_credit',
  'denial',
] as const

// Priority levels
export const warrantyPriorityLevels = ['low', 'normal', 'high', 'urgent'] as const

// Item issue types
export const warrantyItemIssueTypes = [
  'defective',
  'damaged',
  'missing',
  'worn',
  'other',
] as const

// Attachment categories
export const warrantyAttachmentCategories = [
  'photo',
  'receipt',
  'invoice',
  'document',
  'other',
] as const

// Filter schema for listing warranty claims
export const warrantyFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', ...warrantyStatusOptions]).optional().default('all'),
  claimType: z.enum(['all', ...warrantyClaimTypes]).optional().default('all'),
  priority: z.enum(['all', ...warrantyPriorityLevels]).optional().default('all'),
  dealerId: z.string().optional(),
  assignedToId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'claimNumber', 'totalRequested', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type WarrantyFilterInput = z.infer<typeof warrantyFilterSchema>

// Schema for warranty claim items
export const warrantyClaimItemSchema = z.object({
  id: z.string().optional(), // For editing existing items
  partNumber: z.string().max(100).optional(),
  partName: z.string().min(1, 'Part name is required').max(200),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').default(1),
  unitCost: z.coerce.number().min(0, 'Unit cost must be positive').default(0),
  issueType: z.enum(warrantyItemIssueTypes),
  issueDescription: z.string().max(1000).optional(),
})

export type WarrantyClaimItemInput = z.infer<typeof warrantyClaimItemSchema>

// Schema for creating a new warranty claim
export const createWarrantyClaimSchema = z.object({
  // Claim type
  claimType: z.enum(warrantyClaimTypes, {
    required_error: 'Claim type is required',
  }),

  // Product information
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required').max(200),
  serialNumber: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  installDate: z.coerce.date().optional(),

  // Customer information
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),

  // Issue details
  issueDescription: z.string().min(10, 'Please provide a detailed description of the issue').max(5000),
  failureDate: z.coerce.date().optional(),
  isUnderWarranty: z.boolean().default(true),

  // Amounts
  laborHours: z.coerce.number().min(0).optional(),
  laborRate: z.coerce.number().min(0).optional(),
  partsAmount: z.coerce.number().min(0).default(0),
  shippingAmount: z.coerce.number().min(0).default(0),

  // Priority
  priority: z.enum(warrantyPriorityLevels).default('normal'),

  // Items
  items: z.array(warrantyClaimItemSchema).optional(),

  // Submit immediately or save as draft
  submitNow: z.boolean().default(false),
})

export type CreateWarrantyClaimInput = z.infer<typeof createWarrantyClaimSchema>

// Schema for updating a warranty claim (dealer side - limited)
export const updateWarrantyClaimSchema = z.object({
  id: z.string().min(1),
  claimType: z.enum(warrantyClaimTypes).optional(),
  productId: z.string().optional(),
  productName: z.string().min(1).max(200).optional(),
  serialNumber: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  installDate: z.coerce.date().optional(),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),
  issueDescription: z.string().min(10).max(5000).optional(),
  failureDate: z.coerce.date().optional(),
  isUnderWarranty: z.boolean().optional(),
  laborHours: z.coerce.number().min(0).optional(),
  laborRate: z.coerce.number().min(0).optional(),
  partsAmount: z.coerce.number().min(0).optional(),
  shippingAmount: z.coerce.number().min(0).optional(),
  priority: z.enum(warrantyPriorityLevels).optional(),
  items: z.array(warrantyClaimItemSchema).optional(),
})

export type UpdateWarrantyClaimInput = z.infer<typeof updateWarrantyClaimSchema>

// Schema for manufacturer review actions
export const reviewWarrantyClaimSchema = z.object({
  claimId: z.string().min(1),
  action: z.enum(['approve', 'deny', 'partial', 'request_info']),
  note: z.string().max(2000).optional(),
  // For approval/partial
  totalApproved: z.coerce.number().min(0).optional(),
  resolutionType: z.enum(warrantyResolutionTypes).optional(),
  resolutionNotes: z.string().max(2000).optional(),
  // For item-level decisions
  itemDecisions: z.array(z.object({
    itemId: z.string(),
    approved: z.boolean(),
    approvedQty: z.coerce.number().min(0).optional(),
    approvedAmount: z.coerce.number().min(0).optional(),
    denialReason: z.string().max(500).optional(),
  })).optional(),
})

export type ReviewWarrantyClaimInput = z.infer<typeof reviewWarrantyClaimSchema>

// Schema for adding notes to a claim
export const addWarrantyNoteSchema = z.object({
  claimId: z.string().min(1),
  content: z.string().min(1, 'Note content is required').max(5000),
  isInternal: z.boolean().default(false),
})

export type AddWarrantyNoteInput = z.infer<typeof addWarrantyNoteSchema>

// Schema for dealer responding to info request
export const respondToInfoRequestSchema = z.object({
  claimId: z.string().min(1),
  response: z.string().min(1, 'Response is required').max(5000),
  resubmit: z.boolean().default(true), // Whether to resubmit for review
})

export type RespondToInfoRequestInput = z.infer<typeof respondToInfoRequestSchema>

// Helper to format warranty claim number
export function formatClaimNumber(sequence: number, year: number = new Date().getFullYear()): string {
  return `WC-${year}-${String(sequence).padStart(5, '0')}`
}

// Status display labels
export const warrantyStatusLabels: Record<WarrantyStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  info_requested: 'Info Requested',
  approved: 'Approved',
  partial: 'Partially Approved',
  denied: 'Denied',
  closed: 'Closed',
}

// Status colors for UI
export const warrantyStatusColors: Record<WarrantyStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  info_requested: { bg: 'bg-orange-100', text: 'text-orange-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  partial: { bg: 'bg-lime-100', text: 'text-lime-700' },
  denied: { bg: 'bg-red-100', text: 'text-red-700' },
  closed: { bg: 'bg-gray-200', text: 'text-gray-600' },
}

// Claim type labels
export const warrantyClaimTypeLabels: Record<WarrantyClaimType, string> = {
  product_defect: 'Product Defect',
  shipping_damage: 'Shipping Damage',
  missing_parts: 'Missing Parts',
  installation_issue: 'Installation Issue',
  other: 'Other',
}

// Priority labels and colors
export const warrantyPriorityLabels: Record<(typeof warrantyPriorityLevels)[number], string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const warrantyPriorityColors: Record<(typeof warrantyPriorityLevels)[number], { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-600' },
  high: { bg: 'bg-orange-100', text: 'text-orange-600' },
  urgent: { bg: 'bg-red-100', text: 'text-red-600' },
}

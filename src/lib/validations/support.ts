import { z } from 'zod'

// Support ticket statuses
export const ticketStatusOptions = [
  'open',
  'in_progress',
  'pending_dealer',
  'resolved',
  'closed',
] as const

export type TicketStatus = (typeof ticketStatusOptions)[number]

// Ticket categories
export const ticketCategoryOptions = [
  'product',
  'warranty',
  'order',
  'billing',
  'technical',
  'account',
  'other',
] as const

export type TicketCategory = (typeof ticketCategoryOptions)[number]

// Priority levels
export const ticketPriorityOptions = ['low', 'normal', 'high', 'urgent'] as const

export type TicketPriority = (typeof ticketPriorityOptions)[number]

// Filter schema for listing support tickets
export const ticketFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', ...ticketStatusOptions]).optional().default('all'),
  category: z.enum(['all', ...ticketCategoryOptions]).optional().default('all'),
  priority: z.enum(['all', ...ticketPriorityOptions]).optional().default('all'),
  dealerId: z.string().optional(),
  assignedToId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'ticketNumber', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type TicketFilterInput = z.infer<typeof ticketFilterSchema>

// Schema for creating a new support ticket
export const createTicketSchema = z.object({
  category: z.enum(ticketCategoryOptions, {
    required_error: 'Please select a category',
  }),
  subcategory: z.string().max(100).optional(),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  description: z.string()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(10000, 'Description cannot exceed 10,000 characters'),
  priority: z.enum(ticketPriorityOptions).default('normal'),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

// Schema for adding a message to a ticket
export const addTicketMessageSchema = z.object({
  ticketId: z.string().min(1),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message cannot exceed 10,000 characters'),
  isInternal: z.boolean().default(false),
})

export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>

// Schema for updating ticket status (admin)
export const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(ticketStatusOptions),
  note: z.string().max(2000).optional(),
})

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>

// Schema for assigning a ticket (admin)
export const assignTicketSchema = z.object({
  ticketId: z.string().min(1),
  assignedToId: z.string().nullable(),
})

export type AssignTicketInput = z.infer<typeof assignTicketSchema>

// Helper to format ticket number
export function formatTicketNumber(sequence: number, year: number = new Date().getFullYear()): string {
  return `TKT-${year}-${String(sequence).padStart(5, '0')}`
}

// Status display labels
export const ticketStatusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_dealer: 'Awaiting Your Response',
  resolved: 'Resolved',
  closed: 'Closed',
}

// Status colors for UI
export const ticketStatusColors: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  pending_dealer: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

// Category labels
export const ticketCategoryLabels: Record<TicketCategory, string> = {
  product: 'Product Question',
  warranty: 'Warranty',
  order: 'Order Issue',
  billing: 'Billing & Invoices',
  technical: 'Technical Support',
  account: 'Account & Access',
  other: 'Other',
}

// Category icons (Lucide icon names)
export const ticketCategoryIcons: Record<TicketCategory, string> = {
  product: 'Package',
  warranty: 'Shield',
  order: 'ShoppingCart',
  billing: 'Receipt',
  technical: 'Wrench',
  account: 'User',
  other: 'HelpCircle',
}

// Priority labels and colors
export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const ticketPriorityColors: Record<TicketPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
}

// Subcategory options by category
export const ticketSubcategories: Record<TicketCategory, string[]> = {
  product: ['Specifications', 'Availability', 'Compatibility', 'Documentation', 'Other'],
  warranty: ['Claim Status', 'Coverage Question', 'Return Process', 'Other'],
  order: ['Order Status', 'Shipping', 'Missing Items', 'Cancellation', 'Other'],
  billing: ['Invoice Question', 'Payment Issue', 'Credit Request', 'Statement', 'Other'],
  technical: ['Installation', 'Configuration', 'Troubleshooting', 'Integration', 'Other'],
  account: ['Login Issues', 'User Management', 'Permissions', 'Profile Update', 'Other'],
  other: ['General Question', 'Feedback', 'Feature Request', 'Other'],
}

// SLA configuration (in hours)
export const ticketSLAConfig: Record<TicketPriority, { response: number; resolution: number }> = {
  low: { response: 48, resolution: 168 },      // 2 days response, 7 days resolution
  normal: { response: 24, resolution: 72 },    // 1 day response, 3 days resolution
  high: { response: 8, resolution: 24 },       // 8 hours response, 1 day resolution
  urgent: { response: 2, resolution: 8 },      // 2 hours response, 8 hours resolution
}

'use server'

import { auth } from '@/lib/auth'
import {
  listSupportTickets,
  getSupportTicketStats,
  createSupportTicket,
  getSupportTicket,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
} from '@/lib/services/support'
import {
  ticketFilterSchema,
  createTicketSchema,
  addTicketMessageSchema,
  ticketStatusLabels,
  ticketStatusColors,
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketPriorityColors,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from '@/lib/validations/support'

export type SupportTicketListItem = {
  id: string
  ticketNumber: string
  status: TicketStatus
  statusLabel: string
  statusColor: { bg: string; text: string; dot: string }
  category: TicketCategory
  categoryLabel: string
  subject: string
  priority: TicketPriority
  priorityLabel: string
  priorityColor: { bg: string; text: string; border: string }
  messageCount: number
  attachmentCount: number
  createdAt: string
  updatedAt: string
  dealerName: string
  dealerCode: string
  submittedByName: string
  assignedToName: string | null
  slaResponseDue: string | null
  slaResolutionDue: string | null
  firstResponseAt: string | null
}

export type SupportTicketStats = {
  total: number
  open: number
  inProgress: number
  pendingDealer: number
  resolved: number
  avgResponseTimeHours: number | null
}

// Get support tickets list
export async function getSupportTickets(filters?: {
  status?: string
  category?: string
  priority?: string
  search?: string
  dealerId?: string
  assignedToId?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const session = await auth()
  if (!session?.user) {
    return { tickets: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  const validatedFilters = ticketFilterSchema.parse({
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    sortBy: filters?.sortBy || 'createdAt',
    sortOrder: filters?.sortOrder || 'desc',
    status: filters?.status || 'all',
    category: filters?.category || 'all',
    priority: filters?.priority || 'all',
    search: filters?.search,
    dealerId: filters?.dealerId,
    assignedToId: filters?.assignedToId,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  })

  const result = await listSupportTickets(
    validatedFilters,
    session.user.id,
    session.user.role,
    session.user.dealerId || null
  )

  // Transform for UI
  const tickets: SupportTicketListItem[] = result.tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status as TicketStatus,
    statusLabel: ticketStatusLabels[ticket.status as TicketStatus] || ticket.status,
    statusColor: ticketStatusColors[ticket.status as TicketStatus] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      dot: 'bg-gray-400',
    },
    category: ticket.category as TicketCategory,
    categoryLabel: ticketCategoryLabels[ticket.category as TicketCategory] || ticket.category,
    subject: ticket.subject,
    priority: ticket.priority as TicketPriority,
    priorityLabel: ticketPriorityLabels[ticket.priority as TicketPriority] || ticket.priority,
    priorityColor: ticketPriorityColors[ticket.priority as TicketPriority] || {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
    },
    messageCount: ticket._count.messages,
    attachmentCount: ticket._count.attachments,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    dealerName: ticket.dealer.name,
    dealerCode: ticket.dealer.code,
    submittedByName: `${ticket.submittedBy.firstName} ${ticket.submittedBy.lastName}`,
    assignedToName: ticket.assignedTo
      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
      : null,
    slaResponseDue: ticket.slaResponseDue?.toISOString() || null,
    slaResolutionDue: ticket.slaResolutionDue?.toISOString() || null,
    firstResponseAt: ticket.firstResponseAt?.toISOString() || null,
  }))

  return {
    tickets,
    pagination: result.pagination,
  }
}

// Get support ticket stats
export async function getSupportStatsAction(): Promise<SupportTicketStats> {
  const session = await auth()
  if (!session?.user) {
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      pendingDealer: 0,
      resolved: 0,
      avgResponseTimeHours: null,
    }
  }

  return getSupportTicketStats(session.user.role, session.user.dealerId || null)
}

// Create a new support ticket
export async function createSupportTicketAction(
  formData: FormData
): Promise<{ success: boolean; ticketId?: string; ticketNumber?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!session.user.dealerId) {
    return { success: false, error: 'No dealer associated with this account' }
  }

  try {
    const rawData = {
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || undefined,
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      priority: (formData.get('priority') as string) || 'normal',
    }

    const validated = createTicketSchema.parse(rawData)

    const result = await createSupportTicket(validated, session.user.id, session.user.dealerId)

    return result
  } catch (error) {
    console.error('Create support ticket error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create support ticket',
    }
  }
}

// Get a single ticket
export async function getSupportTicketAction(ticketIdOrNumber: string) {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  return getSupportTicket(
    ticketIdOrNumber,
    session.user.id,
    session.user.role,
    session.user.dealerId || null
  )
}

// Add a message to a ticket
export async function addTicketMessageAction(
  ticketId: string,
  content: string,
  isInternal: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const validated = addTicketMessageSchema.parse({
      ticketId,
      content,
      isInternal,
    })

    return addTicketMessage(validated, session.user.id, session.user.role)
  } catch (error) {
    console.error('Add ticket message error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add message',
    }
  }
}

// Update ticket status (admin only)
export async function updateTicketStatusAction(
  ticketId: string,
  status: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  return updateTicketStatus(ticketId, status as TicketStatus, session.user.id, note)
}

// Assign ticket (admin only)
export async function assignTicketAction(
  ticketId: string,
  assignedToId: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  return assignTicket(ticketId, assignedToId, session.user.id)
}

// Check if user is admin
export async function isUserAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return ['super_admin', 'admin'].includes(session.user.role)
}

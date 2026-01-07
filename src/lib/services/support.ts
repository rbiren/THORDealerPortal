'use server'

import { prisma } from '@/lib/prisma'
import {
  type CreateTicketInput,
  type TicketFilterInput,
  type AddTicketMessageInput,
  type TicketStatus,
  type TicketPriority,
  ticketSLAConfig,
  formatTicketNumber,
} from '@/lib/validations/support'

// Generate unique ticket number
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `TKT-${year}-`

  // Find the highest ticket number for this year
  const lastTicket = await prisma.supportTicket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: 'desc',
    },
    select: {
      ticketNumber: true,
    },
  })

  let sequence = 1
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNumber.slice(-5), 10)
    sequence = lastSequence + 1
  }

  return formatTicketNumber(sequence, year)
}

// Calculate SLA due dates based on priority
function calculateSLADates(priority: TicketPriority): { responseDue: Date; resolutionDue: Date } {
  const now = new Date()
  const config = ticketSLAConfig[priority]

  const responseDue = new Date(now.getTime() + config.response * 60 * 60 * 1000)
  const resolutionDue = new Date(now.getTime() + config.resolution * 60 * 60 * 1000)

  return { responseDue, resolutionDue }
}

// Create a new support ticket
export async function createSupportTicket(
  data: CreateTicketInput,
  userId: string,
  dealerId: string
): Promise<{ success: boolean; ticketId?: string; ticketNumber?: string; error?: string }> {
  try {
    const ticketNumber = await generateTicketNumber()
    const { responseDue, resolutionDue } = calculateSLADates(data.priority)

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        dealerId,
        submittedById: userId,
        category: data.category,
        subcategory: data.subcategory || null,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: 'open',
        slaResponseDue: responseDue,
        slaResolutionDue: resolutionDue,
        // RV Unit reference
        rvUnitId: data.rvUnitId || null,
        vin: data.vin || null,
      },
    })

    return {
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    }
  } catch (error) {
    console.error('Create support ticket error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create support ticket',
    }
  }
}

// List support tickets with filters
export async function listSupportTickets(
  filters: TicketFilterInput,
  userId: string,
  userRole: string,
  dealerId: string | null
) {
  const where: Record<string, unknown> = {}

  // Role-based filtering
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  if (!isAdmin && dealerId) {
    // Dealers can only see their own tickets
    where.dealerId = dealerId
  } else if (filters.dealerId) {
    where.dealerId = filters.dealerId
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    where.category = filters.category
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    where.priority = filters.priority
  }

  // Assigned to filter (admin only)
  if (isAdmin && filters.assignedToId) {
    where.assignedToId = filters.assignedToId
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      (where.createdAt as Record<string, Date>).gte = filters.dateFrom
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, Date>).lte = filters.dateTo
    }
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { ticketNumber: { contains: filters.search } },
      { subject: { contains: filters.search } },
      { description: { contains: filters.search } },
    ]
  }

  // Count total
  const total = await prisma.supportTicket.count({ where })

  // Get paginated results
  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          messages: true,
          attachments: true,
        },
      },
    },
    orderBy: {
      [filters.sortBy]: filters.sortOrder,
    },
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  })

  return {
    tickets,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  }
}

// Get support ticket stats
export async function getSupportTicketStats(
  userRole: string,
  dealerId: string | null
): Promise<{
  total: number
  open: number
  inProgress: number
  pendingDealer: number
  resolved: number
  avgResponseTimeHours: number | null
}> {
  const where: Record<string, unknown> = {}
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  if (!isAdmin && dealerId) {
    where.dealerId = dealerId
  }

  const [total, open, inProgress, pendingDealer, resolved] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { ...where, status: 'open' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'in_progress' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'pending_dealer' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'resolved' } }),
  ])

  // Calculate average response time for resolved tickets
  const ticketsWithResponse = await prisma.supportTicket.findMany({
    where: {
      ...where,
      firstResponseAt: { not: null },
    },
    select: {
      createdAt: true,
      firstResponseAt: true,
    },
    take: 100, // Sample last 100 tickets
    orderBy: { createdAt: 'desc' },
  })

  let avgResponseTimeHours: number | null = null
  if (ticketsWithResponse.length > 0) {
    const totalHours = ticketsWithResponse.reduce((sum, ticket) => {
      if (ticket.firstResponseAt) {
        const diff = ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()
        return sum + diff / (1000 * 60 * 60)
      }
      return sum
    }, 0)
    avgResponseTimeHours = Math.round((totalHours / ticketsWithResponse.length) * 10) / 10
  }

  return {
    total,
    open,
    inProgress,
    pendingDealer,
    resolved,
    avgResponseTimeHours,
  }
}

// Get a single ticket by ID or ticket number
export async function getSupportTicket(
  ticketIdOrNumber: string,
  userId: string,
  userRole: string,
  dealerId: string | null
) {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      OR: [
        { id: ticketIdOrNumber },
        { ticketNumber: ticketIdOrNumber },
      ],
    },
    include: {
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      attachments: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!ticket) {
    return null
  }

  // Check access
  if (!isAdmin && dealerId !== ticket.dealerId) {
    return null
  }

  // Filter internal messages for non-admin users
  if (!isAdmin) {
    ticket.messages = ticket.messages.filter((m) => !m.isInternal)
  }

  return ticket
}

// Add a message to a ticket
export async function addTicketMessage(
  data: AddTicketMessageInput,
  userId: string,
  userRole: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  try {
    // Get ticket to verify access and update status
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      include: {
        dealer: true,
      },
    })

    if (!ticket) {
      return { success: false, error: 'Ticket not found' }
    }

    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        userId,
        content: data.content,
        isInternal: isAdmin ? data.isInternal : false, // Only admins can post internal notes
        isSystemMessage: false,
      },
    })

    // Update ticket status and first response time if this is an admin response
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (isAdmin && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date()
    }

    // Update status based on who replied
    if (isAdmin && !data.isInternal) {
      // Admin responded - if pending_dealer or open, move to in_progress
      if (['open', 'pending_dealer'].includes(ticket.status)) {
        updateData.status = 'in_progress'
      }
    } else if (!isAdmin) {
      // Dealer responded - if pending_dealer, move back to in_progress
      if (ticket.status === 'pending_dealer') {
        updateData.status = 'in_progress'
      }
    }

    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: updateData,
    })

    return {
      success: true,
      messageId: message.id,
    }
  } catch (error) {
    console.error('Add ticket message error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add message',
    }
  }
}

// Update ticket status
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  userId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return { success: false, error: 'Ticket not found' }
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    // Set resolved/closed timestamps
    if (status === 'resolved') {
      updateData.resolvedAt = new Date()
    } else if (status === 'closed') {
      updateData.closedAt = new Date()
    }

    await prisma.$transaction([
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
      }),
      // Add system message about status change
      prisma.ticketMessage.create({
        data: {
          ticketId,
          userId,
          content: note || `Status changed to ${status.replace('_', ' ')}`,
          isInternal: false,
          isSystemMessage: true,
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Update ticket status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}

// Assign ticket to a user
export async function assignTicket(
  ticketId: string,
  assignedToId: string | null,
  assignedById: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return { success: false, error: 'Ticket not found' }
    }

    // If assigning to someone, verify they exist and are admin/staff
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { role: true },
      })

      if (!assignee || !['super_admin', 'admin'].includes(assignee.role)) {
        return { success: false, error: 'Invalid assignee' }
      }
    }

    await prisma.$transaction([
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedToId,
          status: assignedToId && ticket.status === 'open' ? 'in_progress' : ticket.status,
          updatedAt: new Date(),
        },
      }),
      // Add system message about assignment
      prisma.ticketMessage.create({
        data: {
          ticketId,
          userId: assignedById,
          content: assignedToId
            ? 'Ticket has been assigned to a support representative'
            : 'Ticket has been unassigned',
          isInternal: true,
          isSystemMessage: true,
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Assign ticket error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign ticket',
    }
  }
}

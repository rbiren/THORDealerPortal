/**
 * Support Ticket Service
 * Phase 8.1: Communication Hub - Ticket management
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreateTicketInput {
  dealerId: string;
  submittedById: string;
  category: string;
  subcategory?: string;
  subject: string;
  description: string;
  priority?: string;
}

export interface UpdateTicketInput {
  category?: string;
  subcategory?: string;
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedToId?: string | null;
  resolutionNotes?: string;
  satisfactionRating?: number;
}

export interface TicketMessageInput {
  ticketId: string;
  userId: string;
  content: string;
  isInternal?: boolean;
}

export interface TicketFilterOptions {
  dealerId?: string;
  status?: string | string[];
  priority?: string | string[];
  category?: string;
  assignedToId?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// SLA Configuration (in hours)
const SLA_CONFIG = {
  urgent: { response: 1, resolution: 4 },
  high: { response: 4, resolution: 24 },
  normal: { response: 24, resolution: 72 },
  low: { response: 48, resolution: 168 }, // 1 week
};

/**
 * Generate a unique ticket number
 */
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  const lastTicket = await prisma.supportTicket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
  });

  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

/**
 * Calculate SLA due dates based on priority
 */
function calculateSLADates(priority: string): { slaResponseDue: Date; slaResolutionDue: Date } {
  const config = SLA_CONFIG[priority as keyof typeof SLA_CONFIG] || SLA_CONFIG.normal;
  const now = new Date();

  return {
    slaResponseDue: new Date(now.getTime() + config.response * 60 * 60 * 1000),
    slaResolutionDue: new Date(now.getTime() + config.resolution * 60 * 60 * 1000),
  };
}

/**
 * Create a new support ticket
 */
export async function createTicket(input: CreateTicketInput) {
  const ticketNumber = await generateTicketNumber();
  const priority = input.priority || 'normal';
  const { slaResponseDue, slaResolutionDue } = calculateSLADates(priority);

  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      dealerId: input.dealerId,
      submittedById: input.submittedById,
      category: input.category,
      subcategory: input.subcategory,
      subject: input.subject,
      description: input.description,
      priority,
      status: 'open',
      slaResponseDue,
      slaResolutionDue,
    },
    include: {
      dealer: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Get a ticket by ID or ticket number
 */
export async function getTicket(idOrNumber: string) {
  const isTicketNumber = idOrNumber.startsWith('TKT-');

  return prisma.supportTicket.findFirst({
    where: isTicketNumber
      ? { ticketNumber: idOrNumber }
      : { id: idOrNumber },
    include: {
      dealer: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      messages: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      attachments: true,
    },
  });
}

/**
 * List tickets with filtering and pagination
 */
export async function listTickets(
  filters: TicketFilterOptions = {},
  pagination: PaginationOptions = {}
) {
  const {
    dealerId,
    status,
    priority,
    category,
    assignedToId,
    search,
  } = filters;

  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = pagination;

  const where: Prisma.SupportTicketWhereInput = {};

  if (dealerId) where.dealerId = dealerId;
  if (category) where.category = category;
  if (assignedToId) where.assignedToId = assignedToId;

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (priority) {
    where.priority = Array.isArray(priority) ? { in: priority } : priority;
  }

  if (search) {
    where.OR = [
      { ticketNumber: { contains: search } },
      { subject: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, code: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a support ticket
 */
export async function updateTicket(id: string, input: UpdateTicketInput, userId?: string) {
  const currentTicket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!currentTicket) throw new Error('Ticket not found');

  const updateData: Prisma.SupportTicketUpdateInput = {};

  if (input.category !== undefined) updateData.category = input.category;
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.assignedToId !== undefined) updateData.assignedTo = input.assignedToId
    ? { connect: { id: input.assignedToId } }
    : { disconnect: true };
  if (input.resolutionNotes !== undefined) updateData.resolutionNotes = input.resolutionNotes;
  if (input.satisfactionRating !== undefined) updateData.satisfactionRating = input.satisfactionRating;

  // Handle priority change (recalculate SLA)
  if (input.priority && input.priority !== currentTicket.priority) {
    updateData.priority = input.priority;
    const { slaResponseDue, slaResolutionDue } = calculateSLADates(input.priority);
    if (!currentTicket.firstResponseAt) {
      updateData.slaResponseDue = slaResponseDue;
    }
    updateData.slaResolutionDue = slaResolutionDue;
  }

  // Handle status changes
  if (input.status && input.status !== currentTicket.status) {
    updateData.status = input.status;

    if (input.status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (input.status === 'closed') {
      updateData.closedAt = new Date();
    }

    // Create system message for status change
    if (userId) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: id,
          userId,
          content: `Status changed from "${currentTicket.status}" to "${input.status}"`,
          isSystemMessage: true,
        },
      });
    }
  }

  return prisma.supportTicket.update({
    where: { id },
    data: updateData,
    include: {
      dealer: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Assign a ticket to a user
 */
export async function assignTicket(ticketId: string, assignedToId: string, assignedById: string) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId,
      status: 'in_progress',
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Create system message
  await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId: assignedById,
      content: `Ticket assigned to ${ticket.assignedTo?.firstName} ${ticket.assignedTo?.lastName}`,
      isSystemMessage: true,
    },
  });

  return ticket;
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(input: TicketMessageInput) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error('Ticket not found');

  // Create message
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: input.ticketId,
      userId: input.userId,
      content: input.content,
      isInternal: input.isInternal || false,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });

  // Track first response for SLA
  if (!ticket.firstResponseAt && !input.isInternal) {
    await prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: { firstResponseAt: new Date() },
    });
  }

  return message;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(dealerId?: string) {
  const where: Prisma.SupportTicketWhereInput = dealerId ? { dealerId } : {};

  const [
    total,
    open,
    inProgress,
    pendingDealer,
    resolved,
    overdueSLA,
  ] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { ...where, status: 'open' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'in_progress' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'pending_dealer' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'resolved' } }),
    prisma.supportTicket.count({
      where: {
        ...where,
        status: { in: ['open', 'in_progress', 'pending_dealer'] },
        slaResolutionDue: { lt: new Date() },
      },
    }),
  ]);

  // Calculate average resolution time for closed tickets
  const closedTickets = await prisma.supportTicket.findMany({
    where: { ...where, status: 'closed', resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
    take: 100,
    orderBy: { resolvedAt: 'desc' },
  });

  let avgResolutionHours = 0;
  if (closedTickets.length > 0) {
    const totalHours = closedTickets.reduce((sum, ticket) => {
      if (ticket.resolvedAt) {
        const hours = (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);
    avgResolutionHours = Math.round(totalHours / closedTickets.length);
  }

  return {
    total,
    byStatus: {
      open,
      inProgress,
      pendingDealer,
      resolved,
    },
    overdueSLA,
    avgResolutionHours,
  };
}

/**
 * Escalate a ticket
 */
export async function escalateTicket(ticketId: string, escalatedById: string, reason?: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found');

  const newLevel = ticket.escalationLevel + 1;

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      escalationLevel: newLevel,
      escalatedAt: new Date(),
      priority: newLevel >= 2 ? 'urgent' : 'high',
    },
  });

  // Create system message
  await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId: escalatedById,
      content: `Ticket escalated to level ${newLevel}${reason ? `: ${reason}` : ''}`,
      isSystemMessage: true,
      isInternal: true,
    },
  });

  return getTicket(ticketId);
}

/**
 * Get tickets requiring attention (overdue SLA)
 */
export async function getOverdueTickets() {
  const now = new Date();

  return prisma.supportTicket.findMany({
    where: {
      status: { in: ['open', 'in_progress', 'pending_dealer'] },
      OR: [
        { slaResponseDue: { lt: now }, firstResponseAt: null },
        { slaResolutionDue: { lt: now } },
      ],
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { slaResolutionDue: 'asc' },
  });
}

/**
 * Get tickets by assignee with workload info
 */
export async function getAssigneeWorkload() {
  const assignees = await prisma.supportTicket.groupBy({
    by: ['assignedToId'],
    where: {
      assignedToId: { not: null },
      status: { in: ['open', 'in_progress', 'pending_dealer'] },
    },
    _count: { id: true },
  });

  const assigneeDetails = await Promise.all(
    assignees.map(async (a) => {
      if (!a.assignedToId) return null;

      const user = await prisma.user.findUnique({
        where: { id: a.assignedToId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      const urgentCount = await prisma.supportTicket.count({
        where: {
          assignedToId: a.assignedToId,
          status: { in: ['open', 'in_progress'] },
          priority: 'urgent',
        },
      });

      return {
        user,
        totalOpen: a._count.id,
        urgentCount,
      };
    })
  );

  return assigneeDetails.filter(Boolean);
}
